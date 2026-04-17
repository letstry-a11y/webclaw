"use client";

import { useRef, useState } from "react";
import { Paperclip, X, UploadCloud, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/lib/validators";

interface Props {
  value: Attachment[];
  onChange: (list: Attachment[]) => void;
  max?: number;
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function AttachmentUploader({ value, onChange, max = 10 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function uploadOne(file: File): Promise<Attachment> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", "file");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "上传失败" }));
      throw new Error(error || "上传失败");
    }
    return res.json();
  }

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    const remaining = max - value.length;
    if (remaining <= 0) {
      setError(`最多只能上传 ${max} 个附件`);
      return;
    }
    const batch = files.slice(0, remaining);
    setError("");
    setUploading(true);
    try {
      const results: Attachment[] = [];
      for (const f of batch) {
        results.push(await uploadOne(f));
      }
      onChange([...value, ...results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  const remove = (idx: number) => {
    const next = [...value];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div>
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
          handleFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 py-6 px-4 border-2 border-dashed rounded-xl text-sm cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-bg/50",
          uploading && "opacity-60 cursor-wait"
        )}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        ) : (
          <UploadCloud className="w-6 h-6 text-text-secondary" />
        )}
        <div className="text-text-secondary text-center">
          <span className="text-primary font-medium">点击上传</span> 或拖拽文件到此处
        </div>
        <div className="text-xs text-text-tertiary">
          单文件最大 50MB · 最多 {max} 个
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(Array.from(e.target.files || []));
          e.target.value = "";
        }}
      />

      {error && <div className="mt-2 text-xs text-accent">{error}</div>}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((att, idx) => (
            <li
              key={att.url}
              className="flex items-center gap-3 px-3 py-2 bg-white border border-border-light rounded-lg"
            >
              {att.type.startsWith("image/") ? (
                <Paperclip className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-text-secondary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary truncate">{att.name}</div>
                <div className="text-xs text-text-tertiary">{formatSize(att.size)}</div>
              </div>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="p-1 text-text-tertiary hover:text-accent transition-colors"
                title="移除"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
