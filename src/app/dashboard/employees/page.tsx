export const instant = false;

import { db } from "@/db";
import { employees } from "@/db/schema";
import { desc } from "drizzle-orm";
import { EmployeeManager, EmployeeData } from "./employee-manager";

export default async function EmployeesPage() {
  const employeeList = await db
    .select()
    .from(employees)
    .orderBy(desc(employees.createdAt));

  return (
    <EmployeeManager initialEmployees={employeeList as EmployeeData[]} />
  );
}
