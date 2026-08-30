import http from "node:http";
import https from "node:https";
import { resolvePublicUrl } from "./url";
import { evaluateStatus } from "./rules";
export type CheckResult = {
  status: "UP" | "DOWN";
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  checkedAt: Date;
};
export async function checkEndpoint(monitor: {
  url: string;
  method: string;
  expectedStatus: number;
  timeoutMs: number;
}): Promise<CheckResult> {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), monitor.timeoutMs);
  try {
    // DNS is checked once, then pinned into the socket lookup to prevent rebinding.
    const resolved = await Promise.race([
      resolvePublicUrl(monitor.url, monitor.timeoutMs),
      new Promise<never>((_, reject) =>
        controller.signal.addEventListener(
          "abort",
          () => reject(new Error("Request timed out.")),
          { once: true },
        ),
      ),
    ]);
    if (controller.signal.aborted) throw new Error("Request timed out.");
    const statusCode = await new Promise<number>((resolve, reject) => {
      const request = (
        resolved.url.protocol === "https:" ? https : http
      ).request(
        resolved.url,
        {
          method: monitor.method,
          signal: controller.signal,
          agent: false,
          headers: { "User-Agent": "PulseWatch/1.0", Accept: "*/*" },
          lookup: (_host, options, callback) => {
            if (options.all) callback(null, [resolved.address]);
            else
              callback(null, resolved.address.address, resolved.address.family);
          },
        },
        (response) => {
          resolve(response.statusCode ?? 0);
          response.destroy();
        },
      );
      request.on("error", reject);
      request.end();
    });
    // Redirects are deliberately not followed: a redirect is evaluated as its own status.
    const status = evaluateStatus(statusCode, monitor.expectedStatus);
    return {
      status,
      statusCode,
      responseTimeMs: Math.round(performance.now() - start),
      errorMessage:
        status === "DOWN"
          ? `Expected HTTP ${monitor.expectedStatus}, received HTTP ${statusCode}.`
          : null,
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      status: "DOWN",
      statusCode: null,
      responseTimeMs: null,
      errorMessage: controller.signal.aborted
        ? `Request timed out after ${monitor.timeoutMs} ms.`
        : (error instanceof Error
            ? error.message
            : "Network request failed."
          ).slice(0, 500),
      checkedAt: new Date(),
    };
  } finally {
    clearTimeout(timer);
  }
}
