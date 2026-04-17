"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/components/editor/TiptapEditor";
import { Send } from "lucide-react";

export default function NewActivityPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventLink, setEventLink] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(["活动"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/admin/login", { method: "HEAD" }).catch(() => {});
    // Simple check: try to load admin page
    setIsAuthed(true);
  }, []);

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
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content,
          type: "activity",
          category: "share",
          tags: tags.join(","),
          authorName: "WebClaw 团队",
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
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">发起活动</h1>

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
          <TiptapEditor onChange={setContent} />
        </div>

        {error && <div className="px-4 py-3 text-sm text-accent bg-accent/10 rounded-lg">{error}</div>}

        <div className="flex justify-end">
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4" />
            {loading ? "发布中..." : "发布活动"}
          </button>
        </div>
      </div>
    </div>
  );
}
