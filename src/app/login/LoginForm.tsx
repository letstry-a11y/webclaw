"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authButtonClass, authInputClass } from "@/components/auth/AuthShell";

export default function LoginForm() {
  const router = useRouter(); const searchParams = useSearchParams();
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.error || "登录失败"); setLoading(false); return; }
    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/"); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-4">
    <div><label className="mb-1.5 block text-sm font-bold text-[#344054]">企业邮箱</label><input className={authInputClass} name="email" type="email" autoComplete="email" placeholder="name@microport.com" required /></div>
    <div><div className="mb-1.5 flex justify-between"><label className="text-sm font-bold text-[#344054]">密码</label><a href="/forgot-password" className="text-xs font-bold text-[#032a72] hover:underline">忘记密码</a></div><input className={authInputClass} name="password" type="password" autoComplete="current-password" required /></div>
    {error && <p className="border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button className={authButtonClass} disabled={loading}>{loading ? "登录中…" : "登录"}</button>
  </form>;
}
