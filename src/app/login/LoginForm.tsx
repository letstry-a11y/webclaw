"use client";
import { useState, useSyncExternalStore } from "react";
import AccountForm from "@/components/auth/AccountForm";
import { authButtonClass, authInputClass } from "@/components/auth/AuthShell";

function subscribeToFragment(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function readActivation() {
  return new URLSearchParams(window.location.hash.slice(1)).get("activation");
}

export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activation = useSyncExternalStore(subscribeToFragment, readActivation, () => null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    const url = new URL(window.location.href);
    setError(""); setBusy(true);
    try {
      const response = await fetch(event.currentTarget.action, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, activation: readActivation() || undefined }) });
      if (!response.ok) { setError((await response.json()).error || "登录失败"); return; }
      const next = new URL(url.searchParams.get("next") || "/", url.origin);
      window.location.replace(next.origin === url.origin ? next.pathname + next.search : "/");
    } catch { setError("登录服务暂时无法连接，请重试。"); }
    finally { setBusy(false); }
  }
  return <AccountForm action="/api/auth/login" onSubmit={submit} className="space-y-4">
    <label className="block text-sm font-bold">企业邮箱或管理员账号<input name="email" className={authInputClass} autoComplete="username" required maxLength={120}/></label>
    <label className="block text-sm font-bold">密码<input name="password" className={authInputClass} type="password" autoComplete="current-password" required maxLength={128}/></label>
    <p role="status" className="text-sm text-slate-600">{activation
      ? "已读取个人激活链接。请输入账号和初始密码。"
      : "首次使用初始密码，请打开个人激活链接。已设置个人密码的用户可直接登录。"}</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button type="submit" className={authButtonClass} disabled={busy}>{busy ? "登录中…" : "登录"}</button>
    <a href="/forgot-password" className="block text-sm text-[#032a72]">忘记密码</a>
  </AccountForm>;
}
