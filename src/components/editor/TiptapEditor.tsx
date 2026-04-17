"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { useCallback, useRef, useState } from "react";
import EditorToolbar from "./EditorToolbar";

interface TiptapEditorProps {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

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
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

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

  if (!editor) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-shadow">
      <EditorToolbar editor={editor} onUploadImage={runUpload} uploading={uploading} />
      {uploadError && (
        <div className="px-4 py-2 text-xs text-accent bg-accent/10 border-b border-accent/20">
          {uploadError}
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
