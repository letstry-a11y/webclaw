"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserActions({ id, email, status, version }: { id: string; email: string; status: string; version: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  async function submit(action: "approve" | "reject" | "reset") {
    if (action === "reset" && !window.confirm("重置 " + email + " 的密码并注销现有会话？")) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/users/" + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, version }) });
      const data = await response.json();
      setMessage(response.ok ? data.message : data.error);
      if (response.ok && data.activationLink) setLink(new URL(data.activationLink, window.location.origin).href);
      else if (response.ok) router.refresh();
    } catch { setMessage("操作未确认，请刷新查看账号状态。"); }
    finally { setBusy(false); }
  }
  const button = "rounded border border-slate-300 px-3 py-1 text-sm font-bold text-[#032a72] disabled:opacity-50";
  return <div className="space-y-2">{!link && <div className="flex gap-2">
    {status === "pending" ? <><button disabled={busy} className={button} onClick={() => submit("approve")}>批准注册</button><button disabled={busy} className={button} onClick={() => submit("reject")}>驳回</button></>
      : <button disabled={busy} className={button} onClick={() => submit("reset")}>重置密码</button>}
  </div>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {link && <div className="rounded border border-blue-200 p-3"><label className="text-sm font-bold">个人激活链接（仅本次显示）<input className="mt-1 w-full border p-2 text-sm" readOnly value={link} onFocus={event => event.target.select()} /></label>
      <button className={button + " mt-2"} onClick={() => { setLink(""); router.refresh(); }}>已保存链接</button></div>}
  </div>;
}
