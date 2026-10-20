"use client";

import { useState } from "react";
import {
  ShoppingBag,
  CreditCard,
  Calendar,
  MapPin,
  Package,
  Save,
  DollarSign,
  Info,
} from "lucide-react";
import { createDirectOrderAction } from "@/domains/quotes/actions";

interface ClientOption {
  id: string;
  name: string;
  tradeName: string | null;
  document: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

interface MaterialOption {
  id: string;
  name: string;
  category: string;
  unit: string;
  costPriceCents: number;
  currentStock: string;
}

interface DirectOrderFormProps {
  clients: ClientOption[];
  materials: MaterialOption[];
}

export function DirectOrderForm({ clients, materials }: DirectOrderFormProps) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [installmentsCount, setInstallmentsCount] = useState("1");
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [installationAddress, setInstallationAddress] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [productionNotes, setProductionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quando seleciona cliente, preenche endereço sugerido se disponível
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      const addr = client.address || (client.city ? `${client.city} - ${client.state || "SP"}` : "");
      if (addr && !installationAddress) {
        setInstallationAddress(addr);
      }
    }
  };

  // Cálculo de parcelas para exibição
  const parsedAmount = parseFloat(totalAmount.replace(/\./g, "").replace(",", ".")) || 0;
  const numInstallments = parseInt(installmentsCount, 10) || 1;
  const installmentValue = parsedAmount > 0 ? (parsedAmount / numInstallments).toFixed(2) : "0,00";

  return (
    <form
      action={async (formData: FormData) => {
        setIsSubmitting(true);
        await createDirectOrderAction(formData);
      }}
      className="space-y-6"
    >
      {/* Dados Principais do Pedido */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#B87A52]" />
          <span>1. Identificação do Pedido & Cliente</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Cliente *
            </label>
            <select
              name="clientId"
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
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
              Título / Descrição da Obra *
            </label>
            <input
              type="text"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Fachada ACM 6x2m + Letras em Acrílico"
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Local de Instalação / Endereço
            </label>
            <input
              type="text"
              name="installationAddress"
              value={installationAddress}
              onChange={(e) => setInstallationAddress(e.target.value)}
              placeholder="Ex: Av. Paulista, 1000 - Centro Comercial"
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Previsão de Entrega / Conclusão
            </label>
            <input
              type="date"
              name="expectedDeliveryDate"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>
        </div>
      </div>

      {/* Condição Financeira & Parcelamento */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>2. Condições Financeiras & Faturamento</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">
            Gera parcelas automáticas no módulo Financeiro
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Valor Total do Pedido (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="totalAmount"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
              placeholder="Ex: 8500.00"
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Forma de Pagamento *
            </label>
            <select
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            >
              <option value="pix">PIX (Chave GM Sign)</option>
              <option value="boleto">Boleto Bancário</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="transferencia">Transferência Bancária TED</option>
              <option value="faturado">Faturado / Boleto a Prazo</option>
              <option value="dinheiro">Dinheiro em Espécie</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Parcelamento *
            </label>
            <select
              name="installmentsCount"
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            >
              <option value="1">1x À vista (100% no pedido)</option>
              <option value="2">2x (50% Entrada + 50% Conclusão)</option>
              <option value="3">3x Mensal</option>
              <option value="4">4x Mensal</option>
              <option value="5">5x Mensal</option>
              <option value="6">6x Mensal</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Vencimento da 1ª Parcela
            </label>
            <input
              type="date"
              name="firstDueDate"
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
              required
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
            <span className="font-semibold block mb-0.5">Previsão de Parcelas:</span>
            <span>
              {numInstallments}x de R$ {installmentValue} via {paymentMethod.toUpperCase()} (intervalo de 30 dias).
            </span>
          </div>
        </div>
      </div>

      {/* Ligação Opcional com Estoque */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <h2 className="text-base font-semibold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-600" />
            <span>3. Alocação de Estoque / Matéria-Prima (Opcional)</span>
          </div>
          <span className="text-xs text-slate-500 font-normal">
            Dedução automática do saldo disponível
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Material a Ser Consumido
            </label>
            <select
              name="materialId"
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            >
              <option value="">Nenhum (não deduzir agora)</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category}) - Saldo atual: {m.currentStock} {m.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Quantidade a Baixar
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="materialQuantity"
              value={materialQuantity}
              onChange={(e) => setMaterialQuantity(e.target.value)}
              placeholder="Ex: 4"
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Observações de Produção & Serralheria
          </label>
          <textarea
            name="productionNotes"
            rows={2}
            value={productionNotes}
            onChange={(e) => setProductionNotes(e.target.value)}
            placeholder="Especificações para soldagem, corte router CNC, pintura, fita LED ou fixadores..."
            className="w-full p-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#B87A52]/40 focus:border-[#B87A52]"
          />
        </div>
      </div>

      {/* Botão de Envio */}
      <div className="bg-[#0B1730] p-6 rounded-xl border border-[#1e345e] shadow-lg flex items-center justify-between text-white">
        <div>
          <span className="text-xs text-[#E3B48A] font-semibold uppercase tracking-wider">
            Confirmar Criação
          </span>
          <p className="text-xs text-slate-300 mt-0.5">
            O pedido entrará na fábrica com faturamento e parcelas no Contas a Receber.
          </p>
        </div>

        <button
          type="submit"
          disabled={!title || !totalAmount || isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#B87A52] hover:bg-[#a66a43] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSubmitting ? "Gerando Pedido..." : "Criar Pedido Direto"}</span>
        </button>
      </div>
    </form>
  );
}
