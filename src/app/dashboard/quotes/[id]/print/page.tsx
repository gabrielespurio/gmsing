export const instant = false;

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { quotes, quoteItems, clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProposalDocument } from "@/components/quotes/proposal-document";
import { PrintButton } from "@/components/quotes/print-button";
import { ArrowLeft } from "lucide-react";

export default async function QuotePrintPage({
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
      totalCents: quotes.totalCents,
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
    })
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id));

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
    items,
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white py-6 print:py-0">
      {/* Top Floating Action Bar (Hidden when printing) */}
      <div className="max-w-[850px] mx-auto mb-4 px-4 flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/quotes/${quote.id}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao Orçamento</span>
        </Link>

        <div className="flex items-center gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Official Proposal Sheet */}
      <ProposalDocument data={proposalData} />
    </div>
  );
}
