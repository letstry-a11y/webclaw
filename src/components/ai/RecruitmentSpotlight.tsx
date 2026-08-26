import Link from "next/link";
import { ArrowRight, CircleDollarSign, Clock3, Handshake, Users } from "lucide-react";
import { formatProjectDate } from "@/lib/ai-project-workflow";
import type { ActiveRecruitment } from "@/lib/ai-recruitment";

function RecruitmentCard({ recruitment, featured = false }: { recruitment: ActiveRecruitment; featured?: boolean }) {
  const coverImage = recruitment.activityPost?.coverImage;
  return (
    <Link
      href={`/ai-requests/${recruitment.id}`}
      className={`group relative flex overflow-hidden bg-[#032a72] text-white ${featured ? "min-h-[360px]" : "min-h-[210px]"}`}
    >
      {coverImage ? (
        <img src={coverImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(72,112,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(72,112,255,0.22)_1px,transparent_1px)] [background-size:38px_38px]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#01183f] via-[#032a72]/75 to-[#032a72]/25" />
      <div className={`relative mt-auto w-full ${featured ? "p-6 sm:p-8" : "p-5"}`}>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
          <span className="bg-[#4870ff] px-2.5 py-1">正在招募</span>
          <span className="border border-white/25 bg-[#01183f]/55 px-2.5 py-1">{recruitment.projectLevel ? `${recruitment.projectLevel} 级项目` : "AI 项目"}</span>
        </div>
        <h3 className={`mt-3 font-black leading-tight tracking-[-0.025em] ${featured ? "text-2xl sm:text-4xl" : "text-xl"}`}>{recruitment.title}</h3>
        {featured && <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-white/72">{recruitment.recruitmentRoles}</p>}
        <dl className={`mt-5 grid gap-2 text-xs text-white/78 ${featured ? "sm:grid-cols-3" : "grid-cols-2"}`}>
          <div className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[#9eb3ff]" /><dt className="sr-only">报名截止</dt><dd>截止 {formatProjectDate(recruitment.recruitmentDeadline)}</dd></div>
          <div className="flex items-center gap-1.5"><CircleDollarSign className="h-3.5 w-3.5 text-[#9eb3ff]" /><dt className="sr-only">基础积分</dt><dd>{recruitment.basePointPool?.toLocaleString("zh-CN") ?? "待定"} 积分</dd></div>
          <div className={`flex items-center gap-1.5 ${featured ? "" : "col-span-2"}`}><Handshake className="h-3.5 w-3.5 text-[#9eb3ff]" /><dt className="sr-only">AI发展委员会协助人</dt><dd>协助人：{recruitment.committeeAssistant || "待指定"}</dd></div>
        </dl>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-black text-white group-hover:text-[#b8c6ff]">查看需求并报名 <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

export default function RecruitmentSpotlight({ recruitments, compact = false }: { recruitments: ActiveRecruitment[]; compact?: boolean }) {
  if (recruitments.length === 0) return null;
  return (
    <section className={compact ? "" : "border-b border-[#cbd5e6] bg-[#eef3fb] py-9 sm:py-11"} aria-label="AI 项目正在招募">
      <div className={compact ? "" : "mx-auto max-w-7xl px-4 sm:px-6"}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-[#032a72]"><Users className="h-4 w-4" /> NOW RECRUITING</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#111827] sm:text-4xl">AI 项目正在招募</h2>
            <p className="mt-2 text-sm text-[#52627d]">加入真实业务项目，协作交付成果并获得 AI 积分。</p>
          </div>
          <Link href="/ai-requests" className="inline-flex items-center gap-1 text-sm font-black text-[#032a72]">查看全部项目 <ArrowRight className="h-4 w-4 text-[#4870ff]" /></Link>
        </div>
        <div className={recruitments.length === 1 ? "grid" : "grid gap-3 lg:grid-cols-[1.65fr_0.85fr]"}>
          <RecruitmentCard recruitment={recruitments[0]} featured />
          {recruitments.length > 1 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{recruitments.slice(1, 3).map((recruitment) => <RecruitmentCard key={recruitment.id} recruitment={recruitment} />)}</div>}
        </div>
      </div>
    </section>
  );
}
