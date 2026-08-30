import { requireUser } from "@/lib/auth";
import { Shell } from "@/components/layout/shell";
export const dynamic = "force-dynamic";
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <Shell name={user.name ?? "Your account"} email={user.email ?? ""}>
      {children}
    </Shell>
  );
}
