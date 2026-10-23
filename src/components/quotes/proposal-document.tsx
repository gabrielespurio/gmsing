import React from "react";

export interface ProposalItem {
  id: string;
  productName: string;
  dimensions?: string | null;
  summaryDescription?: string | null;
  description?: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
}

export interface ProposalData {
  id: string;
  code: string;
  revision: number;
  status: string;
  issueDate: Date;
  validUntil: Date;
  title?: string | null;
  contactPerson?: string | null;
  billingAddress?: string | null;
  installationAddress?: string | null;
  cityStateLocation?: string | null;
  includedServices?: string | null;
  warrantyTerms?: string | null;
  paymentConditions?: string | null;
  deliveryTimeDays?: number | null;
  totalCents: number;
  clientName: string;
  clientTrade?: string | null;
  clientDoc?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientCity?: string | null;
  clientState?: string | null;
  items: ProposalItem[];
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatDateExtenso(date: Date) {
  const d = new Date(date);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function ProposalDocument({ data }: { data: ProposalData }) {
  const currentYear = new Date(data.issueDate).getFullYear();
  const halfValue = Math.round(data.totalCents / 2);

  // Formata o código no padrão da proposta se aplicável (ex: ORC-2026-047 -> 47/2026)
  let proposalNumber = data.code;
  const match = data.code.match(/ORC-(\d{4})-(\d+)/i);
  if (match) {
    const [, yr, seq] = match;
    proposalNumber = `${parseInt(seq, 10)}/${yr}`;
  }

  // Prepara texto de pagamento com os valores em R$ já calculados
  let paymentText = data.paymentConditions;
  if (!paymentText || paymentText.toLowerCase().includes("50%")) {
    paymentText = `50% no aceite formal da proposta (${formatCurrency(halfValue)}) e 50% após a conclusão e validação da instalação (${formatCurrency(halfValue)}), mediante emissão de Nota Fiscal Eletrônica.`;
  }

  return (
    <div className="proposal-container bg-white text-slate-900 font-sans max-w-[850px] mx-auto p-6 sm:p-10 shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none print:w-full leading-normal">
      {/* 1. CABEÇALHO */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#B87A52]">
        {/* Logo / Marca GM SIGN */}
        <div className="border border-slate-700 p-2 sm:p-2.5 px-3 sm:px-4 text-center inline-block">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-[#0B1730] uppercase leading-none">
            GM SIGN
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-500 uppercase mt-1">
            Comunicação Visual
          </div>
        </div>

        {/* Informações de Contato à Direita */}
        <div className="text-right text-[11px] sm:text-xs text-slate-800 space-y-0.5">
          <div className="font-bold text-slate-900">@gmsignsolutions</div>
          <div>(17) 98109-1334</div>
          <div className="text-slate-600">gmsignsolutions@hotmail.com</div>
        </div>
      </div>

      {/* 2. TÍTULO DA PROPOSTA */}
      <div className="mt-5 sm:mt-6 text-center space-y-1">
        <h1 className="text-lg sm:text-2xl font-black tracking-wide text-[#0B1730] uppercase">
          PROPOSTA COMERCIAL Nº {proposalNumber}
        </h1>
        <h2 className="text-xs sm:text-sm font-bold tracking-wider text-[#B87A52] uppercase">
          {data.title || `COMUNICAÇÃO VISUAL — ${data.clientName}`}
        </h2>
      </div>

      {/* 3. QUADRO DE IDENTIFICAÇÃO */}
      <div className="mt-5 border border-slate-300 text-[11px] sm:text-xs">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="w-24 sm:w-28 font-bold text-slate-900 py-1.5 px-3 bg-slate-50/60 border-r border-slate-200">
                Cliente:
              </td>
              <td className="py-1.5 px-3 text-slate-800 font-semibold">
                {data.clientName} {data.clientTrade ? `— ${data.clientTrade}` : ""}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="w-24 sm:w-28 font-bold text-slate-900 py-1.5 px-3 bg-slate-50/60 border-r border-slate-200">
                A/C:
              </td>
              <td className="py-1.5 px-3 text-slate-800">
                {data.contactPerson || "Aos Cuidados da Diretoria / Departamento de Compras"}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="w-24 sm:w-28 font-bold text-slate-900 py-1.5 px-3 bg-slate-50/60 border-r border-slate-200">
                CNPJ:
              </td>
              <td className="py-1.5 px-3 text-slate-800 font-mono">
                {data.clientDoc || "-"}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="w-24 sm:w-28 font-bold text-slate-900 py-1.5 px-3 bg-slate-50/60 border-r border-slate-200">
                Faturamento:
              </td>
              <td className="py-1.5 px-3 text-slate-800">
                {data.billingAddress || "-"}
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="w-24 sm:w-28 font-bold text-slate-900 py-1.5 px-3 bg-slate-50/60 border-r border-slate-200">
                Instalação:
              </td>
              <td className="py-1.5 px-3 text-slate-800">
                {data.installationAddress || data.billingAddress || "-"}
              </td>
            </tr>
            <tr>
              <td className="w-24 sm:w-28 font-bold text-slate-900 py-1.5 px-3 bg-slate-50/60 border-r border-slate-200">
                Data:
              </td>
              <td className="py-1.5 px-3 text-slate-800">
                <span>{formatDateExtenso(data.issueDate)}</span>
                <span className="mx-2 text-slate-400 font-bold">|</span>
                <span className="font-bold text-slate-900">Validade:</span>{" "}
                <span>
                  {data.validUntil
                    ? `${Math.max(1, Math.round((new Date(data.validUntil).getTime() - new Date(data.issueDate).getTime()) / (1000 * 60 * 60 * 24)))} dias`
                    : "30 dias"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. ESCOPO DO FORNECIMENTO */}
      <div className="mt-5">
        <div className="bg-[#0B1730] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
          <span>ESCOPO DO FORNECIMENTO</span>
        </div>
        <div className="border border-slate-300 border-t-0 text-[11px] sm:text-xs divide-y divide-slate-200">
          {data.items.map((item, idx) => (
            <div key={item.id || idx} className="flex">
              <div className="w-10 sm:w-12 shrink-0 py-2.5 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50/40">
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="p-2.5 sm:px-3 space-y-1 flex-1">
                <div className="font-bold text-slate-900 text-xs sm:text-[13px]">
                  {item.productName}
                  {item.dimensions ? ` — ${item.dimensions}` : ""}
                </div>
                {item.description && (
                  <div className="text-slate-700 text-[11px] sm:text-xs leading-relaxed whitespace-pre-line">
                    {item.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. INVESTIMENTO */}
      <div className="mt-5">
        <div className="bg-[#0B1730] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-1.5">
          <span>INVESTIMENTO</span>
        </div>
        <div className="border border-slate-300 border-t-0 text-[11px] sm:text-xs">
          <div className="divide-y divide-slate-200">
            {data.items.map((item, idx) => {
              const summary = item.summaryDescription || item.productName;
              return (
                <div key={item.id || idx} className="flex items-center">
                  <div className="w-10 sm:w-12 shrink-0 py-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50/40">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                  <div className="p-2 sm:px-3 flex-1 flex items-center justify-between">
                    <span className="text-slate-800">
                      {summary} — {String(item.quantity).padStart(2, "0")} un.
                    </span>
                    <span className="font-bold text-slate-900 font-mono text-right">
                      {formatCurrency(item.totalPriceCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Linha Total */}
          <div className="border-t-2 border-slate-400 bg-slate-50/60 p-2.5 px-3 flex items-center justify-between">
            <span className="font-black text-slate-900 uppercase tracking-wider text-xs sm:text-sm">
              TOTAL
            </span>
            <span className="font-black text-[#0B1730] font-mono text-sm sm:text-base">
              {formatCurrency(data.totalCents)}
            </span>
          </div>
        </div>
      </div>

      {/* 6. CONDIÇÕES COMERCIAIS */}
      <div className="mt-5">
        <div className="bg-[#0B1730] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-1.5">
          <span>CONDIÇÕES COMERCIAIS</span>
        </div>
        <div className="border border-slate-300 border-t-0 p-3 text-[11px] sm:text-xs space-y-2 text-slate-800 leading-relaxed">
          <p>
            <strong className="text-slate-900">Serviços inclusos:</strong>{" "}
            {data.includedServices ||
              "Usinagens técnicas, subestrutura metálica, equipe especializada de instalação e limpeza pós-obra."}
          </p>
          <p>
            <strong className="text-slate-900">Condições de pagamento:</strong>{" "}
            {paymentText}
          </p>
          <p>
            <strong className="text-slate-900">Prazo de fabricação e instalação:</strong> até{" "}
            {data.deliveryTimeDays || 30} (trinta) dias úteis após a confirmação formal do pedido e aprovação do layout.
          </p>
          <p>
            <strong className="text-slate-900">Garantia técnica:</strong>{" "}
            {data.warrantyTerms ||
              "12 (doze) meses contra defeitos de fabricação mecânica, ancoragem e integridade dos materiais."}
          </p>
          <p>
            <strong className="text-slate-900">Validade do orçamento:</strong>{" "}
            {data.validUntil
              ? `${Math.max(1, Math.round((new Date(data.validUntil).getTime() - new Date(data.issueDate).getTime()) / (1000 * 60 * 60 * 24)))} (trinta) dias a contar da data de emissão.`
              : "30 (trinta) dias a contar da data de emissão."}
          </p>
        </div>
      </div>

      {/* 7. APROVAÇÃO E ACEITE FORMAL */}
      <div className="mt-5">
        <div className="bg-[#0B1730] text-white font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-1.5">
          <span>APROVAÇÃO E ACEITE FORMAL</span>
        </div>
        <div className="border border-slate-300 border-t-0 p-3 sm:p-4 text-[11px] sm:text-xs space-y-3.5 text-slate-800">
          <p className="leading-relaxed">
            Estando de acordo com os itens, valores e condições técnicas descritos nesta proposta, as partes formalizam o aceite.
          </p>

          <p className="font-medium text-slate-700">
            {data.cityStateLocation || "São José do Rio Preto/SP"}
            {data.clientCity ? ` — ${data.clientCity}/${data.clientState || "SP"}` : ""},{" "}
            {formatDateExtenso(data.issueDate)}.
          </p>

          <div className="pt-1">
            <div className="font-bold text-slate-900 text-xs sm:text-[13px] uppercase">
              GM SIGN SERVIÇOS LTDA
            </div>
            <div className="text-slate-700 text-[11px] sm:text-xs mt-0.5">
              Eng. Jonas Gomes Heines de Mendonça • (17) 98109-1334
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <div className="font-bold text-slate-900 text-xs uppercase tracking-wide">
              DE ACORDO / ACEITE DO CLIENTE
            </div>
            <div className="font-medium text-slate-800">
              {data.clientName} {data.clientTrade ? `(${data.clientTrade})` : ""}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700">Responsável:</span>
                <span className="border-b border-slate-400 w-48 sm:w-64 inline-block"></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700">Data:</span>
                <span className="font-mono text-slate-600">_____ / _____ / {currentYear}</span>
              </div>
            </div>
          </div>

          <div className="text-center font-bold text-slate-700 text-[11px] sm:text-xs pt-3 border-t border-slate-100">
            GM SIGN Comunicação Visual
          </div>
        </div>
      </div>
    </div>
  );
}
