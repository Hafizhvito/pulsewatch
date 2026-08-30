import "dotenv/config";
import bcrypt from "bcrypt";
import { db } from "../src/lib/db";
async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Demo seeding is disabled in production.");
  const email = process.env.SEED_EMAIL,
    password = process.env.SEED_PASSWORD;
  if (!email || !password || password.length < 10)
    throw new Error(
      "Set SEED_EMAIL and SEED_PASSWORD (10+ characters) before running the development seed.",
    );
  if (await db.user.findUnique({ where: { email } }))
    throw new Error("Seed account already exists. Refusing to overwrite it.");
  await db.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          name: "Demo workspace",
          email,
          passwordHash: await bcrypt.hash(password, 12),
        },
      });
      for (const [name, url] of [
        ["Example website", "https://example.com"],
        ["Wikipedia", "https://www.wikipedia.org"],
        ["GitHub API", "https://api.github.com"],
      ]) {
        const now = new Date();
        const monitor = await tx.monitor.create({
          data: {
            userId: user.id,
            name: `${name} (demo)`,
            url,
            currentStatus: "UP",
            lastCheckedAt: now,
            lastResponseTime: 120,
          },
        });
        await tx.monitorCheck.createMany({
          data: Array.from({ length: 288 }, (_, i) => ({
            monitorId: monitor.id,
            status:
              name === "Example website" && (i === 120 || i === 121)
                ? "DOWN"
                : "UP",
            statusCode:
              name === "Example website" && (i === 120 || i === 121)
                ? 503
                : 200,
            responseTimeMs: 100 + ((i * 37) % 170),
            checkedAt: new Date(now.getTime() - (287 - i) * 300000),
            errorMessage:
              name === "Example website" && (i === 120 || i === 121)
                ? "Demo: HTTP 503"
                : null,
          })),
        });
        if (name === "Example website")
          await tx.incident.create({
            data: {
              monitorId: monitor.id,
              startedAt: new Date(now.getTime() - 167 * 300000),
              resolvedAt: new Date(now.getTime() - 165 * 300000),
              cause: "Demo: HTTP 503",
            },
          });
      }
    },
    { timeout: 20000 },
  );
  console.info(
    "Development demo data created. These historical checks are synthetic; the worker will perform real checks from now on.",
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
