import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  if (!rateLimit("register", 30, 60000))
    return Response.json(
      { error: "Please wait a minute and try again." },
      { status: 429 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const result = registerSchema.safeParse(body);
  if (!result.success)
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  try {
    const { name, email, password } = result.data;
    await db.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return Response.json(
        { error: "Unable to register with that email. Try signing in." },
        { status: 409 },
      );
    console.error("Registration failed", error);
    return Response.json(
      { error: "Unable to create your account. Please try again." },
      { status: 500 },
    );
  }
}
