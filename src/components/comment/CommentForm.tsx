"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import type { CommentWithReplies } from "@/types";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess: (comment: CommentWithReplies) => void;
  onCancel?: () => void;
  compact?: boolean;
}

export default function CommentForm({ postId, parentId, onSuccess, onCancel, compact }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          authorName: authorName.trim() || "匿名用户",
          postId,
          parentId,
        }),
      });

      if (res.ok) {
        const comment = await res.json();
        onSuccess({ ...comment, replies: [] });
        setContent("");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "" : "mb-4"}>
      <div className="flex gap-3 mb-3">
        <input
          type="text"
          placeholder="昵称（可选）"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          maxLength={50}
          className={`${compact ? "w-32" : "w-40"} px-3 py-2 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:border-primary`}
        />
      </div>
      <div className="flex gap-2">
        <textarea
          placeholder={parentId ? "回复..." : "写下你的评论..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={compact ? 2 : 3}
          maxLength={2000}
          className="flex-1 px-4 py-3 text-sm bg-bg border border-border rounded-lg focus:outline-none focus:border-primary resize-none"
        />
      </div>
      <div className="flex items-center justify-end gap-2 mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? "发送中..." : "发送"}
        </button>
      </div>
    </form>
  );
}
