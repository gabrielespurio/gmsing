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
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
