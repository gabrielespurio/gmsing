export const instant = false;

import { redirect } from "next/navigation";

export default function NewDirectOrderRedirectPage() {
  redirect("/dashboard/orders?new=true");
}
