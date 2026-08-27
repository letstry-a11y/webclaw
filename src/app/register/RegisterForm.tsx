"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authButtonClass, authInputClass } from "@/components/auth/AuthShell";

export default function RegisterForm() {
  const router = useRouter(); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false); const [submitting, setSubmitting] = useState(false); const [email, setEmail] = useState("");
  async function sendCode() {
    setSending(true); setError(""); setMessage("");
    const response = await fetch("/api/auth/send-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose: "register" }) });
    const result = await response.json().catch(() => ({})); setSending(false);
    if (!response.ok) return setError(result.error || "验证码发送失败");
    setMessage("验证码已发送至企业邮箱，10分钟内有效");
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("");
    const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) { setError(result.error || "注册失败"); setSubmitting(false); return; }
    router.replace("/"); router.refresh();
  }
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid grid-cols-2 gap-3"><div><label className="mb-1.5 block text-sm font-bold text-[#344054]">姓名</label><input className={authInputClass} name="name" required maxLength={50} /></div><div><label className="mb-1.5 block text-sm font-bold text-[#344054]">所属部门</label><input className={authInputClass} name="department" required maxLength={80} /></div></div>
    <div><label className="mb-1.5 block text-sm font-bold text-[#344054]">企业邮箱</label><input className={authInputClass} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@microport.com" required /></div>
    <div className="grid grid-cols-[1fr_auto] gap-2"><input className={authInputClass} name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="6位邮箱验证码" required /><button type="button" onClick={sendCode} disabled={sending || !email} className="border border-[#4870ff] px-3 text-sm font-bold text-[#032a72] disabled:opacity-50">{sending ? "发送中…" : "发送验证码"}</button></div>
    <div><label className="mb-1.5 block text-sm font-bold text-[#344054]">密码</label><input className={authInputClass} name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" placeholder="至少8位" required /></div>
    <div><label className="mb-1.5 block text-sm font-bold text-[#344054]">确认密码</label><input className={authInputClass} name="confirmPassword" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></div>
    {message && <p className="bg-blue-50 px-3 py-2 text-sm text-[#032a72]">{message}</p>}{error && <p className="border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    <button className={authButtonClass} disabled={submitting}>{submitting ? "注册中…" : "验证并注册"}</button>
  </form>;
}
