import { neon } from "@neondatabase/serverless";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_GgPS0y7FwzRe@ep-rough-pine-b69jev66-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);

async function syncSettingsTables() {
  console.log("Sincronizando tabelas de configurações no Neon...");

  await sql.query(`
    CREATE TABLE IF NOT EXISTS material_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS measurement_units (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(30) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  // Seed default categories
  const categoriesCount = await sql.query(`SELECT COUNT(*) as cnt FROM material_categories`);
  if (parseInt(categoriesCount[0].cnt) === 0) {
    const defaultCategories = [
      ["ACM", "Painéis de Alumínio Composto para fachadas e revestimentos"],
      ["Lona", "Lonas frontlight e backlight para painéis, banners e outdoors"],
      ["Vinil", "Vinil adesivo recortado, impresso, polimérico e cast"],
      ["Metalon", "Perfis e tubos galvanizados para estrutura metálica"],
      ["LED", "Módulos LED injetados, fitas LED e fontes chaveadas"],
      ["Acrílico", "Chapas de acrílico cast para letras caixa e sinalização"],
      ["Serralheria", "Chapas de aço, ferro chato, cantoneiras e solda"],
      ["Acessórios", "Parafusos, buchas, rebites, fitas dupla face e colas"],
      ["Outros", "Materiais e suprimentos diversos"]
    ];

    for (const [name, desc] of defaultCategories) {
      await sql.query(
        `INSERT INTO material_categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [name, desc]
      );
    }
    console.log("Categorias padrão inseridas!");
  }

  // Seed default measurement units
  const unitsCount = await sql.query(`SELECT COUNT(*) as cnt FROM measurement_units`);
  if (parseInt(unitsCount[0].cnt) === 0) {
    const defaultUnits = [
      ["chapa", "Chapa Inteira", "Unidade padrão para chapas (ex: 1220x5000mm)"],
      ["m2", "Metro Quadrado", "Medida de área calculada largura x altura"],
      ["ml", "Metro Linear", "Medida de comprimento contínuo"],
      ["barra", "Barra Padrão", "Barras de tubos e perfis (geralmente 6 metros)"],
      ["un", "Unidade", "Contagem por peça individual"],
      ["litro", "Litro", "Líquidos, solventes e tintas"],
      ["kg", "Quilograma", "Peso de materiais e metais"],
      ["rolo", "Rolo", "Rolos fechados de vinil, fitas ou lonas"],
      ["pacote", "Pacote", "Embalagens fechadas de parafusos e fixadores"]
    ];

    for (const [code, name, desc] of defaultUnits) {
      await sql.query(
        `INSERT INTO measurement_units (code, name, description) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
        [code, name, desc]
      );
    }
    console.log("Unidades de medida padrão inseridas!");
  }

  console.log("Sincronização de configurações finalizada!");
}

syncSettingsTables().catch(console.error);
