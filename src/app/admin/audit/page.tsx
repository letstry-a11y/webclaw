import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export default async function AuditPage() {
  if (!(await isAdmin())) throw new Error("没有管理员权限");
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
  return <div><div className="mb-6"><h1 className="text-2xl font-black">安全审计日志</h1><p className="mt-2 text-sm text-[#667085]">最近500条账号、权限、项目、积分与附件操作记录。</p></div><div className="overflow-x-auto border border-[#d8e0ee] bg-white"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#f7f9fc] text-[#52627d]"><tr><th className="p-3">时间</th><th className="p-3">操作人</th><th className="p-3">操作</th><th className="p-3">对象</th><th className="p-3">说明</th><th className="p-3">来源IP</th></tr></thead><tbody className="divide-y divide-[#e2e8f2]">{logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap p-3">{new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "medium" }).format(log.createdAt)}</td><td className="p-3"><strong>{log.actorName}</strong><span className="block text-[#667085]">{log.actorEmail}</span></td><td className="p-3 font-bold text-[#032a72]">{log.action}</td><td className="p-3">{log.targetType}{log.targetId ? ` · ${log.targetId}` : ""}</td><td className="max-w-xs p-3 text-[#52627d]">{log.detail || "—"}</td><td className="p-3 text-[#667085]">{log.ipAddress || "—"}</td></tr>)}</tbody></table></div></div>;
}
