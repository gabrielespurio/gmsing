"use client";

import { useState, useTransition } from "react";
import {
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { receivePaymentAction } from "@/domains/quotes/actions";

export interface ReceivableItem {
  id: string;
  description: string;
  installmentNumber: number;
  totalInstallments: number;
  amountCents: number;
  paidAmountCents: number;
  dueDate: Date;
  paymentMethod: string;
  status: string;
  clientName: string;
  orderCode: string | null;
}

interface FinancialTableProps {
  receivables: ReceivableItem[];
}

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

export function FinancialTable({ receivables }: FinancialTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ITEMS_PER_PAGE = 10;
  const now = new Date();

  const filteredReceivables = receivables.filter((r) => {
    const isOverdue = r.status === "pendente" && new Date(r.dueDate) < now;

    if (statusFilter === "pendente" && r.status !== "pendente") return false;
    if (statusFilter === "pago" && r.status !== "pago") return false;
    if (statusFilter === "vencido" && !isOverdue) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchClient = r.clientName?.toLowerCase().includes(q);
      const matchOrder = r.orderCode?.toLowerCase().includes(q);
      return matchDesc || matchClient || matchOrder;
    }
    return true;
  });

  const paginatedReceivables = filteredReceivables.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleReceive = (id: string, paymentMethod: string) => {
    if (window.confirm("Deseja confirmar a baixa e quitação desta parcela?")) {
      setLoadingId(id);
      startTransition(async () => {
        try {
          await receivePaymentAction(id, paymentMethod);
        } finally {
          setLoadingId(null);
        }
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Search and Filters Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por descrição, cliente ou código do pedido..."
            className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filtrar lançamentos"
            className="h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
          >
            <option value="all">Todos os Lançamentos ({receivables.length})</option>
            <option value="pendente">Apenas Pendentes</option>
            <option value="vencido">Apenas Vencidos</option>
            <option value="pago">Quitados / Pagos</option>
          </select>
        </div>
      </div>

      {filteredReceivables.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Nenhum lançamento encontrado</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {receivables.length === 0
              ? "Ao aprovar um orçamento e convertê-lo em pedido, as parcelas financeiras serão registradas automaticamente aqui."
              : "Nenhum resultado corresponde à busca ou filtro selecionado."}
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
              {paginatedReceivables.map((r) => {
                const isOverdue = r.status === "pendente" && new Date(r.dueDate) < now;
                const isItemLoading = loadingId === r.id;

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
                        <button
                          type="button"
                          disabled={isItemLoading}
                          onClick={() => handleReceive(r.id, r.paymentMethod)}
                          className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {isItemLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>Baixar Pagamento</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            totalItems={filteredReceivables.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
