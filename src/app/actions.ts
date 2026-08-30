"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { monitorSchema } from "@/lib/validation";
import { resolvePublicUrl } from "@/lib/monitoring/url";
import {
  updateOwnedMonitor,
  deleteOwnedMonitor,
} from "@/services/monitor.service";
export type FormState = { error: string } | null;
export async function saveMonitor(
  id: string | null,
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = monitorSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await resolvePublicUrl(parsed.data.url);
  } catch {
    return {
      error:
        "That URL is not allowed or its hostname could not be resolved. Use a public HTTP or HTTPS address.",
    };
  }
  let savedId = id;
  try {
    if (id) {
      const result = await updateOwnedMonitor(id, user.id, parsed.data);
      if (!result.count) return { error: "Monitor could not be found." };
    } else {
      if ((await db.monitor.count({ where: { userId: user.id } })) >= 200)
        return { error: "The MVP supports up to 200 monitors per account." };
      savedId = (
        await db.monitor.create({ data: { ...parsed.data, userId: user.id } })
      ).id;
    }
  } catch (error) {
    console.error("Monitor save failed", error);
    return { error: "Unable to save monitor. Please try again." };
  }
  revalidatePath("/", "layout");
  redirect(`/monitors/${savedId}`);
}
export async function toggleMonitor(id: string, isActive: boolean) {
  const user = await requireUser();
  if (typeof id !== "string" || typeof isActive !== "boolean")
    return { error: "Invalid monitor settings." };
  const result = await updateOwnedMonitor(id, user.id, { isActive });
  if (!result.count) return { error: "Monitor could not be found." };
  revalidatePath("/", "layout");
  return { ok: true };
}
export async function deleteMonitor(id: string) {
  const user = await requireUser();
  const result = await deleteOwnedMonitor(id, user.id);
  if (!result.count) return { error: "Monitor could not be found." };
  revalidatePath("/", "layout");
  return { ok: true };
}
