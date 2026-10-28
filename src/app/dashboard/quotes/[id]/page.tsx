export const instant = false;

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { quotes, quoteItems, clients, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ArrowLeft,
  CheckCircle,
  ShoppingBag,
  ExternalLink,
  FileText,
  Edit2,
} from "lucide-react";
import { convertQuoteToOrderAction } from "@/domains/quotes/actions";
import { ProposalDocument } from "@/components/quotes/proposal-document";
import { PrintButton } from "@/components/quotes/print-button";
import { DeleteQuoteButton } from "@/components/quotes/delete-quote-button";

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
      title: quotes.title,
      contactPerson: quotes.contactPerson,
      billingAddress: quotes.billingAddress,
      installationAddress: quotes.installationAddress,
      includedServices: quotes.includedServices,
      warrantyTerms: quotes.warrantyTerms,
      cityStateLocation: quotes.cityStateLocation,
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
    .select({
      id: quoteItems.id,
      productName: quoteItems.productName,
      dimensions: quoteItems.dimensions,
      summaryDescription: quoteItems.summaryDescription,
      description: quoteItems.description,
      quantity: quoteItems.quantity,
      unitPriceCents: quoteItems.unitPriceCents,
      totalPriceCents: quoteItems.totalPriceCents,
      widthMeters: quoteItems.widthMeters,
      heightMeters: quoteItems.heightMeters,
      unitArea: quoteItems.unitArea,
      totalArea: quoteItems.totalArea,
      unitCostCents: quoteItems.unitCostCents,
      totalCostCents: quoteItems.totalCostCents,
      notes: quoteItems.notes,
    })
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id));

  // Checa se já existe pedido vinculado
  const [existingOrder] = await db
    .select({ id: orders.id, code: orders.code, status: orders.status })
    .from(orders)
    .where(eq(orders.quoteId, id))
    .limit(1);

  // Endereços formatados como fallback
  const clientFormattedAddress = [
    quote.clientAddress,
    quote.clientCity && quote.clientState ? `${quote.clientCity}/${quote.clientState}` : quote.clientCity,
  ]
    .filter(Boolean)
    .join(" — ");

  const proposalData = {
    ...quote,
    billingAddress: quote.billingAddress || clientFormattedAddress,
    installationAddress: quote.installationAddress || clientFormattedAddress,
    commercialNotes: quote.commercialNotes,
    items,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 print:max-w-none print:p-0 print:m-0 print:space-y-0">
      {/* Top Bar de Navegação & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/quotes"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[#0B1730]">
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

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/dashboard/quotes?edit=${quote.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-200/80 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors shadow-2xs"
            title="Editar Orçamento"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Orçamento</span>
          </Link>

          <Link
            href={`/dashboard/quotes/${quote.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Abrir Modelo A4</span>
          </Link>

          <PrintButton />

          {!existingOrder && (
            <DeleteQuoteButton
              quoteId={quote.id}
              quoteCode={quote.code}
              clientName={quote.clientName}
            />
          )}

          {existingOrder ? (
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Pedido ({existingOrder.code})</span>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Faixa Informativa da Proposta Oficial */}
      <div className="flex items-center justify-between p-3.5 px-5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#B87A52]" />
          <span>
            Visualização da <strong>Proposta Comercial Oficial</strong> idêntica ao modelo da GM Sign Solutions.
          </span>
        </div>
        <span className="font-mono font-bold text-slate-800 text-sm">
          Total: {formatCurrency(quote.totalCents)}
        </span>
      </div>

      {/* Renderização da Folha Oficial de Proposta Comercial GM Sign Solutions */}
      <div className="rounded-2xl border border-slate-300/80 shadow-md overflow-hidden bg-slate-100 p-2 sm:p-6 print:border-none print:shadow-none print:bg-white print:p-0 print:overflow-visible">
        <ProposalDocument data={proposalData} />
      </div>

      {/* SEÇÃO DE CONVERSÃO EM PEDIDO (Quando ainda não convertido) */}
      {!existingOrder && quote.status !== "aprovado" && (
        <div className="bg-[#0B1730] text-white p-6 rounded-xl border border-[#1e345e] shadow-md space-y-5 print:hidden">
          <div className="flex items-center gap-3 border-b border-[#1e345e] pb-3">
            <div className="w-9 h-9 rounded-lg bg-[#B87A52]/20 border border-[#B87A52]/40 flex items-center justify-center text-[#E3B48A]">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Aprovar Proposta e Converter em Pedido de Venda
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
                  defaultValue={quote.installationAddress || quote.clientAddress || `${quote.clientCity || "São Paulo"} - SP`}
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
                    new Date(Date.now() + (quote.deliveryTimeDays || 30) * 86400000)
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
