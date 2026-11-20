import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UserActions from "./UserActions";

export default async function AccountsPage() {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return <p>仅管理员可查看账号申请。</p>;
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, department: true, status: true, sessionVersion: true },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }] });
  return <div className="space-y-6"><h1 className="text-2xl font-bold">企业账号审批</h1>
    <p className="text-sm text-slate-600">请通过公司通讯录核对申请人身份。批准或重置后，将个人激活链接私下发给该员工。</p>
    {([["pending","待审批"],["approved","已开通"],["rejected","已驳回"]] as const).map(([status,label]) => {
      const group = users.filter(user => user.status === status);
      return <section key={status} className="border border-slate-200 bg-white p-4"><h2 className="text-lg font-bold">{label}（{group.length}）</h2>
        <ul className="divide-y divide-slate-200">{group.map(user => <li className="py-3" key={user.id}><strong>{user.name}</strong> · {user.department}
          <p className="mb-2 text-sm text-slate-600">{user.email}</p>
          {user.id !== admin.id && status !== "rejected" && <UserActions id={user.id} email={user.email} status={status} version={user.sessionVersion}/>}
        </li>)}</ul>
      </section>;
    })}</div>;
}
