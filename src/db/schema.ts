import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  numeric,
  jsonb,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// USUÁRIOS
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(), // admin, comercial, producao, financeiro
  allowedModules: text("allowed_modules").default('["all"]').notNull(), // JSON array de modulos ou ["all"]
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// CLIENTES
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  tradeName: varchar("trade_name", { length: 255 }),
  document: varchar("document", { length: 30 }), // CPF ou CNPJ
  personType: varchar("person_type", { length: 10 }).default("PJ").notNull(), // PF ou PJ
  phone: varchar("phone", { length: 50 }),
  whatsapp: varchar("whatsapp", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 10 }),
  contactPerson: varchar("contact_person", { length: 255 }),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// FORNECEDORES
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  tradeName: varchar("trade_name", { length: 255 }),
  document: varchar("document", { length: 30 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  contactPerson: varchar("contact_person", { length: 255 }),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CATEGORIAS DE MATERIAIS
export const materialCategories = pgTable("material_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// UNIDADES DE MEDIDA
export const measurementUnits = pgTable("measurement_units", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// MATERIAIS / ESTOQUE
export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // ACM, Lona, Vinil, Metalon, LED, Acrílico, etc.
  unit: varchar("unit", { length: 30 }).notNull(), // m2, ml, un, chapa, barra, litro
  costPriceCents: integer("cost_price_cents").notNull(), // custo em centavos
  currentStock: numeric("current_stock", { precision: 12, scale: 2 }).default("0").notNull(),
  minStock: numeric("min_stock", { precision: 12, scale: 2 }).default("5").notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MOVIMENTAÇÕES DE ESTOQUE
export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  materialId: uuid("material_id").references(() => materials.id).notNull(),
  orderId: uuid("order_id"), // Referência ao pedido que consumiu
  type: varchar("type", { length: 20 }).notNull(), // 'entrada', 'saida', 'ajuste'
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(),
  unitCostCents: integer("unit_cost_cents").default(0).notNull(),
  reason: text("reason").notNull(), // Ex: "Consumo Orçamento ORC-2026-001 -> Pedido PED-2026-001"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SERVIÇOS E CUSTOS AUXILIARES
export const auxiliaryServices = pgTable("auxiliary_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // MaoDeObra, Instalacao, Deslocamento, Equipamento, Terceirizado
  unit: varchar("unit", { length: 30 }).notNull(), // hora, dia, km, un, diaria
  costPriceCents: integer("cost_price_cents").notNull(),
  defaultPriceCents: integer("default_price_cents").notNull(),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MODELOS DE PRODUTOS (Fachada ACM, Banner, Totem, etc)
export const productTemplates = pgTable("product_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  commercialUnit: varchar("commercial_unit", { length: 30 }).default("m2").notNull(),
  description: text("description"),
  defaultMarkupPercent: numeric("default_markup_percent", { precision: 5, scale: 2 }).default("50.00").notNull(),
  defaultLossPercent: numeric("default_loss_percent", { precision: 5, scale: 2 }).default("10.00").notNull(),
  defaultComponents: jsonb("default_components"), // Array com sugestão de materiais e serviços
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ORÇAMENTOS
export const quotes = pgTable("quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // ex: ORC-2026-001
  revision: integer("revision").default(1).notNull(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  userId: uuid("user_id").references(() => users.id),
  status: varchar("status", { length: 50 }).default("rascunho").notNull(), // rascunho, enviado, negociacao, aprovado, recusado, cancelado
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  validUntil: timestamp("valid_until").notNull(),
  paymentConditions: text("payment_conditions"),
  deliveryTimeDays: integer("delivery_time_days").default(15),
  commercialNotes: text("commercial_notes"),
  internalNotes: text("internal_notes"),
  subtotalCents: integer("subtotal_cents").default(0).notNull(),
  discountCents: integer("discount_cents").default(0).notNull(),
  totalCents: integer("total_cents").default(0).notNull(),
  estimatedCostCents: integer("estimated_cost_cents").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ITENS DO ORÇAMENTO (Com preservação histórica / snapshot)
export const quoteItems = pgTable("quote_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id").references(() => quotes.id).notNull(),
  productName: varchar("product_name", { length: 255 }).notNull(),
  description: text("description"),
  quantity: integer("quantity").default(1).notNull(),
  widthMeters: numeric("width_meters", { precision: 8, scale: 3 }),
  heightMeters: numeric("height_meters", { precision: 8, scale: 3 }),
  unitArea: numeric("unit_area", { precision: 8, scale: 3 }),
  totalArea: numeric("total_area", { precision: 8, scale: 3 }),
  pricingMethod: varchar("pricing_method", { length: 50 }).default("composicao").notNull(), // composicao, m2, ml, unidade, manual
  costSnapshot: jsonb("cost_snapshot"), // Snapshot completo dos custos de materiais, perdas e servicos
  unitCostCents: integer("unit_cost_cents").default(0).notNull(),
  totalCostCents: integer("total_cost_cents").default(0).notNull(),
  unitPriceCents: integer("unit_price_cents").default(0).notNull(),
  totalPriceCents: integer("total_price_cents").default(0).notNull(),
  notes: text("notes"),
});

// PEDIDOS (Substitui Ordens de Serviço com foco comercial/produção/financeiro/estoque)
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // ex: PED-2026-001
  title: varchar("title", { length: 255 }),
  quoteId: uuid("quote_id").references(() => quotes.id),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  assignedUserId: uuid("assigned_user_id").references(() => users.id),
  status: varchar("status", { length: 50 }).default("pendente_pagamento").notNull(), 
  // pendente_pagamento, aguardando_material, em_producao, pronto_instalacao, em_instalacao, concluido, cancelado
  priority: varchar("priority", { length: 20 }).default("normal").notNull(), // baixa, normal, alta, urgente
  paymentMethod: varchar("payment_method", { length: 50 }).default("pix").notNull(), // pix, boleto, cartao_credito, transferencia, dinheiro, faturado
  paymentTerms: text("payment_terms"), // ex: "50% de entrada + 50% na instalação (2x)"
  installmentsCount: integer("installments_count").default(1).notNull(),
  totalAmountCents: integer("total_amount_cents").default(0).notNull(),
  stockDeducted: boolean("stock_deducted").default(false).notNull(),
  installationAddress: text("installation_address"),
  expectedStartDate: timestamp("expected_start_date"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  completedAt: timestamp("completed_at"),
  productionNotes: text("production_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// HISTÓRICO DO PEDIDO
export const orderHistory = pgTable("order_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }).notNull(),
  notes: text("notes"),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CONTAS A RECEBER (Vinculado ao Pedido e Orçamento)
export const accountsReceivable = pgTable("accounts_receivable", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id").references(() => clients.id).notNull(),
  quoteId: uuid("quote_id").references(() => quotes.id),
  orderId: uuid("order_id").references(() => orders.id),
  description: text("description").notNull(),
  installmentNumber: integer("installment_number").default(1).notNull(),
  totalInstallments: integer("total_installments").default(1).notNull(),
  amountCents: integer("amount_cents").notNull(),
  paidAmountCents: integer("paid_amount_cents").default(0).notNull(),
  balanceCents: integer("balance_cents").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("pix").notNull(),
  status: varchar("status", { length: 30 }).default("pendente").notNull(), // pendente, pago_parcial, pago, cancelado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RECEBIMENTOS EFETIVADOS
export const paymentsReceived = pgTable("payments_received", {
  id: uuid("id").defaultRandom().primaryKey(),
  receivableId: uuid("receivable_id").references(() => accountsReceivable.id).notNull(),
  amountCents: integer("amount_cents").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // pix, boleto, cartao, transferencia, dinheiro
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CONTAS A PAGAR
export const accountsPayable = pgTable("accounts_payable", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  purchaseId: uuid("purchase_id"),
  beneficiaryName: varchar("beneficiary_name", { length: 255 }).notNull(),
  orderId: uuid("order_id").references(() => orders.id),
  category: varchar("category", { length: 100 }).notNull(), // material, mao_de_obra, frete, equipamento, fixo
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  paidAmountCents: integer("paid_amount_cents").default(0).notNull(),
  balanceCents: integer("balance_cents").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: varchar("status", { length: 30 }).default("pendente").notNull(), // pendente, pago, cancelado
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CONFIGURAÇÕES DA EMPRESA
export const companySettings = pgTable("company_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: varchar("company_name", { length: 255 }).default("GM Sign Solutions").notNull(),
  tradeName: varchar("trade_name", { length: 255 }).default("GM Sign"),
  cnpj: varchar("cnpj", { length: 30 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  defaultQuoteValidityDays: integer("default_quote_validity_days").default(10).notNull(),
  defaultPaymentTerms: text("default_payment_terms").default("50% de entrada e o restante na entrega."),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PRODUTOS & SERVIÇOS
export const productsServices = pgTable("products_services", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // ex: PRD-001, SRV-001
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 20 }).default("produto").notNull(), // 'produto' ou 'servico'
  category: varchar("category", { length: 100 }).notNull(), // Fachadas, Letras Caixa, Banners, Totens, Instalação, etc.
  unit: varchar("unit", { length: 30 }).default("un").notNull(), // m2, ml, un, hora, diaria
  salePriceCents: integer("sale_price_cents").default(0).notNull(), // Preço base de venda em centavos
  costPriceCents: integer("cost_price_cents").default(0).notNull(), // Custo estimado ou soma dos insumos
  markupPercent: numeric("markup_percent", { precision: 5, scale: 2 }).default("50.00").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// COMPONENTES / FICHA TÉCNICA DO PRODUTO (Materiais do Estoque)
export const productComponents = pgTable("product_components", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => productsServices.id, { onDelete: "cascade" }).notNull(),
  materialId: uuid("material_id").references(() => materials.id, { onDelete: "cascade" }).notNull(),
  quantityPerUnit: numeric("quantity_per_unit", { precision: 12, scale: 3 }).notNull(), // Ex: 1.15 m2 por 1 m2 de fachada
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// COMPRAS & ENTRADAS DE NOTAS FISCAIS (XML)
export const purchases = pgTable("purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // Ex: COM-2026-001
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  nfeKey: varchar("nfe_key", { length: 50 }), // Chave de acesso de 44 dígitos da NF-e
  nfeNumber: varchar("nfe_number", { length: 30 }),
  nfeSeries: varchar("nfe_series", { length: 10 }),
  issueDate: timestamp("issue_date"),
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  totalAmountCents: integer("total_amount_cents").default(0).notNull(),
  status: varchar("status", { length: 30 }).default("concluido").notNull(), // concluido, cancelado
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ITENS DA COMPRA / NOTA FISCAL
export const purchaseItems = pgTable("purchase_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseId: uuid("purchase_id").references(() => purchases.id, { onDelete: "cascade" }).notNull(),
  materialId: uuid("material_id").references(() => materials.id), // Material do estoque associado
  rawProductName: varchar("raw_product_name", { length: 255 }).notNull(),
  rawProductCode: varchar("raw_product_code", { length: 50 }),
  ncm: varchar("ncm", { length: 20 }),
  cfop: varchar("cfop", { length: 10 }),
  quantity: numeric("quantity", { precision: 12, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 30 }).notNull(), // UN, M2, ML, KG, CHAPA
  unitCostCents: integer("unit_cost_cents").default(0).notNull(),
  totalCostCents: integer("total_cost_cents").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// FUNCIONÁRIOS / EQUIPE
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  document: varchar("document", { length: 30 }), // CPF
  role: varchar("role", { length: 100 }).notNull(), // Cargo: Impressor, Instalador, etc.
  department: varchar("department", { length: 100 }).notNull(), // Setor: Produção, Instalação, etc.
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  admissionDate: timestamp("admission_date"),
  salary: numeric("salary", { precision: 12, scale: 2 }),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  notes: text("notes"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});



