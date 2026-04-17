"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function CoverImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "上传失败" }));
        throw new Error(error || "上传失败");
      }
      const data = await res.json();
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  if (value) {
    return (
      <div className="relative group rounded-xl overflow-hidden border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="封面" className="w-full max-h-64 object-cover" />
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title="移除封面"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) upload(file);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-8 px-4 border-2 border-dashed rounded-xl text-sm cursor-pointer transition-colors",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-bg/50",
        uploading && "opacity-60 cursor-wait"
      )}
    >
      {uploading ? (
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      ) : (
        <ImagePlus className="w-6 h-6 text-text-secondary" />
      )}
      <div className="text-text-secondary">
        <span className="text-primary font-medium">上传封面</span> 或拖拽图片到此处
      </div>
      <div className="text-xs text-text-tertiary">建议 1600 × 900，最大 10MB</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {error && <div className="mt-1 text-xs text-accent">{error}</div>}
    </div>
  );
}
