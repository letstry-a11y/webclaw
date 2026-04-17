"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function AdminCommentActions({ commentId }: { commentId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("确定要删除这条评论吗？")) return;
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      title="删除评论"
      className="p-1.5 rounded text-text-tertiary hover:text-accent hover:bg-accent/5 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
