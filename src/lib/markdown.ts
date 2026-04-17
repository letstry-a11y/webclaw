import { marked } from "marked";
import TurndownService from "turndown";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({ gfm: true, breaks: true });

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "_",
});

turndown.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

turndown.addRule("preserveImageAlt", {
  filter: "img",
  replacement: (_content, node) => {
    const el = node as HTMLImageElement;
    const alt = el.getAttribute("alt") || "";
    const src = el.getAttribute("src") || "";
    return src ? `![${alt}](${src})` : "";
  },
});

export function markdownToHtml(md: string): string {
  const raw = marked.parse(md, { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    ADD_ATTR: ["target", "rel"],
  });
}

export function htmlToMarkdown(html: string): string {
  if (!html || html === "<p></p>") return "";
  return turndown.turndown(html).trim();
}
