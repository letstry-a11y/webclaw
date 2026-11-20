"use client";
import { useState } from "react";
import { authInputClass, authButtonClass } from "@/components/auth/AuthShell";

export default function RegisterForm() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      setResult(response.ok ? data.message : data.error); setDone(response.ok);
    } catch { setResult("申请未能送达，请重试。"); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    {!done && <>
      <label className="block text-sm">姓名<input className={authInputClass} name="name" autoComplete="name" required maxLength={50}/></label>
      <label className="block text-sm">部门<input className={authInputClass} name="department" required maxLength={80}/></label>
      <label className="block text-sm">企业邮箱<input className={authInputClass} name="email" type="email" autoComplete="email" placeholder="name@microport.com" required maxLength={120}/></label>
      <button type="submit" className={authButtonClass} disabled={busy}>{busy ? "正在提交…" : "提交注册申请"}</button>
    </>}
    {result && <p role="status" className="text-sm">{result}</p>}
  </form>;
}
