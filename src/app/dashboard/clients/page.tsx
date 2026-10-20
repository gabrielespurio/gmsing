export const instant = false;

import { db } from "@/db";
import { clients } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ClientManager, ClientData } from "./client-manager";

export default async function ClientsPage() {
  const clientList = await db
    .select()
    .from(clients)
    .orderBy(desc(clients.createdAt));

  return (
    <ClientManager initialClients={clientList as ClientData[]} />
  );
}
