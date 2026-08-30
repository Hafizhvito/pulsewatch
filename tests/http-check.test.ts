import { test, mock } from "node:test";
import assert from "node:assert/strict";
import dns from "node:dns/promises";
import https from "node:https";
import { EventEmitter } from "node:events";
import { checkEndpoint } from "../src/lib/monitoring/check";
const monitor = {
  url: "https://example.com",
  method: "GET",
  timeoutMs: 1000,
  expectedStatus: 200,
};
type MockOptions = {
  agent: boolean;
  signal: AbortSignal;
  lookup: (
    host: string,
    options: object,
    callback: (error: unknown, address: string) => void,
  ) => void;
};
test("HTTP checker pins DNS and evaluates status without following redirects", async () => {
  mock.method(dns, "lookup", async () => [
    { address: "93.184.216.34", family: 4 },
  ]);
  let status = 200;
  let requests = 0;
  mock.method(
    https,
    "request",
    (
      _url: URL,
      options: MockOptions,
      callback: (response: { statusCode: number; destroy: () => void }) => void,
    ) => {
      requests++;
      assert.equal(options.agent, false);
      options.lookup("example.com", {}, (error: unknown, address: string) => {
        assert.equal(error, null);
        assert.equal(address, "93.184.216.34");
      });
      const request = new EventEmitter() as EventEmitter & { end: () => void };
      request.end = () => callback({ statusCode: status, destroy: () => {} });
      return request;
    },
  );
  try {
    assert.equal((await checkEndpoint(monitor)).status, "UP");
    status = 204;
    assert.equal((await checkEndpoint(monitor)).status, "DOWN");
    status = 302;
    assert.equal((await checkEndpoint(monitor)).statusCode, 302);
    assert.equal(requests, 3);
  } finally {
    mock.restoreAll();
  }
});
test("HTTP checker aborts hanging requests and reports timeout", async () => {
  mock.method(dns, "lookup", async () => [
    { address: "93.184.216.34", family: 4 },
  ]);
  mock.method(https, "request", (_url: URL, options: MockOptions) => {
    const request = new EventEmitter() as EventEmitter & { end: () => void };
    request.end = () => {};
    options.signal.addEventListener("abort", () =>
      request.emit("error", new Error("aborted")),
    );
    return request;
  });
  try {
    const result = await checkEndpoint({ ...monitor, timeoutMs: 20 });
    assert.equal(result.status, "DOWN");
    assert.equal(result.responseTimeMs, null);
    assert.match(result.errorMessage ?? "", /timed out/);
  } finally {
    mock.restoreAll();
  }
});
test("HTTP checker refuses mixed public/private DNS answers", async () => {
  mock.method(dns, "lookup", async () => [
    { address: "93.184.216.34", family: 4 },
    { address: "10.0.0.1", family: 4 },
  ]);
  const request = mock.method(https, "request", () => {
    throw new Error("Should not request");
  });
  try {
    const result = await checkEndpoint(monitor);
    assert.equal(result.status, "DOWN");
    assert.match(result.errorMessage ?? "", /restricted/);
    assert.equal(request.mock.callCount(), 0);
  } finally {
    mock.restoreAll();
  }
});
