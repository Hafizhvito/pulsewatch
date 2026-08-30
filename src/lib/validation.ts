import { z } from "zod";
export const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(72),
});
export const registerSchema = loginSchema
  .extend({
    name: z.string().trim().min(2).max(80),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(72)
      .refine(
        (v) => Buffer.byteLength(v, "utf8") <= 72,
        "Password must be at most 72 bytes.",
      ),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export const monitorSchema = z.object({
  name: z.string().trim().min(1).max(100),
  url: z.url().max(2048),
  method: z.enum(["GET", "POST", "HEAD"]).default("GET"),
  expectedStatus: z.coerce.number().int().min(100).max(599).default(200),
  intervalMinutes: z.coerce.number().int().min(1).max(1440).default(5),
  timeoutMs: z.coerce.number().int().min(1000).max(30000).default(10000),
});
