import { Suspense } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return <AuthShell title="登录 Medbot AI 社区" description="网站内容仅向完成企业邮箱验证的公司员工开放。" footer={<>还没有账号？ <Link className="font-bold text-[#032a72] hover:underline" href="/register">使用企业邮箱注册</Link></>}>
    <Suspense fallback={<p className="text-sm text-[#667085]">加载中…</p>}><LoginForm /></Suspense>
  </AuthShell>;
}
