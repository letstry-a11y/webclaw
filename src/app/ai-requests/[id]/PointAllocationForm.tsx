"use client";

import { useActionState, useMemo, useState } from "react";
import { CircleDollarSign, Plus, Trash2 } from "lucide-react";
import type { PointAllocationActionState } from "../actions";

type ExistingMember = {
  id: string;
  name: string;
  department: string;
  email: string;
  role: string;
  isLead: boolean;
};

type HistoricalMember = { key: number };

const fieldClass = "w-full border border-[#cbd5e6] bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#8491a8] focus:border-[#4870ff] focus:outline-none focus:ring-1 focus:ring-[#4870ff]";
const labelClass = "mb-1.5 block text-xs font-bold text-[#52627d]";
const panelClass = "border border-[#d8e0ee] bg-white p-5 sm:p-6";

export default function PointAllocationForm({
  action,
  members,
  finalPointPool,
  defaultProposer,
  initialRatios = {},
  defaultAllocationNote = "",
  isRevision = false,
}: {
  action: (state: PointAllocationActionState, formData: FormData) => Promise<PointAllocationActionState>;
  members: ExistingMember[];
  finalPointPool: number;
  defaultProposer: string;
  initialRatios?: Record<string, number>;
  defaultAllocationNote?: string;
  isRevision?: boolean;
}) {
  const [historicalMembers, setHistoricalMembers] = useState<HistoricalMember[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [visibleMemberIds, setVisibleMemberIds] = useState(() => members.map((member) => member.id));
  const [ratios, setRatios] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(initialRatios).map(([memberId, ratioTenths]) => [`existing-${memberId}`, (ratioTenths / 10).toFixed(1)])),
  );
  const [actionState, formAction, isPending] = useActionState(action, { error: "", success: "" });
  const visibleMembers = members.filter((member) => visibleMemberIds.includes(member.id));
  const removedMembers = members.filter((member) => !visibleMemberIds.includes(member.id));

  const ratioTotal = useMemo(
    () => [
      ...visibleMemberIds.map((memberId) => ratios[`existing-${memberId}`]),
      ...historicalMembers.map((member) => ratios[`new-${member.key}`]),
    ].reduce((sum, value) => sum + (Number(value) || 0), 0),
    [historicalMembers, ratios, visibleMemberIds],
  );

  function updateRatio(key: string, value: string) {
    setRatios((current) => ({ ...current, [key]: value }));
  }

  function addHistoricalMember() {
    setHistoricalMembers((current) => [...current, { key: nextKey }]);
    setNextKey((current) => current + 1);
  }

  function removeHistoricalMember(key: number) {
    setHistoricalMembers((current) => current.filter((member) => member.key !== key));
    setRatios((current) => {
      const next = { ...current };
      delete next[`new-${key}`];
      return next;
    });
  }

  function removeExistingMember(memberId: string) {
    setVisibleMemberIds((current) => current.filter((id) => id !== memberId));
  }

  function restoreExistingMember(memberId: string) {
    setVisibleMemberIds((current) => [...current, memberId]);
    setRatios((current) => ({
      ...current,
      [`existing-${memberId}`]: initialRatios[memberId] ? (initialRatios[memberId] / 10).toFixed(1) : "",
    }));
  }

  return (
    <form action={formAction} className={`${panelClass} space-y-5`}>
      <div>
        <h2 className="text-2xl font-black">{isRevision ? "修改个人积分分配" : "项目负责人确认积分分配"}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6b7890]">
          最终项目积分为 <strong className="text-[#032a72]">{finalPointPool.toLocaleString("zh-CN")} 分</strong>。可补录历史参与人员，并按实际贡献比例分配；全部人员比例合计必须为 100%。{isRevision ? "保存后，系统仅按新旧方案差额调整已发放的首期 70% 积分，不会重复发放。" : "负责人确认后将直接发放首期 70% 积分并进入质保。"}
        </p>
      </div>

      <div className="border-y border-[#e2e8f2]">
        {visibleMembers.map((member) => {
          const ratioKey = `existing-${member.id}`;
          const ratio = Number(ratios[ratioKey]) || 0;
          return (
            <div key={member.id} className="grid gap-3 border-b border-[#e2e8f2] py-4 last:border-b-0 sm:grid-cols-[1fr_160px_140px] sm:items-end">
              <input type="hidden" name="existingMemberId" value={member.id} />
              <div>
                <strong>{member.name}</strong>
                <span className="ml-2 text-xs text-[#6b7890]">{member.department} · {member.role}{member.isLead ? " · 主要负责人" : ""}</span>
                <p className="mt-1 text-xs text-[#8491a8]">{member.email}</p>
              </div>
              <div>
                <label className={labelClass}>分配比例（%）</label>
                <input className={fieldClass} name={`ratio-${member.id}`} type="number" min="0.1" max="100" step="0.1" required value={ratios[ratioKey] ?? ""} onChange={(event) => updateRatio(ratioKey, event.target.value)} placeholder="0.1–100" />
              </div>
              <div className="flex items-center justify-end gap-3 pb-2 text-right text-sm font-black text-[#032a72]">
                <span>约 {Math.round(finalPointPool * ratio / 100).toLocaleString("zh-CN")} 分</span>
                {isRevision && !member.isLead && <button type="button" onClick={() => removeExistingMember(member.id)} aria-label={`删除参与人 ${member.name}`} className="text-[#9b3030] hover:text-[#751f1f]"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
          );
        })}
      </div>

      {removedMembers.length > 0 && <div className="border-l-4 border-[#e9bd71] bg-[#fff7e8] px-4 py-3"><p className="text-sm font-bold text-[#70511f]">待删除参与人</p><div className="mt-2 flex flex-wrap gap-2">{removedMembers.map((member) => <button key={member.id} type="button" onClick={() => restoreExistingMember(member.id)} className="border border-[#d5ae6b] bg-white px-3 py-1.5 text-xs font-bold text-[#70511f] hover:border-[#9a6a1e]">{member.name} · 撤销删除</button>)}</div><p className="mt-2 text-xs leading-5 text-[#80663a]">保存后将撤回其已发放积分并移出项目团队；如可用积分不足，系统会阻止删除。</p></div>}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-lg font-black">增加参与人员</h3><p className="mt-1 text-xs text-[#6b7890]">可增加遗漏的历史成员或后续加入项目的参与人。</p></div>
          <button className="inline-flex items-center gap-2 border border-[#4870ff] px-4 py-2 text-sm font-black text-[#032a72] hover:bg-[#eef2ff]" type="button" onClick={addHistoricalMember}><Plus className="h-4 w-4" />增加人员</button>
        </div>

        {historicalMembers.map((member, index) => {
          const ratioKey = `new-${member.key}`;
          const ratio = Number(ratios[ratioKey]) || 0;
          return (
            <fieldset key={member.key} className="border border-[#d8e0ee] bg-[#fafbfd] p-4">
              <legend className="px-2 text-sm font-black">历史参与人 {index + 1}</legend>
              <input type="hidden" name="historicalKey" value={member.key} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div><label className={labelClass}>姓名</label><input className={fieldClass} name={`historicalName-${member.key}`} required maxLength={50} /></div>
                <div><label className={labelClass}>部门</label><input className={fieldClass} name={`historicalDepartment-${member.key}`} required maxLength={80} /></div>
                <div><label className={labelClass}>企业邮箱</label><input className={fieldClass} name={`historicalEmail-${member.key}`} type="email" required maxLength={120} /></div>
                <div><label className={labelClass}>项目角色</label><input className={fieldClass} name={`historicalRole-${member.key}`} required maxLength={100} placeholder="如：产品、开发、顾问" /></div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_140px] sm:items-end">
                <div><label className={labelClass}>主要贡献</label><input className={fieldClass} name={`historicalResponsibility-${member.key}`} maxLength={1000} placeholder="简要说明在项目中的实际贡献" /></div>
                <div><label className={labelClass}>分配比例（%）</label><input className={fieldClass} name={`historicalRatio-${member.key}`} type="number" min="0.1" max="100" step="0.1" required value={ratios[ratioKey] ?? ""} onChange={(event) => updateRatio(ratioKey, event.target.value)} /></div>
                <div className="flex items-center justify-end gap-3 pb-2"><strong className="text-sm text-[#032a72]">约 {Math.round(finalPointPool * ratio / 100).toLocaleString("zh-CN")} 分</strong><button type="button" onClick={() => removeHistoricalMember(member.key)} aria-label={`删除历史参与人 ${index + 1}`} className="text-[#9b3030] hover:text-[#751f1f]"><Trash2 className="h-4 w-4" /></button></div>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 border-l-4 p-4 ${Math.abs(ratioTotal - 100) < 0.001 ? "border-[#35a762] bg-[#edf9f1]" : "border-[#e9bd71] bg-[#fff7e8]"}`}>
        <span className="text-sm font-bold">当前比例合计</span>
        <strong className="text-xl">{ratioTotal.toFixed(1)}%</strong>
      </div>

      {actionState.error && <p role="alert" className="border-l-4 border-[#c94b4b] bg-[#fff1f1] px-4 py-3 text-sm font-bold text-[#8d2929]">{actionState.error}</p>}
      {actionState.success && <p role="status" className="border-l-4 border-[#35a762] bg-[#edf9f1] px-4 py-3 text-sm font-bold text-[#246f42]">{actionState.success}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={labelClass}>方案提出人</label><input className={fieldClass} name="proposer" required maxLength={80} defaultValue={defaultProposer} /></div>
        <div><label className={labelClass}>分配依据</label><textarea className={fieldClass} name="allocationNote" required rows={2} maxLength={2000} defaultValue={defaultAllocationNote} /></div>
      </div>
      <button disabled={isPending || Math.abs(ratioTotal - 100) >= 0.001} className="inline-flex items-center gap-2 bg-[#4870ff] px-5 py-3 text-sm font-black text-white hover:bg-[#5b80ff] disabled:cursor-not-allowed disabled:bg-[#9aa7bd]"><CircleDollarSign className="h-4 w-4" />{isPending ? "正在保存…" : isRevision ? "保存修改并同步积分差额" : "确认分配并进入质保"}</button>
    </form>
  );
}
