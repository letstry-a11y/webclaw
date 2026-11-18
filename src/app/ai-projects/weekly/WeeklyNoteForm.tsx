"use client";

import { useActionState } from "react";
import { saveWeeklyUpdate, type NoteResult } from "./actions";
import type { WeeklyReport } from "@/lib/project-weekly-report";

type Note = WeeklyReport["projects"][number]["week"]["note"];
export default function WeeklyNoteForm({ projectKey, week, note }: { projectKey: string; week: string; note: Note }) {
  const [state, action, pending] = useActionState(saveWeeklyUpdate.bind(null, projectKey, week), {} as NoteResult);
  return <form action={action} onReset={(event) => event.preventDefault()} className="weekly-form mt-4">
    <input type="hidden" name="version" value={note?.updatedAt ?? ""}/>
    <label>本周成果<textarea name="achievement" required maxLength={2000} rows={2} defaultValue={note?.achievement}/></label>
    <label>下周计划<textarea name="nextStep" required maxLength={2000} rows={2} defaultValue={note?.nextStep}/></label>
    <label>阻碍与所需资源（选填）<textarea name="blocker" maxLength={1000} rows={2} defaultValue={note?.blocker}/></label>
    <label>填报人<input name="author" required maxLength={80} defaultValue={note?.author}/></label>
    <div><button type="submit" className="portfolio-button primary" disabled={pending}>{pending ? "保存中…" : "保存周进展"}</button></div>
    {state.error && <p role="alert" className="text-red-800">{state.error}</p>}
    {state.saved && <p role="status" className="text-green-800">本周进展已保存。</p>}
  </form>;
}
