import "dotenv/config";
import { runCycle } from "../src/services/monitoring.service";
import { db } from "../src/lib/db";
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
async function main() {
  console.info(
    "PulseWatch worker started. Polling every 5 seconds; concurrency 5.",
  );
  while (!stopping) {
    try {
      await runCycle();
    } catch (error) {
      console.error("Worker cycle failed; retrying next cycle.", error);
    }
    for (let i = 0; i < 10 && !stopping; i++)
      await new Promise((resolve) => setTimeout(resolve, 500));
  }
  await db.$disconnect();
  console.info("Worker stopped.");
}
main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exitCode = 1;
});
