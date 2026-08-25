import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import NewActivityForm from "./NewActivityForm";

export default async function NewActivityPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <NewActivityForm />;
}
