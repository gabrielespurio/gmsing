/**
 * Utilitário para Leitura e Extração de Dados de NF-e Brasileira (XML)
 * Funciona de forma isomórfica (tanto no browser quanto no servidor Node.js).
 */

export interface ParsedSupplier {
  document: string;
  name: string;
  tradeName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  stateRegistration?: string;
}

export interface ParsedItem {
  itemNumber: number;
  productCode: string;
  productName: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  suggestedMaterialId?: string;
}

export interface ParsedInstallment {
  number: string;
  dueDate: string;
  amount: number;
}

export interface ParsedNFe {
  key: string;
  number: string;
  series: string;
  issueDate: string;
  totalAmount: number;
  productsAmount: number;
  discountAmount: number;
  freightAmount: number;
  supplier: ParsedSupplier;
  items: ParsedItem[];
  installments: ParsedInstallment[];
}

// Extrai o conteúdo de uma tag (com suporte a namespaces)
function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

// Extrai múltiplos blocos de uma tag
function extractTagBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?${tag}>`, "gi");
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

export function parseNFeXml(xmlContent: string): ParsedNFe {
  if (!xmlContent || typeof xmlContent !== "string") {
    throw new Error("Conteúdo XML inválido ou vazio.");
  }

  // 1. Chave da NF-e
  let key = "";
  const infNFeMatch = xmlContent.match(/<infNFe[^>]*Id=["']NFe(\d{44})["']/i);
  if (infNFeMatch && infNFeMatch[1]) {
    key = infNFeMatch[1];
  } else {
    const chNFeMatch = xmlContent.match(/<chNFe>(\d{44})<\/chNFe>/i);
    if (chNFeMatch && chNFeMatch[1]) {
      key = chNFeMatch[1];
    }
  }

  // 2. Identificação da Nota (<ide>)
  const ideBlock = extractTag(xmlContent, "ide");
  const nNF = extractTag(ideBlock, "nNF");
  const serie = extractTag(ideBlock, "serie") || "1";
  const dhEmiRaw = extractTag(ideBlock, "dhEmi") || extractTag(ideBlock, "dEmi");
  const issueDate = dhEmiRaw ? dhEmiRaw.split("T")[0] : new Date().toISOString().split("T")[0];

  // 3. Dados do Emitente / Fornecedor (<emit>)
  const emitBlock = extractTag(xmlContent, "emit");
  const cnpj = extractTag(emitBlock, "CNPJ") || extractTag(emitBlock, "CPF");
  const xNome = extractTag(emitBlock, "xNome");
  const xFant = extractTag(emitBlock, "xFant");
  const ie = extractTag(emitBlock, "IE");

  const enderEmitBlock = extractTag(emitBlock, "enderEmit");
  const xLgr = extractTag(enderEmitBlock, "xLgr");
  const nro = extractTag(enderEmitBlock, "nro");
  const xBairro = extractTag(enderEmitBlock, "xBairro");
  const xMun = extractTag(enderEmitBlock, "xMun");
  const uf = extractTag(enderEmitBlock, "UF");
  const fone = extractTag(enderEmitBlock, "fone");

  const address = [xLgr, nro, xBairro].filter(Boolean).join(", ");

  const supplier: ParsedSupplier = {
    document: cnpj,
    name: xNome || "Fornecedor Sem Razão Social",
    tradeName: xFant || undefined,
    phone: fone || undefined,
    address: address || undefined,
    city: xMun || undefined,
    state: uf || undefined,
    stateRegistration: ie || undefined,
  };

  // 4. Totais da Nota (<total>)
  const totalBlock = extractTag(xmlContent, "total");
  const icmsTotBlock = extractTag(totalBlock, "ICMSTot") || totalBlock;
  const vNF = parseFloat(extractTag(icmsTotBlock, "vNF") || "0");
  const vProdTotal = parseFloat(extractTag(icmsTotBlock, "vProd") || "0");
  const vDescTotal = parseFloat(extractTag(icmsTotBlock, "vDesc") || "0");
  const vFreteTotal = parseFloat(extractTag(icmsTotBlock, "vFrete") || "0");

  // 5. Itens da Nota (<det>)
  const detBlocks = extractTagBlocks(xmlContent, "det");
  const items: ParsedItem[] = [];

  detBlocks.forEach((det, idx) => {
    const prodBlock = extractTag(det, "prod");
    if (!prodBlock) return;

    const cProd = extractTag(prodBlock, "cProd");
    const xProd = extractTag(prodBlock, "xProd");
    const ncm = extractTag(prodBlock, "NCM");
    const cfop = extractTag(prodBlock, "CFOP");
    const uCom = (extractTag(prodBlock, "uCom") || "UN").toUpperCase();
    const qCom = parseFloat(extractTag(prodBlock, "qCom") || "1");
    const vUnCom = parseFloat(extractTag(prodBlock, "vUnCom") || "0");
    const vProd = parseFloat(extractTag(prodBlock, "vProd") || "0");

    items.push({
      itemNumber: idx + 1,
      productCode: cProd,
      productName: xProd || `Item ${idx + 1}`,
      ncm,
      cfop,
      unit: uCom,
      quantity: qCom,
      unitPrice: vUnCom,
      totalPrice: vProd || qCom * vUnCom,
    });
  });

  // 6. Cobrança / Duplicatas / Parcelas (<cobr>)
  const cobrBlock = extractTag(xmlContent, "cobr");
  const dupBlocks = extractTagBlocks(cobrBlock, "dup");
  const installments: ParsedInstallment[] = [];

  if (dupBlocks.length > 0) {
    dupBlocks.forEach((dup, idx) => {
      const nDup = extractTag(dup, "nDup") || String(idx + 1);
      const dVenc = extractTag(dup, "dVenc") || new Date().toISOString().split("T")[0];
      const vDup = parseFloat(extractTag(dup, "vDup") || "0");

      installments.push({
        number: nDup,
        dueDate: dVenc,
        amount: vDup,
      });
    });
  } else {
    // Se não houver duplicatas discriminadas, gera 1 parcela à vista / 30 dias
    const defaultDue = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    installments.push({
      number: "1",
      dueDate: defaultDue,
      amount: vNF || items.reduce((acc, it) => acc + it.totalPrice, 0),
    });
  }

  return {
    key: key || `NFE-${Date.now()}`,
    number: nNF || "S/N",
    series: serie,
    issueDate,
    totalAmount: vNF || items.reduce((acc, it) => acc + it.totalPrice, 0),
    productsAmount: vProdTotal,
    discountAmount: vDescTotal,
    freightAmount: vFreteTotal,
    supplier,
    items,
    installments,
  };
}
