export const instant = false;

import { db } from "@/db";
import { accountsReceivable, clients, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { DollarSign, CheckCircle2, Clock, AlertTriangle, CreditCard, ArrowDownRight } from "lucide-react";
import { receivePaymentAction } from "@/domains/quotes/actions";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default async function FinancialPage() {
  const receivables = await db
    .select({
      id: accountsReceivable.id,
      description: accountsReceivable.description,
      installmentNumber: accountsReceivable.installmentNumber,
      totalInstallments: accountsReceivable.totalInstallments,
      amountCents: accountsReceivable.amountCents,
      paidAmountCents: accountsReceivable.paidAmountCents,
      dueDate: accountsReceivable.dueDate,
      paymentMethod: accountsReceivable.paymentMethod,
      status: accountsReceivable.status,
      clientName: clients.name,
      orderCode: orders.code,
    })
    .from(accountsReceivable)
    .innerJoin(clients, eq(accountsReceivable.clientId, clients.id))
    .leftJoin(orders, eq(accountsReceivable.orderId, orders.id))
    .orderBy(accountsReceivable.dueDate);

  const totalAmount = receivables.reduce((acc, r) => acc + r.amountCents, 0);
  const paidAmount = receivables.reduce((acc, r) => acc + r.paidAmountCents, 0);
  const pendingReceivables = receivables.filter((r) => r.status === "pendente");
  const pendingAmount = pendingReceivables.reduce((acc, r) => acc + r.amountCents, 0);

  const now = new Date();
  const overdueCount = pendingReceivables.filter((r) => new Date(r.dueDate) < now).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
          Controle Financeiro & Contas a Receber
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Recebimentos gerados automaticamente a partir dos pedidos de comunicação visual.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">A Receber Total</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 font-mono">
              {formatCurrency(pendingAmount)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Recebidos Efetivados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono">
              {formatCurrency(paidAmount)}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Vencidos / Atenção</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 font-mono">{overdueCount}</span>
            <span className="text-xs text-slate-500">parcelas pendentes</span>
          </div>
        </div>
      </div>

      {/* Receivables Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 text-sm">Parcelas a Receber</h2>
          <span className="text-xs text-slate-500">{receivables.length} lançamentos</span>
        </div>

        {receivables.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Nenhum lançamento a receber</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Ao aprovar um orçamento e convertê-lo em pedido, as parcelas financeiras serão registradas automaticamente aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Descrição / Origem</th>
                  <th className="px-6 py-3.5">Cliente</th>
                  <th className="px-6 py-3.5">Forma</th>
                  <th className="px-6 py-3.5">Vencimento</th>
                  <th className="px-6 py-3.5">Valor</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receivables.map((r) => {
                  const isOverdue = r.status === "pendente" && new Date(r.dueDate) < now;
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{r.description}</div>
                        {r.orderCode && (
                          <div className="text-xs font-mono text-[#B87A52]">{r.orderCode}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{r.clientName}</td>
                      <td className="px-6 py-4">
                        <span className="uppercase text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-mono text-xs font-medium ${
                            isOverdue ? "text-rose-600 font-bold" : "text-slate-600"
                          }`}
                        >
                          {formatDate(r.dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-600 font-semibold block">Vencido</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        {formatCurrency(r.amountCents)}
                      </td>
                      <td className="px-6 py-4">
                        {r.status === "pago" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Quitado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {r.status === "pendente" && (
                          <form
                            action={async () => {
                              "use server";
                              await receivePaymentAction(r.id, r.paymentMethod);
                            }}
                          >
                            <button
                              type="submit"
                              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
                            >
                              Baixar Pagamento
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
