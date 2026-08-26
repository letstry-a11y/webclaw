import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#032a72] border-t border-white/15 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/brand/medbot-logo-white.png" alt="MEDBOT 微创机器人" width={108} height={30} className="h-[30px] w-auto" />
            <span className="text-sm text-white/70">开放的 AI 实践社区</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/70">
            <Link href="/ai-projects" className="hover:text-white transition-colors">AI 看板</Link>
            <Link href="/ai" className="hover:text-white transition-colors">AI</Link>
            <Link href="/robots" className="hover:text-white transition-colors">机器人</Link>
            <Link href="/success-stories" className="hover:text-white transition-colors">成果案例</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
