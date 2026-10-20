export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { quotes, quoteItems, clients, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  ShoppingBag,
  CreditCard,
  Building,
} from "lucide-react";
import { convertQuoteToOrderAction, updateQuoteStatusAction } from "@/domains/quotes/actions";

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

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [quote] = await db
    .select({
      id: quotes.id,
      code: quotes.code,
      revision: quotes.revision,
      status: quotes.status,
      issueDate: quotes.issueDate,
      validUntil: quotes.validUntil,
      paymentConditions: quotes.paymentConditions,
      deliveryTimeDays: quotes.deliveryTimeDays,
      commercialNotes: quotes.commercialNotes,
      internalNotes: quotes.internalNotes,
      subtotalCents: quotes.subtotalCents,
      totalCents: quotes.totalCents,
      estimatedCostCents: quotes.estimatedCostCents,
      clientId: quotes.clientId,
      clientName: clients.name,
      clientTrade: clients.tradeName,
      clientDoc: clients.document,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      clientAddress: clients.address,
      clientCity: clients.city,
      clientState: clients.state,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .where(eq(quotes.id, id))
    .limit(1);

  if (!quote) {
    notFound();
  }

  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id));

  // Checa se já existe pedido vinculado
  const [existingOrder] = await db
    .select({ id: orders.id, code: orders.code, status: orders.status })
    .from(orders)
    .where(eq(orders.quoteId, id))
    .limit(1);

  const profitCents = quote.totalCents - quote.estimatedCostCents;
  const marginPercent = quote.totalCents > 0 ? Math.round((profitCents / quote.totalCents) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/quotes"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#0B1730]">
                {quote.code}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-[#B87A52]/15 text-[#B87A52] border border-[#B87A52]/30">
                Rev. {quote.revision}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize bg-slate-100 text-slate-700">
                {quote.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Emitido em {formatDate(quote.issueDate)} • Válido até {formatDate(quote.validUntil)}
            </p>
          </div>
        </div>

        {existingOrder ? (
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Ver Pedido ({existingOrder.code})</span>
          </Link>
        ) : quote.status !== "aprovado" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-700 font-medium px-3 py-1 bg-amber-50 rounded-md border border-amber-200">
              Pronto para aprovação
            </span>
          </div>
        ) : null}
      </div>

      {/* Grid: Cliente & Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Dados do Cliente
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Razão Social / Nome:</span>
              <strong className="text-slate-800 font-semibold">{quote.clientName}</strong>
              {quote.clientTrade && (
                <span className="text-xs text-slate-500 block">{quote.clientTrade}</span>
              )}
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Documento (CPF/CNPJ):</span>
              <span className="text-slate-700 font-mono text-xs">{quote.clientDoc || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Contato:</span>
              <span className="text-slate-700">{quote.clientPhone || quote.clientEmail || "-"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Localização:</span>
              <span className="text-slate-700">
                {quote.clientCity ? `${quote.clientCity} - ${quote.clientState}` : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Resumo Financeiro
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Custo Estimado:</span>
                <span className="font-mono">{formatCurrency(quote.estimatedCostCents)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Lucro Previsto:</span>
                <span className="font-mono">{formatCurrency(profitCents)} ({marginPercent}%)</span>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
            <span className="text-xs font-semibold uppercase text-slate-600">Total Proposta:</span>
            <span className="text-2xl font-bold text-[#14274B] font-mono">
              {formatCurrency(quote.totalCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Itens do Orçamento */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 text-sm">Itens da Composição Técnica</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Item / Descrição</th>
                <th className="px-6 py-3.5">Dimensões</th>
                <th className="px-6 py-3.5 text-center">Qtd</th>
                <th className="px-6 py-3.5 text-right">Custo Est.</th>
                <th className="px-6 py-3.5 text-right">Preço Unitário</th>
                <th className="px-6 py-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{it.productName}</div>
                    {it.description && <div className="text-xs text-slate-500 mt-0.5">{it.description}</div>}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">
                    {it.widthMeters && it.heightMeters
                      ? `${it.widthMeters}m x ${it.heightMeters}m (${it.totalArea}m²)`
                      : "Sob Medida"}
                  </td>
                  <td className="px-6 py-4 text-center font-medium">{it.quantity}</td>
                  <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">
                    {formatCurrency(it.totalCostCents)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-800 font-mono text-xs">
                    {formatCurrency(it.unitPriceCents)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#14274B] font-mono">
                    {formatCurrency(it.totalPriceCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL DE CONVERSÃO EM PEDIDO */}
      {!existingOrder && quote.status !== "aprovado" && (
        <div className="bg-[#0B1730] text-white p-6 rounded-xl border border-[#1e345e] shadow-md space-y-5">
          <div className="flex items-center gap-3 border-b border-[#1e345e] pb-3">
            <div className="w-9 h-9 rounded-lg bg-[#B87A52]/20 border border-[#B87A52]/40 flex items-center justify-center text-[#E3B48A]">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Aprovar Orçamento e Converter em Pedido
              </h2>
              <p className="text-xs text-slate-300">
                Ao converter, o pedido será criado na produção, as parcelas financeiras serão geradas e os materiais alocados no estoque.
              </p>
            </div>
          </div>

          <form action={convertQuoteToOrderAction} className="space-y-4">
            <input type="hidden" name="quoteId" value={quote.id} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-200">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#E3B48A] mb-1.5">
                  Forma de Pagamento *
                </label>
                <select
                  name="paymentMethod"
                  required
                  defaultValue="pix"
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#B87A52]"
                >
                  <option value="pix">PIX (Chave GM Sign)</option>
                  <option value="boleto">Boleto Bancário</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="transferencia">Transferência TED / DOC</option>
                  <option value="faturado">Faturado / Nota Fiscal</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#E3B48A] mb-1.5">
                  Condição de Parcelamento *
                </label>
                <select
                  name="installmentsCount"
                  required
                  defaultValue="2"
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#B87A52]"
                >
                  <option value="1">1x À vista (100% no pedido)</option>
                  <option value="2">2x (50% Entrada + 50% Conclusão)</option>
                  <option value="3">3x (Entrada + 30 + 60 dias)</option>
                  <option value="4">4x Parcelado mensal</option>
                  <option value="5">5x Parcelado mensal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#E3B48A] mb-1.5">
                  Vencimento 1ª Parcela
                </label>
                <input
                  type="date"
                  name="firstDueDate"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#B87A52]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Endereço de Instalação / Obra
                </label>
                <input
                  type="text"
                  name="installationAddress"
                  defaultValue={quote.clientAddress || `${quote.clientCity || "São Paulo"} - SP`}
                  placeholder="Ex: Av. Paulista, 1000 - Fachada frontal"
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#B87A52]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Data Prevista de Entrega / Instalação
                </label>
                <input
                  type="date"
                  name="expectedDeliveryDate"
                  defaultValue={
                    new Date(Date.now() + (quote.deliveryTimeDays || 15) * 86400000)
                      .toISOString()
                      .split("T")[0]
                  }
                  required
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#B87A52]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Observações de Produção & Montagem
              </label>
              <textarea
                name="productionNotes"
                rows={2}
                placeholder="Instruções para serralheria, router CNC, iluminação LED ou equipe de campo..."
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#B87A52]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] text-white font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Confirmar e Gerar Pedido de Venda</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
