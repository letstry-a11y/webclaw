"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, PenSquare, Menu, X } from "lucide-react";

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
    <nav className="sticky top-0 z-50 bg-[#032a72]/95 border-b border-white/15 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[68px]">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 group" aria-label="MedBot 微创机器人首页">
            <Image src="/brand/medbot-logo-white.png" alt="MEDBOT 微创机器人" width={169} height={47} priority className="h-10 w-auto transition-opacity group-hover:opacity-85" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              首页
            </Link>
            <Link href="/ai-projects" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              AI 看板
            </Link>
            <Link href="/ai" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              AI
            </Link>
            <Link href="/robots" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              机器人
            </Link>
            <Link href="/success-stories" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              成果案例
            </Link>
          </div>

          {/* Search + Write */}
          <div className="flex items-center gap-3 ml-auto">
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2.5 w-48 lg:w-64 text-sm text-white bg-[#0d3278] border border-white/20 focus:outline-none focus:border-[#4870ff] focus:ring-1 focus:ring-[#4870ff]/30 transition-all placeholder:text-white/45"
                />
              </div>
            </form>

            <Link
              href="/posts/new"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4870ff] hover:bg-[#5b80ff] text-white text-sm font-bold transition-colors"
            >
              <PenSquare className="w-4 h-4" />
              <span className="hidden sm:inline">写文章</span>
            </Link>

            {/* Mobile menu button */}
            <button
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
