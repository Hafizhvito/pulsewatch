import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
export function isPublicAddress(address: string) {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
}
export function parsePublicUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid HTTP or HTTPS URL.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new Error("Use HTTP or HTTPS without credentials or fragments.");
  if (!hostname.includes(".") && !ipaddr.isValid(hostname))
    throw new Error("That URL is not allowed.");
  if (
    ["localhost", "local", "internal", "lan", "home", "test", "invalid"].some(
      (s) => hostname === s || hostname.endsWith(`.${s}`),
    ) ||
    hostname.endsWith(".")
  )
    throw new Error("That URL is not allowed.");
  if (ipaddr.isValid(hostname) && !isPublicAddress(hostname))
    throw new Error("That URL is not allowed.");
  return url;
}
export async function resolvePublicUrl(value: string, timeoutMs = 5000) {
  const url = parsePublicUrl(value);
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    lookup(hostname, { all: true, verbatim: true }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error("DNS lookup timed out.")),
        timeoutMs,
      );
    }),
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error("That URL resolves to a restricted network.");
  return { url, address: addresses[0] };
}
