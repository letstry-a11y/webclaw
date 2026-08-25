"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { Send } from "lucide-react";

interface ActivityFormData {
  title?: string;
  content?: string;
  eventDate?: string;
  eventLocation?: string;
  eventLink?: string;
}

export default function NewActivityForm({
  initial,
  postId,
  postSlug,
  mode = "create",
}: {
  initial?: ActivityFormData;
  postId?: string;
  postSlug?: string;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [eventLocation, setEventLocation] = useState(initial?.eventLocation || "");
  const [eventLink, setEventLink] = useState(initial?.eventLink || "");
  const [eventDate, setEventDate] = useState(initial?.eventDate || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["活动"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || "");
      setContent(initial.content || "");
      setEventLocation(initial.eventLocation || "");
      setEventLink(initial.eventLink || "");
      setEventDate(initial.eventDate || "");
    }
  }, [initial]);

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError("请输入活动标题");
    if (!content.trim() || content === "<p></p>") return setError("请输入活动内容");

    setLoading(true);
    setError("");

    try {
      if (mode === "edit" && postId) {
        const res = await fetch(`/api/posts/${postId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: title.trim(),
            content,
            eventDate,
            eventLocation: eventLocation.trim(),
            eventLink: eventLink.trim(),
          }),
        });
        if (res.ok) {
          router.push(`/activities/${postSlug}`);
          router.refresh();
        } else {
          setError("修改失败");
        }
      } else {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content,
            type: "activity",
            category: "share",
            tags: tags.join(","),
            authorName: "Medbot 团队",
            eventDate,
            eventLocation: eventLocation.trim(),
            eventLink: eventLink.trim(),
          }),
        });

        if (res.ok) {
          const post = await res.json();
          // Auto-pin the activity
          await fetch(`/api/posts/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "togglePin" }),
          });
          router.push(`/activities/${post.slug}`);
        } else {
          setError("发布失败");
        }
      }
    } catch (e) {
      console.error("Activity submit error:", e);
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        {mode === "edit" ? "编辑活动" : "发起活动"}
      </h1>

      <div className="space-y-6">
        <input
          type="text"
          placeholder="活动标题..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 text-xl font-semibold bg-white border border-border rounded-xl focus:outline-none focus:border-primary"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">活动日期</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">活动地点</label>
            <input type="text" placeholder="线上/线下" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">活动链接</label>
            <input type="url" placeholder="https://..." value={eventLink} onChange={(e) => setEventLink(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">标签</label>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1 text-sm bg-tag-bg text-tag-text rounded-full">
                {tag}
                <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="ml-1 hover:text-accent">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="添加标签" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              className="flex-1 px-3 py-2 text-sm bg-white border border-border rounded-lg focus:outline-none focus:border-primary" />
            <button type="button" onClick={addTag} className="px-4 py-2 text-sm bg-bg text-text-secondary border border-border rounded-lg hover:bg-border">添加</button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">活动详情</label>
          <TiptapEditor content={content} onChange={setContent} />
        </div>

        {error && <div className="px-4 py-3 text-sm text-accent bg-accent/10 rounded-lg">{error}</div>}

        <div className="flex justify-end gap-3">
          {mode === "edit" && (
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-bg text-text-secondary border border-border rounded-xl hover:bg-border transition-colors"
            >
              取消
            </button>
          )}
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4" />
            {loading ? (mode === "edit" ? "保存中..." : "发布中...") : (mode === "edit" ? "保存修改" : "发布活动")}
          </button>
        </div>
      </div>
    </div>
  );
}
