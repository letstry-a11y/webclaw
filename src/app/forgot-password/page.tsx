import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "./ResetPasswordForm";
export default function ForgotPasswordPage() { return <AuthShell title="重置密码" description="验证码将发送到已注册的企业邮箱。" footer={<Link className="font-bold text-[#032a72] hover:underline" href="/login">返回登录</Link>}><ResetPasswordForm /></AuthShell>; }
