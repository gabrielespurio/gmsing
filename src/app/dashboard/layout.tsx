export const instant = false;
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { Sidebar } from "@/components/sidebar/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
  const user = verifySessionToken(sessionToken);

  if (!user) {
    redirect("/");
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      <Sidebar user={user} />
      <main className="flex-1 overflow-y-auto p-8 h-screen">
        {children}
      </main>
    </div>
  );
}
