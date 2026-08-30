import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { db } from "./db";
import { loginSchema } from "./validation";
import { rateLimit } from "./rate-limit";
export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (
          !parsed.success ||
          !rateLimit(`login:${parsed.data.email}`, 10, 15 * 60000)
        )
          return null;
        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        // Constant-work comparison also for unknown accounts.
        const valid = await bcrypt.compare(
          parsed.data.password,
          user?.passwordHash ??
            "$2b$12$TFrQlMvPOhxDlLwL15McPeKYpcOiMQfdxeRxRcROQsJl.fEQDfErO",
        );
        return user && valid
          ? { id: user.id, name: user.name, email: user.email }
          : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};
export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session.user;
}
