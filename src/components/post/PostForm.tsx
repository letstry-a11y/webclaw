"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/components/editor/TiptapEditor";
import AttachmentUploader from "@/components/editor/AttachmentUploader";
import CoverImageUploader from "@/components/editor/CoverImageUploader";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import type { Attachment } from "@/lib/validators";
import { Send, X, ArrowLeft, Type, Trash2 } from "lucide-react";
import Link from "next/link";

export interface PostFormInitial {
  id?: string;
  title?: string;
  content?: string;
  category?: string;
  tags?: string;
  authorName?: string;
  coverImage?: string | null;
  attachments?: Attachment[];
  slug?: string;
}

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  initial?: PostFormInitial;
}

export default function PostForm({ mode, initial }: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [category, setCategory] = useState(initial?.category || "general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(
    initial?.tags ? initial.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
  );
  const [authorName, setAuthorName] = useState(
    initial?.authorName && initial.authorName !== "匿名用户" ? initial.authorName : ""
  );
  const [coverImage, setCoverImage] = useState(initial?.coverImage || "");
  const [attachments, setAttachments] = useState<Attachment[]>(initial?.attachments || []);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const charCount = useMemo(
    () => content.replace(/<[^>]*>/g, "").replace(/\s+/g, "").length,
    [content]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!loading && (title.trim() !== (initial?.title || "") || charCount > 0)) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [title, charCount, loading, initial?.title]);

  const handleSubmit = async () => {
    if (!title.trim()) return setError("请输入标题");
    if (!content.trim() || content === "<p></p>") return setError("请输入内容");

    setLoading(true);
    setError("");

    const payload = {
      title: title.trim(),
      content,
      category,
      tags: tags.join(","),
      authorName: authorName.trim() || "匿名用户",
      coverImage: coverImage || "",
      attachments,
    };

    try {
      if (isEdit) {
        if (!initial?.id) return setError("缺少文章 ID");
        const res = await fetch(`/api/posts/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          router.push(`/posts/${initial.slug}`);
          router.refresh();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "保存失败");
        }
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const post = await res.json();
          router.push(`/posts/${post.slug}`);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "发布失败，请重试");
        }
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !initial?.id) return;
    if (!window.confirm("确定要删除这篇文章吗？删除后不可恢复。")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${initial.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError("删除失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-bg/80 backdrop-blur-md border-b border-border-light">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href={isEdit && initial?.slug ? `/posts/${initial.slug}` : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEdit ? "取消" : "返回"}
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-text-tertiary">
            <Type className="w-3.5 h-3.5" />
            {charCount} 字
            {attachments.length > 0 && <span>· {attachments.length} 附件</span>}
          </div>
          <div className="flex items-center gap-2">
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={loading || deleting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-accent border border-accent/30 rounded-lg hover:bg-accent/10 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "删除中..." : "删除"}
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || deleting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? "保存中..." : isEdit ? "保存" : "发布"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <input
          type="text"
          placeholder="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full px-0 py-2 text-3xl sm:text-4xl font-bold bg-transparent border-0 focus:outline-none placeholder:text-text-tertiary"
        />
        <div className="mt-1 mb-8 text-xs text-text-tertiary text-right">
          {title.length}/200
        </div>

        <section className="mb-8">
          <label className="block text-sm font-medium text-text-secondary mb-2">封面图片</label>
          <CoverImageUploader value={coverImage} onChange={setCoverImage} />
        </section>

        <section className="mb-8">
          <label className="block text-sm font-medium text-text-secondary mb-2">正文</label>
          <TiptapEditor
            content={initial?.content || ""}
            onChange={setContent}
            placeholder="开始写作... 支持拖拽粘贴图片"
          />
        </section>

        <section className="mb-8">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            附件 <span className="text-text-tertiary font-normal">(可选)</span>
          </label>
          <AttachmentUploader value={attachments} onChange={setAttachments} />
        </section>

        <section className="mb-8 bg-white rounded-2xl border border-border-light p-5 sm:p-6 space-y-5">
          <h2 className="text-sm font-semibold text-text-primary">文章信息</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">昵称</label>
              <input
                type="text"
                placeholder="匿名用户"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={50}
                className="w-full px-3 py-2 text-sm bg-bg border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-bg border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              标签 <span className="text-text-tertiary font-normal">(最多 5 个)</span>
            </label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-tag-bg text-tag-text rounded-full"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-accent">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入标签后按回车"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={tags.length >= 5}
                className="flex-1 px-3 py-2 text-sm bg-bg border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50 transition-colors"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={tags.length >= 5 || !tagInput.trim()}
                className="px-4 py-2 text-sm text-text-secondary border border-border rounded-lg hover:bg-bg disabled:opacity-50 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 px-4 py-3 text-sm text-accent bg-accent/10 border border-accent/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="sm:hidden flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
          >
            <Send className="w-4 h-4" />
            {loading ? "保存中..." : isEdit ? "保存" : "发布文章"}
          </button>
        </div>
      </div>
    </div>
  );
}
