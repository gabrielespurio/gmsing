"use server";

import { db } from "@/db";
import { employees } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createEmployeeAction(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const document = (formData.get("document") as string)?.trim() || null;
  const role = (formData.get("role") as string)?.trim();
  const department = (formData.get("department") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim()?.toLowerCase() || null;
  const admissionDateRaw = formData.get("admissionDate") as string;
  const salaryRaw = (formData.get("salary") as string)?.replace(",", ".");
  const hourlyRateRaw = (formData.get("hourlyRate") as string)?.replace(",", ".");
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!name) {
    throw new Error("O nome do funcionário é obrigatório.");
  }
  if (!role) {
    throw new Error("O cargo / função é obrigatório.");
  }
  if (!department) {
    throw new Error("O setor / departamento é obrigatório.");
  }

  const admissionDate = admissionDateRaw ? new Date(admissionDateRaw) : null;
  const salary = salaryRaw && !isNaN(Number(salaryRaw)) ? salaryRaw : null;
  const hourlyRate = hourlyRateRaw && !isNaN(Number(hourlyRateRaw)) ? hourlyRateRaw : null;

  await db.insert(employees).values({
    name,
    document,
    role,
    department,
    phone,
    email,
    admissionDate,
    salary,
    hourlyRate,
    notes,
    active: true,
  });

  revalidatePath("/dashboard/employees");
}

export async function updateEmployeeAction(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const document = (formData.get("document") as string)?.trim() || null;
  const role = (formData.get("role") as string)?.trim();
  const department = (formData.get("department") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const email = (formData.get("email") as string)?.trim()?.toLowerCase() || null;
  const admissionDateRaw = formData.get("admissionDate") as string;
  const salaryRaw = (formData.get("salary") as string)?.replace(",", ".");
  const hourlyRateRaw = (formData.get("hourlyRate") as string)?.replace(",", ".");
  const notes = (formData.get("notes") as string)?.trim() || null;
  const active = formData.get("active") === "true";

  if (!id || !name) {
    throw new Error("Identificador e Nome do funcionário são obrigatórios.");
  }
  if (!role) {
    throw new Error("O cargo / função é obrigatório.");
  }
  if (!department) {
    throw new Error("O setor / departamento é obrigatório.");
  }

  const admissionDate = admissionDateRaw ? new Date(admissionDateRaw) : null;
  const salary = salaryRaw && !isNaN(Number(salaryRaw)) ? salaryRaw : null;
  const hourlyRate = hourlyRateRaw && !isNaN(Number(hourlyRateRaw)) ? hourlyRateRaw : null;

  await db
    .update(employees)
    .set({
      name,
      document,
      role,
      department,
      phone,
      email,
      admissionDate,
      salary,
      hourlyRate,
      notes,
      active,
      updatedAt: new Date(),
    })
    .where(eq(employees.id, id));

  revalidatePath("/dashboard/employees");
}

export async function toggleEmployeeStatusAction(id: string, active: boolean) {
  if (!id) return;

  await db
    .update(employees)
    .set({
      active,
      updatedAt: new Date(),
    })
    .where(eq(employees.id, id));

  revalidatePath("/dashboard/employees");
}

export async function deleteEmployeeAction(id: string) {
  if (!id) return;

  await db.delete(employees).where(eq(employees.id, id));

  revalidatePath("/dashboard/employees");
}
