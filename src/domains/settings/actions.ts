"use server";

import { db } from "@/db";
import { users, materialCategories, measurementUnits } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { scryptSync, randomBytes } from "node:crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/* =========================================================
   USUÁRIOS
========================================================= */

export async function createUserAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "comercial";

  if (!name || !email || !password) {
    throw new Error("Nome, e-mail e senha são obrigatórios.");
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    throw new Error("Já existe um usuário cadastrado com este e-mail.");
  }

  const passwordHash = hashPassword(password);

  await db.insert(users).values({
    name,
    email,
    passwordHash,
    role,
    active: true,
  });

  revalidatePath("/dashboard/settings");
}

export async function updateUserAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim()?.toLowerCase();
  const password = (formData.get("password") as string)?.trim();
  const role = (formData.get("role") as string) || "comercial";
  const active = formData.get("active") === "true";

  if (!id || !name || !email) {
    throw new Error("Identificador, nome e e-mail são obrigatórios.");
  }

  const updateData: Record<string, any> = {
    name,
    email,
    role,
    active,
    updatedAt: new Date(),
  };

  if (password) {
    updateData.passwordHash = hashPassword(password);
  }

  await db.update(users).set(updateData).where(eq(users.id, id));

  revalidatePath("/dashboard/settings");
}

export async function deleteUserAction(id: string) {
  if (!id) return;
  // Inativa o usuário com segurança
  await db.update(users).set({ active: false, updatedAt: new Date() }).where(eq(users.id, id));
  revalidatePath("/dashboard/settings");
}

/* =========================================================
   CATEGORIAS DE MATERIAIS
========================================================= */

export async function createCategoryAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) {
    throw new Error("O nome da categoria é obrigatório.");
  }

  await db.insert(materialCategories).values({
    name,
    description,
    active: true,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/stock");
}

export async function updateCategoryAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!id || !name) {
    throw new Error("Identificador e nome da categoria são obrigatórios.");
  }

  await db
    .update(materialCategories)
    .set({
      name,
      description,
      updatedAt: new Date(),
    })
    .where(eq(materialCategories.id, id));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/stock");
}

export async function deleteCategoryAction(id: string) {
  if (!id) return;

  try {
    await db.delete(materialCategories).where(eq(materialCategories.id, id));
  } catch {
    // Se houver vínculo, inativa
    await db
      .update(materialCategories)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(materialCategories.id, id));
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/stock");
}

/* =========================================================
   UNIDADES DE MEDIDA
========================================================= */

export async function createUnitAction(formData: FormData) {
  const code = (formData.get("code") as string)?.trim()?.toLowerCase();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!code || !name) {
    throw new Error("Código/Sigla e Nome da unidade são obrigatórios.");
  }

  await db.insert(measurementUnits).values({
    code,
    name,
    description,
    active: true,
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/stock");
}

export async function updateUnitAction(formData: FormData) {
  const id = formData.get("id") as string;
  const code = (formData.get("code") as string)?.trim()?.toLowerCase();
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!id || !code || !name) {
    throw new Error("Identificador, Código e Nome são obrigatórios.");
  }

  await db
    .update(measurementUnits)
    .set({
      code,
      name,
      description,
      updatedAt: new Date(),
    })
    .where(eq(measurementUnits.id, id));

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/stock");
}

export async function deleteUnitAction(id: string) {
  if (!id) return;

  try {
    await db.delete(measurementUnits).where(eq(measurementUnits.id, id));
  } catch {
    await db
      .update(measurementUnits)
      .set({ active: false, updatedAt: new Date() })
      .where(eq(measurementUnits.id, id));
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/stock");
}
