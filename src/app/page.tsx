import Image from "next/image";
import { LoginForm } from "./login-form";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-navy via-navy to-navy-dark px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl ring-1 ring-copper/40">
        <Image
          src="/logo_gmsign.jpeg"
          alt="GM Sign"
          width={1024}
          height={559}
          priority
          className="mx-auto mb-6 h-auto w-56"
        />
        <h1 className="mb-1 text-center text-xl font-semibold text-navy">
          Acesse sua conta
        </h1>
        <p className="mb-6 text-center text-sm text-navy/60">
          Entre com suas credenciais para continuar.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
