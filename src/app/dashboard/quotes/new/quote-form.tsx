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
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCatalogSelect = (prodId: string) => {
    setSelectedCatalogId(prodId);
    if (!prodId) return;
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setProductName(prod.name);
      setProductDescription(prod.description || "");
      if (prod.salePriceCents) {
        setUnitPrice((prod.salePriceCents / 100).toFixed(2));
      }
    }
  };

  // Lista de itens do orçamento
  const [items, setItems] = useState<ItemPayload[]>([]);

  const handleAddItem = () => {
    if (!productName.trim()) {
      alert("Informe o nome do produto ou serviço.");
      return;
    }

    const priceNum = parseFloat(unitPrice.replace(",", ".")) || 0;
    if (priceNum <= 0) {
      alert("Informe um valor unitário válido maior que zero.");
      return;
    }

    const parsedQty = parseInt(quantity, 10) || 1;
    const priceCents = Math.round(priceNum * 100);

    const newItem: ItemPayload = {
      productName: productName.trim(),
      description: productDescription.trim(),
      quantity: parsedQty,
      pricingMethod: "manual",
      unitCostCents: 0,
      totalCostCents: 0,
      unitPriceCents: priceCents,
      totalPriceCents: priceCents * parsedQty,
      notes: "",
    };

    setItems([...items, newItem]);
    setProductName("");
    setProductDescription("");
    setQuantity("1");
    setUnitPrice("");
    setSelectedCatalogId("");
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totais globais
  const totalPrice = items.reduce((acc, it) => acc + it.totalPriceCents, 0);

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

      {/* Serviços e Itens do Orçamento */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#B87A52]" />
            <span>2. Serviços e Itens do Orçamento</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">
            Descreva o serviço a ser executado e informe o valor manual
          </span>
        </h2>

        {/* Seletor Opcional de Catálogo de Produtos & Serviços */}
        {products.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-xs font-bold text-[#0B1730] flex items-center gap-1.5 shrink-0">
              <Boxes className="w-4 h-4 text-[#B87A52]" />
              <span>Carregar do Catálogo (Opcional):</span>
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
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Serviço / Produto *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Fachada ACM com Letras Caixa LED"
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-mono text-center focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Valor Unitário (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0,00"
                className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40"
              />
            </div>
          </div>

          {/* Descrição Detalhada em Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Descrição do que será feito no serviço *
            </label>
            <textarea
              rows={3}
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Informe detalhadamente o que será executado: materiais, medidas, acabamento, estrutura, iluminação, se inclui instalação, etc."
              className="w-full p-3 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 leading-relaxed"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
            <div className="text-xs text-slate-600">
              {parseFloat(unitPrice) > 0 ? (
                <span>
                  Subtotal deste item:{" "}
                  <strong className="text-slate-900 font-mono text-sm">
                    {formatBRL(Math.round((parseFloat(unitPrice.replace(",", ".")) || 0) * (parseInt(quantity, 10) || 1) * 100))}
                  </strong>
                </span>
              ) : (
                <span className="text-slate-400">Preencha o serviço, descrição e valor unitário acima.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              disabled={!productName.trim() || !unitPrice || parseFloat(unitPrice.replace(",", ".")) <= 0}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1730] hover:bg-[#14274B] disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#E3B48A]" />
              <span>Adicionar Item ao Orçamento</span>
            </button>
          </div>
        </div>

        {/* Tabela de Itens Adicionados */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Item / Serviço & Detalhes da Execução</th>
                <th className="px-4 py-3 text-center">Qtd</th>
                <th className="px-4 py-3 text-right">Valor Unitário</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">
                    Nenhum item adicionado à proposta técnica.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.productName}</div>
                      {item.description && (
                        <div className="text-xs text-slate-600 mt-1 whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium font-mono">{item.quantity} un</td>
                    <td className="px-4 py-3 text-right text-slate-600 font-mono text-xs">
                      {formatBRL(item.unitPriceCents)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#14274B] font-mono">
                      {formatBRL(item.totalPriceCents)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded hover:bg-rose-50"
                        title="Remover Item"
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
              <span className="text-slate-400 text-xs block">Itens / Serviços:</span>
              <strong className="text-slate-200 font-mono text-base">{items.length} {items.length === 1 ? "item" : "itens"}</strong>
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
