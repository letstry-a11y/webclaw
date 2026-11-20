import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
export default function ForgotPasswordPage() {
  return <AuthShell title="重置密码" description="请通过公司内部渠道联系 Medbot 管理员。管理员核对身份并重置后，会向你提供新的个人激活链接和初始密码。" footer={<Link href="/login">返回登录</Link>} />;
}
