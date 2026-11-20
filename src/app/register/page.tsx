import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "./RegisterForm";
export default function RegisterPage() {
  return <AuthShell title="申请企业账号" description="请填写企业邮箱、姓名和部门，提交给管理员审批。" footer={<Link href="/login">返回登录</Link>}><RegisterForm /></AuthShell>;
}
