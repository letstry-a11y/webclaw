"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const query = new URLSearchParams(window.location.search);
        const week = query.get("week") ?? "";
        router.replace(query.get("next") === "weekly" ? "/ai-projects/weekly" + (/^\d{4}-\d{2}-\d{2}$/.test(week) ? "?week=" + week : "") : "/admin");
      } else {
        setError("密码错误");
      }
    } catch {
      setError("登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[65vh] flex items-center justify-center bg-[#f5f7fb] p-4 text-[#17283f]">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-8 border border-border shadow-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-[#153e77]">管理员登录</h1>
            <p className="text-sm text-slate-600 mt-1">请输入管理密码</p>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              aria-label="管理密码"
              autoComplete="current-password"
              placeholder="管理密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-primary mb-4"
            />
            {error && (
              <div role="alert" className="text-sm text-red-800 mb-4">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
