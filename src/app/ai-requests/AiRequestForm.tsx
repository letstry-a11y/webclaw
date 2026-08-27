"use client";

import { useState } from "react";
import AttachmentUploader from "@/components/editor/AttachmentUploader";
import type { Attachment } from "@/lib/validators";
import { createAiRequest } from "./actions";

const fieldClass = "w-full border border-[#cbd5e6] bg-white px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#8491a8] focus:border-[#4870ff] focus:outline-none focus:ring-1 focus:ring-[#4870ff]";
const labelClass = "mb-1.5 block text-xs font-bold text-[#52627d]";

export default function AiRequestForm({ user }: { user: { name: string; department: string; email: string } }) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  return (
    <form action={createAiRequest} className="absolute right-0 z-40 mt-2 max-h-[75vh] w-[min(94vw,780px)] space-y-4 overflow-y-auto border border-[#cbd5e6] bg-white p-5 text-[#111827] shadow-2xl sm:p-6">
      <input type="hidden" name="attachments" value={JSON.stringify(attachments)} />
      <div><label className={labelClass}>需求名称</label><input className={fieldClass} name="title" required maxLength={120} placeholder="用一句话说明希望建设的 AI 应用" /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className={labelClass}>需求方姓名</label><input className={fieldClass} name="requesterName" required maxLength={50} defaultValue={user.name} readOnly /></div>
        <div><label className={labelClass}>需求部门</label><input className={fieldClass} name="requesterDepartment" required maxLength={80} defaultValue={user.department} readOnly /></div>
        <div><label className={labelClass}>企业邮箱</label><input className={fieldClass} name="requesterEmail" type="email" required maxLength={120} defaultValue={user.email} readOnly /></div>
      </div>
      <div><label className={labelClass}>业务背景</label><textarea className={fieldClass} name="background" required rows={3} maxLength={3000} placeholder="该需求产生于什么业务场景？" /></div>
      <div><label className={labelClass}>当前问题</label><textarea className={fieldClass} name="currentProblem" required rows={3} maxLength={3000} placeholder="目前的流程、效率或客户体验存在哪些问题？" /></div>
      <div><label className={labelClass}>希望实现的功能</label><textarea className={fieldClass} name="desiredFunctions" required rows={3} maxLength={3000} /></div>
      <div><label className={labelClass}>预期业务价值</label><textarea className={fieldClass} name="businessValue" required rows={3} maxLength={3000} placeholder="对收入、效率、成本、质量或客户体验的影响" /></div>
      <div><label className={labelClass}>预期交付成果</label><textarea className={fieldClass} name="expectedDeliverables" required rows={2} maxLength={2000} placeholder="系统、原型、报告、接口或其他成果" /></div>
      <div><label className={labelClass}>建议招募岗位与能力要求</label><textarea className={fieldClass} name="recruitmentRoles" required rows={3} maxLength={2000} placeholder="如：项目主导人 1 名；Agent 开发 2 名；业务顾问 1 名" /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className={labelClass}>期望完成日期</label><input className={fieldClass} name="targetDate" type="date" /></div>
        <div><label className={labelClass}>每周预计投入</label><input className={fieldClass} name="weeklyCommitment" maxLength={500} placeholder="如：每人每周 4 小时" /></div>
        <div><label className={labelClass}>数据敏感级别</label><select className={fieldClass} name="dataSensitivity" defaultValue="internal"><option value="public">公开数据</option><option value="internal">公司内部数据</option><option value="sensitive">敏感/受限数据</option></select></div>
      </div>
      <div><label className={labelClass}>可提供的数据与业务资源</label><textarea className={fieldClass} name="availableResources" rows={2} maxLength={2000} /></div>
      <div>
        <label className={labelClass}>需求附件</label>
        <AttachmentUploader
          value={attachments}
          onChange={setAttachments}
          max={5}
          uploadUrl="/api/ai-requests/upload"
          maxFileSizeMb={10}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp"
        />
      </div>
      <button className="w-full bg-[#4870ff] px-4 py-3 text-sm font-black text-white hover:bg-[#5b80ff]" type="submit">提交需求，进入AI发展委员会评审</button>
    </form>
  );
}
