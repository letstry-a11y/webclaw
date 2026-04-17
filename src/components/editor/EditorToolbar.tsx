"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Loader2,
  FileCode,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-1.5 rounded-md hover:bg-bg transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        isActive && "bg-primary/10 text-primary"
      )}
    >
      {children}
    </button>
  );
}

interface Props {
  editor: Editor;
  onUploadImage: (files: File[]) => void;
  uploading: boolean;
  mode: "wysiwyg" | "markdown";
  onToggleMode: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function EditorToolbar({
  editor,
  onUploadImage,
  uploading,
  mode,
  onToggleMode,
  fullscreen,
  onToggleFullscreen,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isMd = mode === "markdown";

  const pickImage = () => fileRef.current?.click();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onUploadImage(files);
    e.target.value = "";
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("输入链接 URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const iconSize = "w-4 h-4";

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-border bg-white/90 backdrop-blur-sm">
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} disabled={isMd} title="加粗 ⌘B">
        <Bold className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} disabled={isMd} title="斜体 ⌘I">
        <Italic className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} disabled={isMd} title="删除线">
        <Strikethrough className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive("code")} disabled={isMd} title="行内代码">
        <Code className={iconSize} />
      </ToolbarButton>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} disabled={isMd} title="标题 1">
        <Heading1 className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} disabled={isMd} title="标题 2">
        <Heading2 className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive("heading", { level: 3 })} disabled={isMd} title="标题 3">
        <Heading3 className={iconSize} />
      </ToolbarButton>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} disabled={isMd} title="无序列表">
        <List className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} disabled={isMd} title="有序列表">
        <ListOrdered className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} disabled={isMd} title="引用">
        <Quote className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={isMd} title="分割线">
        <Minus className={iconSize} />
      </ToolbarButton>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolbarButton onClick={setLink} isActive={editor.isActive("link")} disabled={isMd} title="链接">
        <LinkIcon className={iconSize} />
      </ToolbarButton>
      <ToolbarButton onClick={pickImage} disabled={uploading || isMd} title={uploading ? "上传中..." : "插入图片"}>
        {uploading ? <Loader2 className={cn(iconSize, "animate-spin")} /> : <ImageIcon className={iconSize} />}
      </ToolbarButton>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <div className="ml-auto flex items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleMode}
          title={isMd ? "切换到可视化" : "切换到 Markdown 源码"}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors",
            isMd
              ? "bg-primary text-white border-primary hover:bg-primary-hover"
              : "border-border text-text-secondary hover:bg-bg hover:text-text-primary"
          )}
        >
          <FileCode className="w-3.5 h-3.5" />
          {isMd ? "Markdown" : "MD"}
        </button>
        <ToolbarButton
          onClick={onToggleFullscreen}
          title={fullscreen ? "退出全屏 Esc" : "全屏编辑"}
          isActive={fullscreen}
        >
          {fullscreen ? <Minimize2 className={iconSize} /> : <Maximize2 className={iconSize} />}
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || isMd} title="撤销 ⌘Z">
          <Undo className={iconSize} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || isMd} title="重做 ⌘⇧Z">
          <Redo className={iconSize} />
        </ToolbarButton>
      </div>
    </div>
  );
}
