import Image from "next/image";
import Link from "next/link";

export default function AuthShell({ title, description, children, footer }: {
  title: string; description: string; children: React.ReactNode; footer: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#032a72] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center"><Image src="/brand/medbot-logo-white.png" alt="MEDBOT 微创机器人" width={203} height={56} priority className="mx-auto h-12 w-auto" /></div>
        <section className="border border-white/15 bg-white p-7 shadow-2xl sm:p-9">
          <h1 className="text-2xl font-black text-[#111827]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#667085]">{description}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 border-t border-[#e5eaf2] pt-5 text-center text-sm text-[#667085]">{footer}</div>
        </section>
        <p className="mt-5 text-center text-xs text-white/55">仅供公司员工使用，请妥善保管账号与项目资料</p>
      </div>
    </main>
  );
}

export const authInputClass = "w-full border border-[#cbd5e6] bg-white px-3.5 py-3 text-sm text-[#111827] outline-none focus:border-[#4870ff] focus:ring-1 focus:ring-[#4870ff]";
export const authButtonClass = "w-full bg-[#4870ff] px-4 py-3 text-sm font-bold text-white hover:bg-[#365be0] disabled:cursor-not-allowed disabled:opacity-50";
export const AuthLink = Link;
