"use client";

import { useState } from "react";
import { Plus, Trash2, Calculator, Info, Check, Save, Boxes } from "lucide-react";
import { createQuoteAction, ItemPayload } from "@/domains/quotes/actions";

interface ClientOption {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
}

interface MaterialOption {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPriceCents: number;
}

export interface ProductOption {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  unit: string;
  salePriceCents: number;
  costPriceCents: number;
  markupPercent: string;
  description: string | null;
}

interface QuoteFormProps {
  clients: ClientOption[];
  materials: MaterialOption[];
  products?: ProductOption[];
}

export function QuoteForm({ clients, materials, products = [] }: QuoteFormProps) {
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id || "");
  const [validityDays, setValidityDays] = useState("10");
  const [deliveryTimeDays, setDeliveryTimeDays] = useState("15");
  const [paymentConditions, setPaymentConditions] = useState("50% de entrada e 50% na conclusão da instalação.");
  const [commercialNotes, setCommercialNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Estado para adicionar item
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [productName, setProductName] = useState("Fachada ACM com Letras Caixa LED");
  const [quantity, setQuantity] = useState("1");
  const [widthMeters, setWidthMeters] = useState("6.00");
  const [heightMeters, setHeightMeters] = useState("2.50");
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id || "");
  const [markupPercent, setMarkupPercent] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCatalogSelect = (prodId: string) => {
    setSelectedCatalogId(prodId);
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setProductName(prod.name);
      if (prod.markupPercent) {
        setMarkupPercent(prod.markupPercent);
      }
      if (prod.unit === "un" || prod.unit === "hora" || prod.unit === "diaria") {
        setWidthMeters("");
        setHeightMeters("");
      } else if (prod.unit === "m2" && (!widthMeters || !heightMeters)) {
        setWidthMeters("2.00");
        setHeightMeters("1.00");
      }
    }
  };

  // Lista de itens do orçamento
  const [items, setItems] = useState<ItemPayload[]>([
    {
      productName: "Fachada ACM com Letras Caixa LED",
      description: "Estrutura metálica galvanizada, revestimento em ACM 3mm e letras em acrílico com iluminação LED.",
      quantity: 1,
      widthMeters: 6.0,
      heightMeters: 2.5,
      unitArea: 15.0,
      totalArea: 15.0,
      pricingMethod: "composicao",
      unitCostCents: 450000, // R$ 4.500,00
      totalCostCents: 450000,
      unitPriceCents: 720000, // R$ 7.200,00 (60% markup)
      totalPriceCents: 720000,
      notes: "Incluso instalação e fixação estrutural.",
    },
  ]);

  // Cálculos dinâmicos do formulário de novo item
  const parsedWidth = parseFloat(widthMeters) || 0;
  const parsedHeight = parseFloat(heightMeters) || 0;
  const parsedQty = parseInt(quantity, 10) || 1;
  const unitAreaCalc = parsedWidth > 0 && parsedHeight > 0 ? Number((parsedWidth * parsedHeight).toFixed(3)) : 0;
  const totalAreaCalc = Number((unitAreaCalc * parsedQty).toFixed(3));

  const currentMat = materials.find((m) => m.id === selectedMaterialId);
  const baseCostPerUnit = currentMat ? currentMat.costPriceCents : 25000;
  const estimatedItemCostCents = unitAreaCalc > 0
    ? Math.round(unitAreaCalc * baseCostPerUnit * 1.5) // Custo base + estrutura + mão de obra aproximada
    : 15000;
  const markupFactor = 1 + (parseFloat(markupPercent) || 50) / 100;
  const estimatedItemPriceCents = Math.round(estimatedItemCostCents * markupFactor);

  const handleAddItem = () => {
    if (!productName.trim()) return;

    const newItem: ItemPayload = {
      productName: productName.trim(),
      description: `${parsedWidth > 0 ? `${parsedWidth}m x ${parsedHeight}m` : ""} - Material base: ${currentMat?.name || "Padrão"}`,
      quantity: parsedQty,
      widthMeters: parsedWidth > 0 ? parsedWidth : undefined,
      heightMeters: parsedHeight > 0 ? parsedHeight : undefined,
      unitArea: unitAreaCalc > 0 ? unitAreaCalc : undefined,
      totalArea: totalAreaCalc > 0 ? totalAreaCalc : undefined,
      pricingMethod: "composicao",
      unitCostCents: estimatedItemCostCents,
      totalCostCents: estimatedItemCostCents * parsedQty,
      unitPriceCents: estimatedItemPriceCents,
      totalPriceCents: estimatedItemPriceCents * parsedQty,
      notes: "",
    };

    setItems([...items, newItem]);
    setProductName("");
    setWidthMeters("");
    setHeightMeters("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totais globais
  const totalCost = items.reduce((acc, it) => acc + it.totalCostCents, 0);
  const totalPrice = items.reduce((acc, it) => acc + it.totalPriceCents, 0);
  const grossProfit = totalPrice - totalCost;
  const grossMargin = totalPrice > 0 ? Math.round((grossProfit / totalPrice) * 100) : 0;

  const formatBRL = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  return (
    <form
      action={async (formData: FormData) => {
        setIsSubmitting(true);
        formData.append("clientId", selectedClient);
        formData.append("validityDays", validityDays);
        formData.append("deliveryTimeDays", deliveryTimeDays);
        formData.append("paymentConditions", paymentConditions);
        formData.append("commercialNotes", commercialNotes);
        formData.append("internalNotes", internalNotes);
        formData.append("items", JSON.stringify(items));
        await createQuoteAction(formData);
      }}
      className="space-y-6"
    >
      {/* Dados Gerais do Cliente e Prazos */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <span>1. Dados Gerais da Proposta</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Cliente Destinatário *
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.tradeName ? `(${c.tradeName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Validade da Proposta (Dias)
            </label>
            <input
              type="number"
              min="1"
              value={validityDays}
              onChange={(e) => setValidityDays(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Prazo de Entrega (Dias Úteis)
            </label>
            <input
              type="number"
              min="1"
              value={deliveryTimeDays}
              onChange={(e) => setDeliveryTimeDays(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Condições Comerciais e de Pagamento Padrão
          </label>
          <input
            type="text"
            value={paymentConditions}
            onChange={(e) => setPaymentConditions(e.target.value)}
            className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
          />
        </div>
      </div>

      {/* Precificação e Adição de Itens Técnicos */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#B87A52]" />
            <span>2. Motor de Precificação Técnica & Produtos</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">
            Área, materiais e margem calculados em tempo real
          </span>
        </h2>

        {/* Seletor Rápido de Catálogo de Produtos & Serviços */}
        {products.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-[#0B1730] flex items-center gap-1.5 shrink-0">
              <Boxes className="w-4 h-4 text-[#B87A52]" />
              <span>Carregar do Catálogo:</span>
            </span>
            <select
              value={selectedCatalogId}
              onChange={(e) => handleCatalogSelect(e.target.value)}
              className="flex-1 h-9 px-3 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
            >
              <option value="">-- Selecionar Produto ou Serviço Pré-Cadastrado --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name} ({p.category}) - {formatBRL(p.salePriceCents)} / {p.unit}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Linha de configuração do novo item */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Descrição do Produto / Serviço *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Fachada ACM, Banner Lona, Letra Caixa..."
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Material / Categoria Base
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({formatBRL(m.costPriceCents)}/{m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Largura (m)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={widthMeters}
                onChange={(e) => setWidthMeters(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Altura (m)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={heightMeters}
                onChange={(e) => setHeightMeters(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Área Total
              </label>
              <div className="h-9 px-3 bg-slate-200/70 border border-slate-300 rounded-md text-sm text-slate-700 flex items-center font-mono font-medium">
                {totalAreaCalc > 0 ? `${totalAreaCalc} m²` : "-"}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Markup / Lucro (%)
              </label>
              <input
                type="number"
                step="1"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-800"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full h-9 bg-[#14274B] hover:bg-[#0B1730] text-white rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#E3B48A]" />
                <span>Adicionar Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Itens Adicionados */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Produto / Especificação</th>
                <th className="px-4 py-3">Dimensões</th>
                <th className="px-4 py-3 text-center">Qtd</th>
                <th className="px-4 py-3 text-right">Custo Est.</th>
                <th className="px-4 py-3 text-right">Preço Venda</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum item adicionado à proposta técnica.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      {item.description && (
                        <div className="text-xs text-slate-400">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {item.widthMeters && item.heightMeters
                        ? `${item.widthMeters}m x ${item.heightMeters}m (${item.totalArea}m²)`
                        : "Unidade"}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-slate-500 font-mono text-xs">
                      {formatBRL(item.totalCostCents)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800 font-mono text-xs">
                      {formatBRL(item.unitPriceCents)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#14274B] font-mono">
                      {formatBRL(item.totalPriceCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumo Financeiro & Conclusão */}
      <div className="bg-[#0B1730] text-white p-6 rounded-xl border border-[#1e345e] shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#E3B48A] uppercase tracking-wider">
            Resumo da Proposta Comercial
          </span>
          <div className="flex items-baseline gap-6 text-sm">
            <div>
              <span className="text-slate-400 text-xs block">Custo Estimado:</span>
              <strong className="text-slate-200 font-mono text-base">{formatBRL(totalCost)}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs block">Lucro Bruto:</span>
              <strong className="text-emerald-400 font-mono text-base">{formatBRL(grossProfit)} ({grossMargin}%)</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs block">Valor Total do Orçamento:</span>
              <strong className="text-2xl font-bold text-white font-mono">{formatBRL(totalPrice)}</strong>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={items.length === 0 || isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? "Gerando Orçamento..." : "Salvar Orçamento"}</span>
        </button>
      </div>
    </form>
  );
}
