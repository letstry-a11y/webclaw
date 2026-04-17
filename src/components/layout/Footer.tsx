import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="text-sm text-text-secondary">WebClaw - 开放的匿名博客社区</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/posts" className="hover:text-primary transition-colors">博客</Link>
            <Link href="/activities" className="hover:text-primary transition-colors">活动</Link>
            <Link href="/admin/login" className="hover:text-primary transition-colors">管理</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
