import {
  calculateArea,
  calculatePriceFromMarkup,
  calculatePriceFromMargin,
  calculateItemPricing,
} from "./engine";

console.log("--- TESTANDO MOTOR DE PRECIFICAÇÃO DA GM SIGN SOLUTIONS ---");

// Teste 1: Área
const areaTest = calculateArea(2.5, 1.2, 2);
console.log("Área calculada (2.5 x 1.2 x 2 peças):", areaTest);
if (areaTest.unitArea === 3.0 && areaTest.totalArea === 6.0) {
  console.log("✓ Teste de área: OK");
} else {
  console.error("✗ Falha no teste de área");
}

// Teste 2: Markup x Margem (Exemplo oficial do prompt: Custo R$ 1.000 (100.000 centavos) com 30%)
const cost = 100000;
const markup30 = calculatePriceFromMarkup(cost, 30);
console.log("Custo R$ 1000 com 30% Markup:", markup30 / 100);
if (markup30 === 130000) {
  console.log("✓ Teste de Markup: R$ 1.300,00 exato!");
}

const margin30 = calculatePriceFromMargin(cost, 30);
console.log("Custo R$ 1000 com 30% Margem sobre venda:", (margin30 / 100).toFixed(2));
if (Math.abs(margin30 - 142857) <= 1) {
  console.log("✓ Teste de Margem: R$ 1.428,57 exato!");
}

// Teste 3: Precificação com perda aplicada apenas a materiais
const result = calculateItemPricing({
  quantity: 1,
  widthMeters: 3,
  heightMeters: 1,
  components: [
    { id: "1", name: "ACM 3mm", category: "material", unit: "m2", quantity: 3, unitCostCents: 10000, eligibleForLoss: true }, // 30.000 centavos
    { id: "2", name: "Instalação Fachada", category: "instalacao", unit: "servico", quantity: 1, unitCostCents: 20000, eligibleForLoss: false } // 20.000 centavos
  ],
  lossPercent: 10, // 10% sobre material = 3.000 centavos
  pricingMethod: "markup",
  markupOrMarginPercent: 50,
});

console.log("Resultado precificação:", {
  totalCost: result.totalCostCents / 100,
  materialCost: result.materialCostCents / 100,
  lossCost: result.materialLossCents / 100,
  serviceCost: result.serviceCostCents / 100,
  finalPrice: result.finalTotalPriceCents / 100,
  grossProfit: result.grossProfitCents / 100,
  grossMargin: result.grossMarginPercent + "%"
});

if (result.materialLossCents === 3000 && result.totalCostCents === 53000) {
  console.log("✓ Teste de perda seletiva e custo total: OK");
}
