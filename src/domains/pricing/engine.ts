import Decimal from "decimal.js";

// Configuração padrão do Decimal para operações financeiras
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface CostComponent {
  id: string;
  name: string;
  category: "material" | "mao_de_obra" | "estrutura" | "instalacao" | "deslocamento" | "equipamento" | "terceirizado" | "outro";
  unit: string;
  quantity: number; // quantidade utilizada
  unitCostCents: number; // custo unitário em centavos
  eligibleForLoss: boolean; // apenas materiais sofrem perda percentual!
}

export interface PricingParams {
  quantity: number; // quantidade de peças
  widthMeters?: number; // largura em metros
  heightMeters?: number; // altura em metros
  components: CostComponent[];
  lossPercent: number; // Ex: 10 para 10%
  pricingMethod: "markup" | "margem" | "m2_referencia" | "manual";
  markupOrMarginPercent?: number; // Ex: 30 para 30%
  referencePricePerM2Cents?: number; // Preço de referência por m² em centavos
  manualPriceCents?: number; // Preço manual inserido pelo vendedor
  discountCents?: number; // Desconto em centavos
}

export interface PricingResult {
  unitAreaM2: number;
  totalAreaM2: number;
  materialCostCents: number;
  materialLossCents: number;
  serviceCostCents: number;
  unitCostCents: number;
  totalCostCents: number;
  suggestedUnitPriceCents: number;
  suggestedTotalPriceCents: number;
  finalUnitPriceCents: number;
  finalTotalPriceCents: number;
  grossProfitCents: number;
  grossMarginPercent: number;
  isBelowCost: boolean;
}

/**
 * Calcula área por peça e área total com alta precisão
 */
export function calculateArea(widthM?: number, heightM?: number, quantity = 1): { unitArea: number; totalArea: number } {
  if (!widthM || !heightM || widthM <= 0 || heightM <= 0) {
    return { unitArea: 0, totalArea: 0 };
  }
  const w = new Decimal(widthM);
  const h = new Decimal(heightM);
  const q = new Decimal(quantity);

  const unitArea = w.times(h).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();
  const totalArea = new Decimal(unitArea).times(q).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber();

  return { unitArea, totalArea };
}

/**
 * Aplica markup sobre custo: Preço = Custo * (1 + percentual / 100)
 */
export function calculatePriceFromMarkup(costCents: number, markupPercent: number): number {
  const cost = new Decimal(costCents);
  const factor = new Decimal(1).plus(new Decimal(markupPercent).dividedBy(100));
  return cost.times(factor).round().toNumber();
}

/**
 * Aplica margem sobre venda: Preço = Custo / (1 - percentual / 100)
 * Requer margem estritamente menor que 100%
 */
export function calculatePriceFromMargin(costCents: number, marginPercent: number): number {
  if (marginPercent >= 100) {
    throw new Error("A margem sobre a venda deve ser estritamente menor que 100%.");
  }
  const cost = new Decimal(costCents);
  const divisor = new Decimal(1).minus(new Decimal(marginPercent).dividedBy(100));
  return cost.dividedBy(divisor).round().toNumber();
}

/**
 * Motor completo de precificação do item
 */
export function calculateItemPricing(params: PricingParams): PricingResult {
  const { unitArea, totalArea } = calculateArea(params.widthMeters, params.heightMeters, params.quantity);
  const qty = Math.max(1, params.quantity || 1);

  let materialBaseCents = 0;
  let serviceBaseCents = 0;

  for (const comp of params.components) {
    const cQty = new Decimal(comp.quantity);
    const cCost = new Decimal(comp.unitCostCents);
    const itemTotalCents = cQty.times(cCost).round().toNumber();

    if (comp.category === "material") {
      materialBaseCents += itemTotalCents;
    } else {
      serviceBaseCents += itemTotalCents;
    }
  }

  // Perda aplicada ESTRITAMENTE aos materiais elegíveis
  const lossRate = new Decimal(params.lossPercent || 0).dividedBy(100);
  const materialLossCents = new Decimal(materialBaseCents).times(lossRate).round().toNumber();

  const totalCostCents = materialBaseCents + materialLossCents + serviceBaseCents;
  const unitCostCents = new Decimal(totalCostCents).dividedBy(qty).round().toNumber();

  let suggestedTotalPriceCents = 0;
  const pct = params.markupOrMarginPercent ?? 40;

  if (params.pricingMethod === "markup") {
    suggestedTotalPriceCents = calculatePriceFromMarkup(totalCostCents, pct);
  } else if (params.pricingMethod === "margem") {
    suggestedTotalPriceCents = calculatePriceFromMargin(totalCostCents, pct);
  } else if (params.pricingMethod === "m2_referencia") {
    // Área total * Preço m2 de referência + serviços especiais/adicionais
    const refArea = totalArea > 0 ? totalArea : qty;
    const baseRefPrice = new Decimal(refArea).times(params.referencePricePerM2Cents || 0).round().toNumber();
    suggestedTotalPriceCents = baseRefPrice + serviceBaseCents;
  } else {
    // Manual
    suggestedTotalPriceCents = params.manualPriceCents ?? totalCostCents;
  }

  // Preço final praticado considerando desconto
  const discount = Math.max(0, params.discountCents || 0);
  let finalTotalPriceCents = Math.max(0, suggestedTotalPriceCents - discount);

  if (params.pricingMethod === "manual" && params.manualPriceCents !== undefined) {
    finalTotalPriceCents = Math.max(0, params.manualPriceCents - discount);
  }

  const finalUnitPriceCents = new Decimal(finalTotalPriceCents).dividedBy(qty).round().toNumber();
  const suggestedUnitPriceCents = new Decimal(suggestedTotalPriceCents).dividedBy(qty).round().toNumber();

  const grossProfitCents = finalTotalPriceCents - totalCostCents;
  const grossMarginPercent = finalTotalPriceCents > 0
    ? new Decimal(grossProfitCents).dividedBy(finalTotalPriceCents).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
    : 0;

  const isBelowCost = finalTotalPriceCents < totalCostCents;

  return {
    unitAreaM2: unitArea,
    totalAreaM2: totalArea,
    materialCostCents: materialBaseCents,
    materialLossCents,
    serviceCostCents: serviceBaseCents,
    unitCostCents,
    totalCostCents,
    suggestedUnitPriceCents,
    suggestedTotalPriceCents,
    finalUnitPriceCents,
    finalTotalPriceCents,
    grossProfitCents,
    grossMarginPercent,
    isBelowCost,
  };
}
