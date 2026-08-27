import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

async function updateUser(userId: string, formData: FormData) {
  "use server";
  if (!(await isAdmin())) throw new Error("没有管理员权限");
  const data = z.object({ role: z.enum(["employee", "committee", "admin"]), isActive: z.enum(["true", "false"]) }).parse(Object.fromEntries(formData));
  const target = await prisma.user.update({ where: { id: userId }, data: {
    role: data.role, isActive: data.isActive === "true", sessionVersion: { increment: 1 },
  } });
  const actor = await getCurrentUser();
  if (actor) await writeAuditLog(actor, "更新账号权限", { targetType: "User", targetId: userId, detail: `${target.role}/${target.isActive ? "启用" : "停用"}` });
  revalidatePath("/admin/users");
}

export default async function UsersAdminPage() {
  if (!(await isAdmin())) throw new Error("没有管理员权限");
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return <div><div className="mb-6"><h1 className="text-2xl font-black">企业账号与角色</h1><p className="mt-2 text-sm text-[#667085]">注册账号默认是普通员工；仅在这里授予AI发展委员会或管理员权限。</p></div><div className="overflow-x-auto border border-[#d8e0ee] bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f7f9fc] text-xs text-[#52627d]"><tr><th className="p-3">员工</th><th className="p-3">部门</th><th className="p-3">注册时间</th><th className="p-3">角色与状态</th></tr></thead><tbody className="divide-y divide-[#e2e8f2]">{users.map((user) => <tr key={user.id}><td className="p-3"><strong>{user.name}</strong><span className="mt-1 block text-xs text-[#667085]">{user.email}</span></td><td className="p-3">{user.department}</td><td className="p-3 text-xs text-[#667085]">{new Intl.DateTimeFormat("zh-CN").format(user.createdAt)}</td><td className="p-3"><form action={updateUser.bind(null, user.id)} className="flex gap-2"><select name="role" defaultValue={user.role} className="border border-[#cbd5e6] px-2 py-2"><option value="employee">普通员工</option><option value="committee">AI发展委员会</option><option value="admin">管理员</option></select><select name="isActive" defaultValue={String(user.isActive)} className="border border-[#cbd5e6] px-2 py-2"><option value="true">启用</option><option value="false">停用</option></select><button className="bg-[#032a72] px-3 py-2 font-bold text-white">保存</button></form></td></tr>)}</tbody></table></div></div>;
}
