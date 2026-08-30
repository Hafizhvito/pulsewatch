import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { persistResult } from "../src/services/monitoring.service";
import {
  ownedMonitor,
  updateOwnedMonitor,
  deleteOwnedMonitor,
  listMonitors,
} from "../src/services/monitor.service";
import { listIncidents } from "../src/services/incident.service";
import {
  monitorAnalytics,
  responseHistory,
} from "../src/services/analytics.service";
test(
  "MySQL: leases fence writes, downtime is deduplicated, recovery resolves",
  { skip: process.env.INTEGRATION_TESTS !== "1" },
  async () => {
    const user = await db.user.create({
      data: {
        name: "Integration test",
        email: `integration-${randomUUID()}@example.com`,
        passwordHash: "not-a-login-hash",
      },
    });
    try {
      const monitor = await db.monitor.create({
        data: { userId: user.id, name: "Test", url: "https://example.com" },
      });
      const down = {
        status: "DOWN" as const,
        statusCode: 503,
        responseTimeMs: 20,
        errorMessage: "HTTP 503",
        checkedAt: new Date(),
      };
      const otherUser = "not-this-monitors-owner";
      await assert.rejects(() => ownedMonitor(monitor.id, otherUser));
      assert.equal(
        (
          await updateOwnedMonitor(monitor.id, otherUser, {
            name: "Unauthorized edit",
            isActive: false,
          })
        ).count,
        0,
      );
      assert.equal((await deleteOwnedMonitor(monitor.id, otherUser)).count, 0);
      assert.equal((await listMonitors(otherUser)).length, 0);
      assert.equal(
        await persistResult(monitor.id, "invalid-lease", down),
        false,
      );
      const save = async (status: "UP" | "DOWN") => {
        const token = randomUUID();
        await db.monitor.update({
          where: { id: monitor.id },
          data: { leaseToken: token, leaseUntil: new Date(Date.now() + 60000) },
        });
        const result = {
          ...down,
          status,
          statusCode: status === "UP" ? 200 : 503,
          errorMessage: status === "UP" ? null : "HTTP 503",
          checkedAt: new Date(),
        };
        await Promise.all([
          persistResult(monitor.id, token, result),
          persistResult(monitor.id, token, result),
        ]);
      };
      await save("DOWN");
      await save("DOWN");
      assert.equal(
        await db.incident.count({
          where: { monitorId: monitor.id, resolvedAt: null },
        }),
        1,
      );
      assert.equal(
        await db.monitorCheck.count({ where: { monitorId: monitor.id } }),
        2,
      );
      await save("UP");
      assert.equal((await listIncidents(otherUser, 1, monitor.id)).total, 0);
      assert.deepEqual(await monitorAnalytics(otherUser, 1, monitor.id), {});
      assert.equal((await responseHistory(otherUser, monitor.id)).length, 0);
      const analytics = await monitorAnalytics(user.id, 1, monitor.id);
      assert.equal(analytics[monitor.id].successful, 1);
      assert.equal(analytics[monitor.id].failed, 2);
      assert.equal(analytics[monitor.id].total, 3);
      assert.equal(
        await db.incident.count({
          where: { monitorId: monitor.id, resolvedAt: null },
        }),
        0,
      );
      assert.equal(
        (await db.monitor.findUniqueOrThrow({ where: { id: monitor.id } }))
          .currentStatus,
        "UP",
      );
      const token = randomUUID();
      await db.monitor.update({
        where: { id: monitor.id },
        data: {
          isActive: false,
          leaseToken: token,
          leaseUntil: new Date(Date.now() + 60000),
        },
      });
      assert.equal(await persistResult(monitor.id, token, down), false);
    } finally {
      await db.user.delete({ where: { id: user.id } });
      await db.$disconnect();
    }
  },
);
