"use server";

import { db } from "@/db";
import { clients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createClientAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const tradeName = (formData.get("tradeName") as string)?.trim() || null;
  const personType = (formData.get("personType") as string) || "PJ";
  const document = (formData.get("document") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const whatsapp = (formData.get("whatsapp") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const state = (formData.get("state") as string)?.trim()?.toUpperCase() || "SP";
  const contactPerson = (formData.get("contactPerson") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    throw new Error("Razão Social / Nome do Cliente é obrigatório.");
  }

  await db.insert(clients).values({
    name,
    tradeName,
    personType,
    document,
    phone,
    whatsapp,
    email,
    address,
    city,
    state,
    contactPerson,
    notes,
    active: true,
  });

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}

export async function updateClientAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const tradeName = (formData.get("tradeName") as string)?.trim() || null;
  const personType = (formData.get("personType") as string) || "PJ";
  const document = (formData.get("document") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const whatsapp = (formData.get("whatsapp") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim() || null;
  const address = (formData.get("address") as string)?.trim() || null;
  const city = (formData.get("city") as string)?.trim() || null;
  const state = (formData.get("state") as string)?.trim()?.toUpperCase() || "SP";
  const contactPerson = (formData.get("contactPerson") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!id || !name) {
    throw new Error("Identificador e Nome do Cliente são obrigatórios.");
  }

  await db
    .update(clients)
    .set({
      name,
      tradeName,
      personType,
      document,
      phone,
      whatsapp,
      email,
      address,
      city,
      state,
      contactPerson,
      notes,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}

export async function toggleClientStatusAction(id: string, active: boolean) {
  if (!id) return;

  await db
    .update(clients)
    .set({
      active,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));

  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/quotes/new");
  revalidatePath("/dashboard/orders/new");
}
