import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminCategoryForm from "@/components/admin/AdminCategoryForm";

export default async function AdminCategoriesPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">分类管理</h1>
      <AdminCategoryForm categories={categories} />
    </div>
  );
}
