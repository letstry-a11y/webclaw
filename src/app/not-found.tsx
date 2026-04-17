import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">页面未找到</h1>
        <p className="text-text-secondary mb-6">你访问的页面不存在或已被删除</p>
        <Link
          href="/"
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
