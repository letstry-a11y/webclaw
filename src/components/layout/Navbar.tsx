"use client";

import Link from "next/link";
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
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-bold text-text-primary hidden sm:block">WebClaw</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 ml-8">
            <Link href="/" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              首页
            </Link>
            <Link href="/posts" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              博客
            </Link>
            <Link href="/activities" className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
              活动
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
                  className="pl-9 pr-4 py-2 w-48 lg:w-64 text-sm bg-bg rounded-full border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </form>

            <Link
              href="/posts/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-full transition-colors"
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
        <div className="md:hidden border-t border-border bg-white">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" className="block py-2 text-text-secondary hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              首页
            </Link>
            <Link href="/posts" className="block py-2 text-text-secondary hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              博客
            </Link>
            <Link href="/activities" className="block py-2 text-text-secondary hover:text-primary" onClick={() => setMobileMenuOpen(false)}>
              活动
            </Link>
            <form onSubmit={handleSearch} className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm bg-bg rounded-lg border border-border focus:outline-none focus:border-primary"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
