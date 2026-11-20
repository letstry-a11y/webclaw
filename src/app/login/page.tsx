import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "./LoginForm";
export default function LoginPage() {
  return <AuthShell title="登录 Medbot AI 社区" description="已获管理员批准的公司员工可登录查看项目和社区内容。" footer={<Link href="/register">申请企业账号</Link>}><LoginForm /></AuthShell>;
}
