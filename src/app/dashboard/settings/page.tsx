export const instant = false;

import { db } from "@/db";
import { users, materialCategories, measurementUnits } from "@/db/schema";
import { desc } from "drizzle-orm";
import { SettingsManager, UserItem, CategoryItem, UnitItem } from "./settings-manager";

export default async function SettingsPage() {
  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      allowedModules: users.allowedModules,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const categoryList = await db
    .select({
      id: materialCategories.id,
      name: materialCategories.name,
      description: materialCategories.description,
      active: materialCategories.active,
      createdAt: materialCategories.createdAt,
    })
    .from(materialCategories)
    .orderBy(materialCategories.name);

  const unitList = await db
    .select({
      id: measurementUnits.id,
      code: measurementUnits.code,
      name: measurementUnits.name,
      description: measurementUnits.description,
      active: measurementUnits.active,
      createdAt: measurementUnits.createdAt,
    })
    .from(measurementUnits)
    .orderBy(measurementUnits.code);

  return (
    <SettingsManager
      initialUsers={userList as UserItem[]}
      initialCategories={categoryList as CategoryItem[]}
      initialUnits={unitList as UnitItem[]}
    />
  );
}
