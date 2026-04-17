"use client";

import { useRouter } from "next/navigation";
import { Pin, Star, Trash2, Eye, EyeOff } from "lucide-react";
import type { Post } from "@/types";

export default function AdminPostActions({ post }: { post: Post }) {
  const router = useRouter();

  const handleAction = async (action: string) => {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇文章吗？")) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleAction("togglePin")}
        title={post.isPinned ? "取消置顶" : "置顶"}
        className={`p-1.5 rounded transition-colors ${post.isPinned ? "text-accent bg-accent/10" : "text-text-tertiary hover:text-accent hover:bg-accent/5"}`}
      >
        <Pin className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => handleAction("toggleFeatured")}
        title={post.isFeatured ? "取消精品" : "设为精品"}
        className={`p-1.5 rounded transition-colors ${post.isFeatured ? "text-warning bg-warning/10" : "text-text-tertiary hover:text-warning hover:bg-warning/5"}`}
      >
        <Star className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => handleAction("togglePublish")}
        title={post.isPublished ? "取消发布" : "发布"}
        className="p-1.5 rounded text-text-tertiary hover:text-primary hover:bg-primary/5 transition-colors"
      >
        {post.isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={handleDelete}
        title="删除"
        className="p-1.5 rounded text-text-tertiary hover:text-accent hover:bg-accent/5 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
