"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, PenSquare, Menu, X, Zap } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#080a09]/90 border-b border-border backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-primary flex items-center justify-center text-black transition-transform group-hover:rotate-3">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div className="hidden sm:block leading-none">
              <span className="text-xl font-black tracking-tight text-text-primary">MEDBOT</span>
              <span className="block mt-1 text-[9px] font-mono tracking-[0.26em] text-primary">OPEN COMMUNITY</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            <Link href="/" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              首页
            </Link>
            <Link href="/ai-projects" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              AI 看板
            </Link>
            <Link href="/ai" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              AI
            </Link>
            <Link href="/robots" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              机器人
            </Link>
            <Link href="/success-stories" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              成果案例
            </Link>
          </div>

          {/* Search + Write */}
          <div className="flex items-center gap-3 ml-auto">
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2.5 w-48 lg:w-64 text-sm bg-[#111411] border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-tertiary"
                />
              </div>
            </form>

            <Link
              href="/posts/new"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-black text-sm font-bold transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              <span className="hidden sm:inline">写文章</span>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-[#0c0f0c]">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" className="block py-2 text-text-secondary hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              首页
            </Link>
            <Link href="/ai-projects" className="block py-2 text-text-secondary hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              AI 看板
            </Link>
            <Link href="/ai" className="block py-2 text-text-secondary hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              AI
            </Link>
            <Link href="/robots" className="block py-2 text-text-secondary hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              机器人
            </Link>
            <Link href="/success-stories" className="block py-2 text-text-secondary hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              成果案例
            </Link>
            <form onSubmit={handleSearch} className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="搜索文章..."
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
