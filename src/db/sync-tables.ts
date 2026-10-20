import { neon } from "@neondatabase/serverless";
import { scryptSync, randomBytes } from "node:crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_GgPS0y7FwzRe@ep-rough-pine-b69jev66-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function sync() {
  console.log("Iniciando sincronização de tabelas no Neon...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'admin' NOT NULL,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      trade_name VARCHAR(255),
      document VARCHAR(30),
      person_type VARCHAR(10) DEFAULT 'PJ' NOT NULL,
      phone VARCHAR(50),
      whatsapp VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(10),
      contact_person VARCHAR(255),
      notes TEXT,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS suppliers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      trade_name VARCHAR(255),
      document VARCHAR(30),
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      contact_person VARCHAR(255),
      notes TEXT,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS materials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      unit VARCHAR(30) NOT NULL,
      cost_price_cents INTEGER NOT NULL,
      current_stock NUMERIC(12, 2) DEFAULT 0 NOT NULL,
      min_stock NUMERIC(12, 2) DEFAULT 5 NOT NULL,
      supplier_id UUID REFERENCES suppliers(id),
      notes TEXT,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS stock_movements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      material_id UUID NOT NULL REFERENCES materials(id),
      order_id UUID,
      type VARCHAR(20) NOT NULL,
      quantity NUMERIC(12, 2) NOT NULL,
      unit_cost_cents INTEGER DEFAULT 0 NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS auxiliary_services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      unit VARCHAR(30) NOT NULL,
      cost_price_cents INTEGER NOT NULL,
      default_price_cents INTEGER NOT NULL,
      notes TEXT,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS product_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      commercial_unit VARCHAR(30) DEFAULT 'm2' NOT NULL,
      description TEXT,
      default_markup_percent NUMERIC(5, 2) DEFAULT 50.00 NOT NULL,
      default_loss_percent NUMERIC(5, 2) DEFAULT 10.00 NOT NULL,
      default_components JSONB,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) NOT NULL UNIQUE,
      revision INTEGER DEFAULT 1 NOT NULL,
      client_id UUID NOT NULL REFERENCES clients(id),
      user_id UUID REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'rascunho' NOT NULL,
      issue_date TIMESTAMP DEFAULT NOW() NOT NULL,
      valid_until TIMESTAMP NOT NULL,
      payment_conditions TEXT,
      delivery_time_days INTEGER DEFAULT 15,
      commercial_notes TEXT,
      internal_notes TEXT,
      subtotal_cents INTEGER DEFAULT 0 NOT NULL,
      discount_cents INTEGER DEFAULT 0 NOT NULL,
      total_cents INTEGER DEFAULT 0 NOT NULL,
      estimated_cost_cents INTEGER DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS quote_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      product_name VARCHAR(255) NOT NULL,
      description TEXT,
      quantity INTEGER DEFAULT 1 NOT NULL,
      width_meters NUMERIC(8, 3),
      height_meters NUMERIC(8, 3),
      unit_area NUMERIC(8, 3),
      total_area NUMERIC(8, 3),
      pricing_method VARCHAR(50) DEFAULT 'composicao' NOT NULL,
      cost_snapshot JSONB,
      unit_cost_cents INTEGER DEFAULT 0 NOT NULL,
      total_cost_cents INTEGER DEFAULT 0 NOT NULL,
      unit_price_cents INTEGER DEFAULT 0 NOT NULL,
      total_price_cents INTEGER DEFAULT 0 NOT NULL,
      notes TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) NOT NULL UNIQUE,
      quote_id UUID NOT NULL UNIQUE REFERENCES quotes(id),
      client_id UUID NOT NULL REFERENCES clients(id),
      assigned_user_id UUID REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'pendente_pagamento' NOT NULL,
      priority VARCHAR(20) DEFAULT 'normal' NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'pix' NOT NULL,
      payment_terms TEXT,
      installments_count INTEGER DEFAULT 1 NOT NULL,
      total_amount_cents INTEGER DEFAULT 0 NOT NULL,
      stock_deducted BOOLEAN DEFAULT FALSE NOT NULL,
      installation_address TEXT,
      expected_start_date TIMESTAMP,
      expected_delivery_date TIMESTAMP,
      completed_at TIMESTAMP,
      production_notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS order_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      previous_status VARCHAR(50),
      new_status VARCHAR(50) NOT NULL,
      notes TEXT,
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS accounts_receivable (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES clients(id),
      quote_id UUID REFERENCES quotes(id),
      order_id UUID REFERENCES orders(id),
      description TEXT NOT NULL,
      installment_number INTEGER DEFAULT 1 NOT NULL,
      total_installments INTEGER DEFAULT 1 NOT NULL,
      amount_cents INTEGER NOT NULL,
      paid_amount_cents INTEGER DEFAULT 0 NOT NULL,
      balance_cents INTEGER NOT NULL,
      due_date TIMESTAMP NOT NULL,
      payment_method VARCHAR(50) DEFAULT 'pix' NOT NULL,
      status VARCHAR(30) DEFAULT 'pendente' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS payments_received (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      receivable_id UUID NOT NULL REFERENCES accounts_receivable(id),
      amount_cents INTEGER NOT NULL,
      payment_date TIMESTAMP DEFAULT NOW() NOT NULL,
      payment_method VARCHAR(50) NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS accounts_payable (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_id UUID REFERENCES suppliers(id),
      beneficiary_name VARCHAR(255) NOT NULL,
      order_id UUID REFERENCES orders(id),
      category VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      paid_amount_cents INTEGER DEFAULT 0 NOT NULL,
      balance_cents INTEGER NOT NULL,
      due_date TIMESTAMP NOT NULL,
      status VARCHAR(30) DEFAULT 'pendente' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS company_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name VARCHAR(255) DEFAULT 'GM Sign Solutions' NOT NULL,
      trade_name VARCHAR(255) DEFAULT 'GM Sign',
      cnpj VARCHAR(30),
      phone VARCHAR(50),
      email VARCHAR(255),
      address TEXT,
      default_quote_validity_days INTEGER DEFAULT 10 NOT NULL,
      default_payment_terms TEXT DEFAULT '50% de entrada e o restante na entrega.',
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );`
  ];

  for (const q of queries) {
    await (sql as any).query(q);
  }
  console.log("Todas as tabelas foram criadas/sincronizadas!");

  // Seed Admin User
  const adminEmail = "admin@gmsign.com.br";
  const existingUsers = await (sql as any).query(`SELECT id FROM users WHERE email = $1`, [adminEmail]);
  if (existingUsers.length === 0) {
    const pwdHash = hashPassword("GMSign@2026");
    await (sql as any).query(
      `INSERT INTO users (name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, $5)`,
      ["Administrador GM Sign", adminEmail, pwdHash, "admin", true]
    );
    console.log("Usuário admin@gmsign.com.br criado com sucesso!");
  } else {
    console.log("Usuário admin já existe.");
  }

  // Seed sample materials
  const existingMats = await (sql as any).query(`SELECT COUNT(*) as cnt FROM materials`);
  if (parseInt(existingMats[0].cnt) === 0) {
    await (sql as any).query(`
      INSERT INTO materials (name, category, unit, cost_price_cents, current_stock, min_stock) VALUES
      ('Chapa ACM 3mm 1220x5000mm Prata', 'ACM', 'chapa', 28000, 25, 5),
      ('Chapa ACM 3mm 1220x5000mm Preto', 'ACM', 'chapa', 29500, 18, 5),
      ('Lona Frontlight 440g Fosca', 'Lona', 'm2', 1850, 150, 30),
      ('Vinil Adesivo Polimérico Branco', 'Vinil', 'm2', 2400, 80, 20),
      ('Perfil Metalon Galvanizado 20x20', 'Metalon', 'barra', 3800, 45, 10),
      ('Perfil Metalon Galvanizado 30x30', 'Metalon', 'barra', 5200, 30, 10),
      ('Módulo LED Injetado 12V 1.5W Branco', 'LED', 'un', 420, 300, 50),
      ('Fonte Chaveada 12V 30A Slim', 'LED', 'un', 9500, 12, 3),
      ('Chapa Acrílico Cast Cristal 3mm', 'Acrílico', 'm2', 18000, 8, 2)
    `);
    console.log("Materiais básicos de comunicação visual inseridos!");
  }

  // Seed sample clients if none
  const existingClients = await (sql as any).query(`SELECT COUNT(*) as cnt FROM clients`);
  if (parseInt(existingClients[0].cnt) === 0) {
    await (sql as any).query(`
      INSERT INTO clients (name, trade_name, document, person_type, phone, email, city, state, contact_person) VALUES
      ('Farmácia Vida Natural Ltda', 'Rede Vida Natural', '12.345.678/0001-90', 'PJ', '(11) 98765-4321', 'compras@vidanatural.com.br', 'São Paulo', 'SP', 'Roberto Ferreira'),
      ('Auto Center Prime Eireli', 'Prime Auto Center', '98.765.432/0001-10', 'PJ', '(11) 97654-3210', 'contato@primeauto.com.br', 'Campinas', 'SP', 'Carlos Eduardo'),
      ('Dra. Mariana Santos Odontologia', 'Clínica Odonto Prime', '123.456.789-00', 'PF', '(11) 99887-7665', 'mariana@odontoprime.com.br', 'São Paulo', 'SP', 'Mariana Santos')
    `);
    console.log("Clientes de exemplo inseridos!");
  }

  // Seed company settings if empty
  const settingsCount = await (sql as any).query(`SELECT COUNT(*) as cnt FROM company_settings`);
  if (parseInt(settingsCount[0].cnt) === 0) {
    await (sql as any).query(`
      INSERT INTO company_settings (company_name, trade_name, cnpj, phone, email, address, default_quote_validity_days, default_payment_terms) VALUES
      ('GM Sign Solutions Ltda', 'GM Sign Solutions', '45.123.789/0001-55', '(11) 91234-5678', 'contato@gmsign.com.br', 'Av. Industrial, 1500 - Galpão 4, SP', 10, '50% no pedido e 50% na conclusão da instalação.')
    `);
    console.log("Configurações da GM Sign inicializadas!");
  }

  console.log("Sincronização concluída com sucesso!");
}

sync().catch(console.error);
