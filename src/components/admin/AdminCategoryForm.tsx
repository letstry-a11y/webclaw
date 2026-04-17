"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { Category } from "@/types";

export default function AdminCategoryForm({ categories: initialCategories }: { categories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim(), icon: icon.trim() || null }),
    });

    if (res.ok) {
      const cat = await res.json();
      setCategories([...categories, cat]);
      setName("");
      setSlug("");
      setIcon("");
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个分类吗？")) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories(categories.filter((c) => c.id !== id));
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Add new */}
      <form onSubmit={handleAdd} className="bg-white rounded-xl p-6 border border-border-light">
        <h3 className="text-sm font-semibold text-text-primary mb-4">添加分类</h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="名称"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:border-primary w-32"
          />
          <input
            type="text"
            placeholder="slug (英文)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:border-primary w-32"
          />
          <input
            type="text"
            placeholder="图标 (emoji)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:border-primary w-24"
          />
          <button type="submit" className="flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> 添加
          </button>
        </div>
      </form>

      {/* Category list */}
      <div className="bg-white rounded-xl border border-border-light overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50">
              <th className="text-left px-4 py-3 font-medium text-text-secondary">图标</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">名称</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">排序</th>
              <th className="text-left px-4 py-3 font-medium text-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-border-light">
                <td className="px-4 py-3">{cat.icon || "-"}</td>
                <td className="px-4 py-3 font-medium text-text-primary">{cat.name}</td>
                <td className="px-4 py-3 text-text-tertiary">{cat.slug}</td>
                <td className="px-4 py-3 text-text-tertiary">{cat.order}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded text-text-tertiary hover:text-accent hover:bg-accent/5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
