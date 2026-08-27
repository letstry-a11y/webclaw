import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import RegisterForm from "./RegisterForm";
export default function RegisterPage() { return <AuthShell title="注册企业账号" description="仅限 @microport.com 企业邮箱；邮箱验证成功后立即开通。" footer={<>已有账号？ <Link className="font-bold text-[#032a72] hover:underline" href="/login">返回登录</Link></>}><RegisterForm /></AuthShell>; }
