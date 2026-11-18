import { addProgress } from "@/app/ai-projects/products/actions";
import ActionForm from "./ActionForm";

export default function ProgressForm({ type, id }: { type: "request" | "product"; id: string }) {
  return <details className="mt-4">
    <summary className="cursor-pointer text-sm font-bold text-[#194c94]">记录项目进展</summary>
    <ActionForm action={addProgress.bind(null, type, id)} button="保存进展" className="mt-3 grid gap-3 text-sm">
      <label className="grid gap-1">更新人<input name="actor" required maxLength={80} className="rounded border border-slate-300 bg-white p-2"/></label>
      <label className="grid gap-1">进展内容<textarea name="content" required maxLength={2000} rows={3} className="rounded border border-slate-300 bg-white p-2"/></label>
    </ActionForm>
  </details>;
}
