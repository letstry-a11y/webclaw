import type { Metadata } from "next";
import localFont from "next/font/local";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
  description: "一个开放透明的 AI 实践社区，人人都可以自由撰写和分享",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={sourceHanSans.variable}>
      <body className="min-h-screen flex flex-col bg-bg text-text-primary antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
