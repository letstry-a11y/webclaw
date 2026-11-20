"use client";
import { useState } from "react";
import { authButtonClass, authInputClass } from "@/components/auth/AuthShell";

export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const url = new URL(window.location.href);
    const activation = new URLSearchParams(url.hash.slice(1)).get("activation");
    setError(""); setBusy(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, activation: activation || undefined }) });
      if (!response.ok) { setError((await response.json()).error || "登录失败"); return; }
      const next = new URL(url.searchParams.get("next") || "/", url.origin);
      window.location.replace(next.origin === url.origin ? next.pathname + next.search : "/");
    } catch { setError("登录服务暂时无法连接，请重试。"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <label className="block text-sm font-bold">企业邮箱或管理员账号<input name="email" className={authInputClass} autoComplete="username" required maxLength={120}/></label>
    <label className="block text-sm font-bold">密码<input name="password" className={authInputClass} type="password" autoComplete="current-password" required maxLength={128}/></label>
    <p className="text-sm text-slate-600">使用初始密码时，请从管理员提供的个人激活链接登录。</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button className={authButtonClass} disabled={busy}>{busy ? "登录中…" : "登录"}</button>
    <a href="/forgot-password" className="block text-sm text-[#032a72]">忘记密码</a>
  </form>;
}
