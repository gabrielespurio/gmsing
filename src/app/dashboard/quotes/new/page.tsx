export const instant = false;

import { redirect } from "next/navigation";

export default function NewQuoteRedirectPage() {
  redirect("/dashboard/quotes?new=true");
}
