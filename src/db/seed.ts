import { db } from "./index";
import { users, companySettings } from "./schema";
import { scryptSync, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Iniciando seed do banco de dados...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@gmsign.com.br";
  const adminPassword = process.env.ADMIN_PASSWORD || "GMSign@2026";

  // Verifica se o admin já existe
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existingUser.length === 0) {
    const passwordHash = hashPassword(adminPassword);
    await db.insert(users).values({
      name: "Administrador GM Sign",
      email: adminEmail,
      passwordHash: passwordHash,
      role: "admin",
      active: true,
    });
    console.log(`Usuário Admin criado: ${adminEmail}`);
  } else {
    console.log(`Usuário Admin já existe: ${adminEmail}`);
  }

  // Verifica configurações da empresa
  const existingSettings = await db.select().from(companySettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(companySettings).values({
      companyName: "GM Sign Solutions Ltda",
      tradeName: "GM Sign Solutions",
      cnpj: "00.000.000/0001-00",
      phone: "(11) 99999-9999",
      email: "contato@gmsingsolutions.com.br",
      address: "São Paulo, SP",
      defaultQuoteValidityDays: 10,
      defaultPaymentTerms: "50% de sinal e 50% na conclusão da instalação.",
    });
    console.log("Configurações padrão da empresa criadas!");
  }

  console.log("Seed finalizado com sucesso!");
}

seed().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
