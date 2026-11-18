"use client";

import { useActionState } from "react";

export type FormResult = { error?: string; success?: string };
export default function ActionForm({ action, button, children, className }: {
  action: (previous: FormResult, fields: FormData) => Promise<FormResult>;
  button: string; children: React.ReactNode; className?: string;
}) {
  const [result, save, pending] = useActionState(action, {} as FormResult);
  return <form action={save} onReset={(event) => event.preventDefault()} className={className ?? "weekly-form"}>
    {children}
    <div><button type="submit" disabled={pending} className="rounded bg-[#073a83] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "正在保存…" : button}</button></div>
    {result.error && <p role="alert" className="text-sm text-red-800">{result.error}</p>}
    {result.success && <p role="status" className="text-sm text-green-800">{result.success}</p>}
  </form>;
}
