import type { Metadata } from "next";
import localFont from "next/font/local";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VisitTracker from "@/components/analytics/VisitTracker";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import "./globals.css";

const sourceHanSans = localFont({
  variable: "--font-source-han-sans",
  display: "swap",
  src: [
    { path: "./fonts/SourceHanSansCN-Normal.woff", weight: "400", style: "normal" },
    { path: "./fonts/SourceHanSansCN-Bold.woff", weight: "700 900", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: "Medbot - 开放的 AI 实践社区",
  description: "面向公司员工开放的 AI 实践、项目招募与成果社区",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const authenticated = Boolean(user) || await isAdmin();
  return (
    <html lang="zh-CN" className={sourceHanSans.variable}>
      <body className="min-h-screen flex flex-col bg-bg text-text-primary antialiased">
        {authenticated && <VisitTracker />}
        {authenticated && <Navbar user={user ? { name: user.name, role: user.role } : { name: "系统管理员", role: "admin" }} />}
        <main className="flex-1">{children}</main>
        {authenticated && <Footer />}
      </body>
    </html>
  );
}
