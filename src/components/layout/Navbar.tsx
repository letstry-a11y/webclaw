"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search, PenSquare, Menu, X, LogOut } from "lucide-react";

const sections = [
  ["/", "首页"], ["/ai-projects", "AI 看板"], ["/ai", "AI"], ["/robots", "机器人"], ["/success-stories", "成果案例"],
] as const;

export default function Navbar({ userName }: { userName: string }) {
  const router = useRouter();
  const path = usePathname();
  const active = (href: string) => path === href || (href !== "/" && path.startsWith(href + "/")) ||
    (href === "/ai-projects" && path.startsWith("/ai-requests"));
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav aria-label="主导航" className="sticky top-0 z-50 bg-[#032a72]/95 border-b border-white/15 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 group" aria-label="MedBot 微创机器人首页">
            <Image src="/brand/medbot-logo-white.png" alt="MEDBOT 微创机器人" width={169} height={47} priority className="h-10 w-auto transition-opacity group-hover:opacity-85" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            {sections.map(([href,label]) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
              className="whitespace-nowrap border-b-2 border-transparent py-2 text-sm text-white/85 hover:text-white aria-[current=page]:border-[#a7c3ff] aria-[current=page]:text-white">{label}</Link>)}
          </div>

          {/* Search + Write */}
          <div className="flex items-center gap-3 ml-auto">
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  aria-label="搜索文章"
                  placeholder="搜索文章…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2.5 w-48 lg:w-64 text-sm text-white bg-[#0d3278] border border-white/20 focus:outline-none focus:border-[#4870ff] focus:ring-1 focus:ring-[#4870ff]/30 transition-all placeholder:text-white/45"
                />
              </div>
            </form>

            <Link
              href="/posts/new" aria-label="写文章"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4870ff] hover:bg-[#5b80ff] text-white text-sm font-bold transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              <span className="hidden sm:inline">写文章</span>
            </Link>

            <Link href="/account" className="text-xs font-bold text-white/90" aria-label={`${userName}，我的账号`}>我的账号</Link>
            <form action="/api/auth/logout" method="post">
              <button aria-label={`${userName}，退出登录`} title={`${userName}，退出登录`} className="p-2 text-white/80 hover:text-white"><LogOut className="h-4 w-4" /></button>
            </form>
            <button
              aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/15 bg-[#032a72]">
          <div className="px-4 py-3 space-y-2">
            {sections.map(([href,label]) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
              className="block py-2 text-white/85 aria-[current=page]:font-bold" onClick={() => setMobileMenuOpen(false)}>{label}</Link>)}
            <form onSubmit={handleSearch} className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  aria-label="搜索文章"
                  placeholder="搜索文章…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm bg-bg border border-border focus:outline-none focus:border-primary"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
