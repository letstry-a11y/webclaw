"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EditorToolbar from "./EditorToolbar";
import { htmlToMarkdown, markdownToHtml } from "@/lib/markdown";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type Mode = "wysiwyg" | "markdown";

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", "image");
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: "上传失败" }));
    throw new Error(error || "上传失败");
  }
  const data = await res.json();
  return data.url as string;
}

export default function TiptapEditor({ content = "", onChange, placeholder }: TiptapEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [mode, setMode] = useState<Mode>("wysiwyg");
  const [markdown, setMarkdown] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  const runUpload = useCallback(async (files: File[]) => {
    if (!editorRef.current || files.length === 0) return;
    setUploadError("");
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadImage(file);
        editorRef.current.chain().focus().setImage({ src: url, alt: file.name }).run();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      Placeholder.configure({ placeholder: placeholder || "开始写作..." }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: { class: "tiptap" },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imgs = items
          .filter((i) => i.kind === "file" && i.type.startsWith("image/"))
          .map((i) => i.getAsFile())
          .filter((f): f is File => !!f);
        if (imgs.length > 0) {
          event.preventDefault();
          runUpload(imgs);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files || []).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length > 0) {
          event.preventDefault();
          runUpload(files);
          return true;
        }
        return false;
      },
    },
  });

  editorRef.current = editor;

  const toggleMode = useCallback(() => {
    if (!editor) return;
    if (mode === "wysiwyg") {
      setMarkdown(htmlToMarkdown(editor.getHTML()));
      setMode("markdown");
    } else {
      const html = markdown.trim() ? markdownToHtml(markdown) : "";
      editor.commands.setContent(html, { emitUpdate: true });
      setMode("wysiwyg");
    }
  }, [editor, mode, markdown]);

  const handleMarkdownChange = useCallback(
    (value: string) => {
      setMarkdown(value);
      const html = value.trim() ? markdownToHtml(value) : "";
      onChange(html);
    },
    [onChange]
  );

  const preview = useMemo(() => {
    if (mode !== "markdown") return "";
    return markdown.trim() ? markdownToHtml(markdown) : "";
  }, [mode, markdown]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "bg-white transition-shadow",
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col rounded-none border-0"
          : "border border-border rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20"
      )}
    >
      <EditorToolbar
        editor={editor}
        onUploadImage={runUpload}
        uploading={uploading}
        mode={mode}
        onToggleMode={toggleMode}
        fullscreen={fullscreen}
        onToggleFullscreen={() => setFullscreen((v) => !v)}
      />
      {uploadError && (
        <div className="px-4 py-2 text-xs text-accent bg-accent/10 border-b border-accent/20">
          {uploadError}
        </div>
      )}
      {mode === "wysiwyg" ? (
        <div
          className={cn(
            fullscreen ? "flex-1 overflow-y-auto" : "tiptap-wrapper"
          )}
        >
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 md:grid-cols-2",
            fullscreen
              ? "flex-1 min-h-0"
              : "h-[calc(100vh-260px)] min-h-[480px]"
          )}
        >
          <textarea
            value={markdown}
            onChange={(e) => handleMarkdownChange(e.target.value)}
            placeholder="# 标题&#10;&#10;在此处用 Markdown 语法书写..."
            spellCheck={false}
            className="w-full h-full px-4 py-3 text-sm font-mono leading-relaxed bg-white border-0 md:border-r border-b md:border-b-0 border-border-light focus:outline-none resize-none"
          />
          <div
            className="post-content px-4 py-3 bg-bg/30 overflow-auto text-sm h-full"
            dangerouslySetInnerHTML={{
              __html: preview || '<p class="text-text-tertiary">预览区 —— 开始输入以查看效果</p>',
            }}
          />
        </div>
      )}
    </div>
  );
}
