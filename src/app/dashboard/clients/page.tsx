export const instant = false;

import { db } from "@/db";
import { clients, quotes, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Users, Phone, Mail, MapPin, Plus, FileText, ShoppingBag } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function ClientsPage() {
  const clientList = await db
    .select()
    .from(clients)
    .where(eq(clients.active, true))
    .orderBy(clients.name);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
            Carteira de Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Empresas, comércios e pessoas físicas com propostas de comunicação visual e fachadas.
          </p>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Clientes Ativos</h2>
          <span className="text-xs text-slate-500">{clientList.length} clientes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Cliente / Razão Social</th>
                <th className="px-6 py-3.5">Nome Fantasia</th>
                <th className="px-6 py-3.5">Documento</th>
                <th className="px-6 py-3.5">Contato</th>
                <th className="px-6 py-3.5">Localização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientList.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    {c.contactPerson && (
                      <div className="text-xs text-slate-400">Resp: {c.contactPerson}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c.tradeName || "-"}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{c.document || "-"}</td>
                  <td className="px-6 py-4 text-xs">
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone className="w-3 h-3 text-[#B87A52]" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{c.city ? `${c.city} - ${c.state || "SP"}` : "-"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
