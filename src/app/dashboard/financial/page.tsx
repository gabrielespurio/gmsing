export const instant = false;

import { db } from "@/db";
import { accountsReceivable, clients, orders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { DollarSign, CheckCircle2, Clock, AlertTriangle, CreditCard, ArrowDownRight } from "lucide-react";
import { FinancialTable } from "./financial-table";

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
      <FinancialTable receivables={receivables} />
    </div>
  );
}
