import Link from "next/link";
import { requireUser } from "@/lib/auth";
import PasswordForm from "./PasswordForm";

export default async function AccountPage() {
  const user = await requireUser();
  return <div className="mx-auto w-full max-w-lg space-y-5 px-5 py-10"><h1 className="text-2xl font-bold">我的账号</h1>
    <p>{user.name} · {user.department}<br/>{user.email}</p>
    {user.role === "admin" && <Link className="block font-bold text-[#032a72]" href="/admin/users">审批注册申请与重置员工密码 →</Link>}
    <h2 className="text-lg font-bold">修改密码</h2><p className="text-sm text-slate-600">你可以继续使用初始密码。设置个人密码后，可直接用企业账号在新设备登录。</p><PasswordForm/>
  </div>;
}
