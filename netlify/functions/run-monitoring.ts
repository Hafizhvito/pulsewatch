import type { Config } from "@netlify/functions";
import { db } from "../../src/lib/db";
import { runCycle } from "../../src/services/monitoring.service";

const runMonitoring = async () => {
  try {
    await runCycle();
  } finally {
    await db.$disconnect();
  }
};

export default runMonitoring;

export const config: Config = {
  schedule: "* * * * *",
};
