import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logout } from "../actions";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

async function Protected() {
  const jar = await cookies();
  const session = verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/");

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl ring-1 ring-copper/40">
      <h1 className="mb-2 text-2xl font-semibold text-navy">Bem-vindo!</h1>
      <p className="mb-6 text-navy/70">
        Você está logado como <strong>{session.email}</strong>.
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-lg bg-linear-to-r from-copper to-copper-light px-6 py-3 font-semibold text-navy shadow-md transition hover:brightness-105"
        >
          Sair
        </button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-navy via-navy to-navy-dark px-4">
      <Suspense fallback={<p className="text-white/70">Carregando...</p>}>
        <Protected />
      </Suspense>
    </main>
  );
}
