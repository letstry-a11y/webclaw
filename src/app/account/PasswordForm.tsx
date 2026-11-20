"use client";
import { useState } from "react";
import AccountForm from "@/components/auth/AccountForm";
import { authInputClass, authButtonClass } from "@/components/auth/AuthShell";

export default function PasswordForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      const response = await fetch(form.action, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await response.json();
      setMessage(response.ok ? "密码已修改，其他设备需要重新登录。" : data.error);
      if (response.ok) form.reset();
    } catch { setMessage("服务暂时无法连接，请重试。"); }
    finally { setBusy(false); }
  }
  return <AccountForm action="/api/auth/change-password" onSubmit={submit} className="space-y-3">{[["currentPassword","当前密码"],["password","新密码（至少 8 位）"],["confirmPassword","确认新密码"]].map(([key,label]) => <label key={key} className="block text-sm font-bold">{label}<input className={authInputClass} name={key} type="password" required minLength={key === "currentPassword" ? 1 : 8} maxLength={128} autoComplete={key === "currentPassword" ? "current-password" : "new-password"}/></label>)}
    <button className={authButtonClass} disabled={busy}>保存新密码</button>{message && <p role="status">{message}</p>}
  </AccountForm>;
}
