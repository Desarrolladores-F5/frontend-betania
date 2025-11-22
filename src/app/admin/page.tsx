import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  // Redirige automáticamente al dashboard de administración
  redirect("/admin/dashboard");
}
