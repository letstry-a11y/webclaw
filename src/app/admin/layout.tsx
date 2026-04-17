import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import Link from "next/link";
import { LayoutDashboard, FileText, Calendar, MessageCircle, Tags, LogOut } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Allow login page without auth
  const admin = await isAdmin();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {admin ? (
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="bg-white rounded-xl border border-border-light p-4 sticky top-24 space-y-1">
              <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                <LayoutDashboard className="w-4 h-4" /> 仪表盘
              </Link>
              <Link href="/admin/posts" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                <FileText className="w-4 h-4" /> 文章管理
              </Link>
              <Link href="/admin/activities/new" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                <Calendar className="w-4 h-4" /> 发起活动
              </Link>
              <Link href="/admin/comments" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                <MessageCircle className="w-4 h-4" /> 评论管理
              </Link>
              <Link href="/admin/categories" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary-light rounded-lg transition-colors">
                <Tags className="w-4 h-4" /> 分类管理
              </Link>
              <div className="pt-2 mt-2 border-t border-border-light">
                <form action="/api/admin/logout" method="POST">
                  <button type="submit" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-accent hover:bg-accent/5 rounded-lg transition-colors w-full">
                    <LogOut className="w-4 h-4" /> 退出登录
                  </button>
                </form>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
