import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#050605] border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary flex items-center justify-center">
              <span className="text-black font-black text-xs">M</span>
            </div>
            <span className="text-sm text-text-secondary">Medbot - 开放的 AI 实践社区</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/ai-projects" className="hover:text-primary transition-colors">AI 看板</Link>
            <Link href="/ai" className="hover:text-primary transition-colors">AI</Link>
            <Link href="/robots" className="hover:text-primary transition-colors">机器人</Link>
            <Link href="/success-stories" className="hover:text-primary transition-colors">成果案例</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
