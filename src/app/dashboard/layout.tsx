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
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy/5 text-navy border border-navy/10 uppercase tracking-wider">
              Painel Operacional
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-500 font-medium">GM Sign Solutions v1.0</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Ambiente: <strong className="text-emerald-600 font-semibold">Produção Neon SQL</strong></span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
