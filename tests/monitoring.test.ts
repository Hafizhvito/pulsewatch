import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isDue,
  uptime,
  evaluateStatus,
  incidentAction,
} from "../src/lib/monitoring/rules";
import { isPublicAddress, parsePublicUrl } from "../src/lib/monitoring/url";
import { monitorSchema, registerSchema } from "../src/lib/validation";
test("uptime handles empty history and partial failures", () => {
  assert.equal(uptime(0, 0), null);
  assert.equal(uptime(99, 100), 99);
  assert.equal(uptime(0, 10), 0);
});
test("only the exact expected HTTP status is UP", () => {
  assert.equal(evaluateStatus(200, 200), "UP");
  assert.equal(evaluateStatus(204, 200), "DOWN");
  assert.equal(evaluateStatus(500, 500), "UP");
});
test("incidents open once and resolve on recovery", () => {
  assert.equal(incidentAction("UNKNOWN", "DOWN"), "open");
  assert.equal(incidentAction("UP", "DOWN"), "open");
  assert.equal(incidentAction("DOWN", "DOWN"), "none");
  assert.equal(incidentAction("DOWN", "UP"), "resolve");
  assert.equal(incidentAction("UP", "UP"), "none");
});
test("scheduling respects intervals and pause", () => {
  const now = new Date("2026-01-01T00:05:00Z");
  const monitor = {
    isActive: true,
    intervalMinutes: 5,
    lastCheckedAt: new Date("2026-01-01T00:00:00Z"),
  };
  assert.ok(isDue(monitor, now));
  assert.equal(isDue(monitor, new Date(now.getTime() - 1)), false);
  assert.equal(isDue({ ...monitor, isActive: false }, now), false);
  assert.ok(isDue({ ...monitor, lastCheckedAt: null }, now));
});
test("SSRF rejects private, metadata, mapped, reserved and alternate IP notation", () => {
  for (const value of [
    "http://localhost",
    "http://foo.local",
    "http://127.0.0.1",
    "http://127.1",
    "http://2130706433",
    "http://0x7f000001",
    "http://10.0.0.1",
    "http://172.16.1.1",
    "http://192.168.1.1",
    "http://169.254.169.254",
    "http://100.64.0.1",
    "http://0.0.0.0",
    "http://[::1]",
    "http://[::ffff:127.0.0.1]",
    "http://[fc00::1]",
    "http://[fe80::1]",
    "file:///etc/passwd",
    "ftp://example.com",
    "http://user:pass@example.com",
    "http://internal",
    "http://example.com.",
  ])
    assert.throws(() => parsePublicUrl(value), value);
  assert.ok(parsePublicUrl("https://example.com/health"));
  assert.ok(parsePublicUrl("https://8.8.8.8"));
  assert.ok(isPublicAddress("2606:4700:4700::1111"));
  assert.equal(isPublicAddress("192.0.2.1"), false);
});
test("monitor settings reject unsafe methods and bounds", () => {
  const input = {
    name: "API",
    url: "https://example.com",
    method: "GET",
    timeoutMs: 10000,
    intervalMinutes: 5,
    expectedStatus: 200,
  };
  assert.ok(monitorSchema.safeParse(input).success);
  for (const patch of [
    { method: "DELETE" },
    { timeoutMs: 0 },
    { timeoutMs: 30001 },
    { expectedStatus: 600 },
    { intervalMinutes: 0 },
  ])
    assert.equal(
      monitorSchema.safeParse({ ...input, ...patch }).success,
      false,
    );
});
test("registration validates confirmation and bcrypt byte limit", () => {
  const base = {
    name: "Test",
    email: "test@example.com",
    password: "safe-password-long",
    confirmPassword: "safe-password-long",
  };
  assert.ok(registerSchema.safeParse(base).success);
  assert.equal(
    registerSchema.safeParse({ ...base, confirmPassword: "different" }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({
      ...base,
      password: "🫶".repeat(30),
      confirmPassword: "🫶".repeat(30),
    }).success,
    false,
  );
});
