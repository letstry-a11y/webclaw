import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, CalendarDays, Medal, PenSquare, Sparkles } from "lucide-react";
import type { Post } from "@prisma/client";
import RecruitmentSpotlight from "@/components/ai/RecruitmentSpotlight";
import { getActiveRecruitments } from "@/lib/ai-recruitment";

export const dynamic = "force-dynamic";

type HomePost = Post;

const categoryNames: Record<string, string> = {
  general: "社区动态", tech: "技术实践", share: "经验分享",
  question: "问题讨论", resource: "资源推荐",
  "success-stories": "成果案例",
};

function postHref(post: HomePost) {
  return post.type === "activity" ? `/activities/${post.slug}` : `/posts/${post.slug}`;
}

function postCategory(post: HomePost) {
  return post.type === "activity" ? "社区活动" : (categoryNames[post.category] ?? "技术文章");
}

function TechVisual({ post, compact = false }: { post: HomePost; compact?: boolean }) {
  if (post.coverImage) {
    return <img src={post.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />;
  }
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#032a72]" aria-hidden="true">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(72,112,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(72,112,255,0.2)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[38px] border-[#4870ff]/30 shadow-[0_0_80px_rgba(72,112,255,0.35)]" />
      <div className="absolute bottom-8 right-8 flex items-end gap-2 opacity-80">
        {[38, 58, 84, 48, 72].map((height, index) => <span key={index} className="w-2 bg-[#4870ff]" style={{ height: compact ? height / 2 : height }} />)}
      </div>
      <div className="absolute left-6 top-6 font-mono text-[10px] tracking-[0.28em] text-[#9eb3ff]">MEDBOT / SIGNAL</div>
    </div>
  );
}

function FeatureCard({ post, size = "small" }: { post: HomePost; size?: "large" | "small" }) {
  return (
    <Link href={postHref(post)} className={`group relative block overflow-hidden bg-[#032a72] ${size === "large" ? "min-h-[360px] lg:min-h-[500px]" : "min-h-[240px]"}`}>
      <TechVisual post={post} compact={size === "small"} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#01183f] via-[#01183f]/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <span className="mb-3 inline-flex bg-[#4870ff] px-2.5 py-1 text-[11px] font-black text-white">{postCategory(post)}</span>
        <h3 className={`${size === "large" ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"} max-w-4xl font-black leading-tight tracking-[-0.025em] text-white`}>{post.title}</h3>
        {size === "large" && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 line-clamp-2">{post.excerpt}</p>}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-[#b8c6ff]">阅读更多 <ArrowRight className="h-4 w-4" /></span>
      </div>
    </Link>
  );
}

function AiPointsLeaderboardCard({ members }: { members: Array<{ id: string; name: string; level: string; historicalPoints: number }> }) {
  return (
    <div className="relative flex min-h-[240px] flex-col overflow-hidden bg-[#032a72] p-5 sm:p-6">
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(72,112,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(72,112,255,0.2)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="relative flex items-start justify-between gap-3">
        <div><span className="inline-flex bg-[#4870ff] px-2.5 py-1 text-[10px] font-black text-white">公开透明</span><h2 className="mt-3 text-xl font-black text-white sm:text-2xl">AI 积分排名榜</h2></div>
        <Medal className="h-7 w-7 text-[#9eb3ff]" />
      </div>

      <div className="relative mt-4 flex-1">
        {members.length > 0 ? (
          <ol className="space-y-2">
            {members.map((member, index) => (
              <li key={member.id} className="grid grid-cols-[26px_1fr_auto] items-center gap-2 text-xs text-white">
                <span className="font-mono font-black text-[#9eb3ff]">{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0 truncate font-bold">{member.name} <small className="ml-1 font-medium text-white/55">{member.level}</small></span>
                <strong>{new Intl.NumberFormat("zh-CN").format(member.historicalPoints)} 分</strong>
              </li>
            ))}
          </ol>
        ) : (
          <div className="border-l-2 border-[#4870ff] pl-3"><p className="text-sm font-bold text-white">积分数据待AI发展委员会公示</p><p className="mt-1 text-xs leading-5 text-white/55">首批名单确认后，将按历史累计积分公开排名。</p></div>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3">
        <span className="text-[10px] text-white/55">历史积分用于排名与等级 · 可用积分 1:1 兑换</span>
        <Link href="/ai-points" className="inline-flex items-center gap-1 text-xs font-black text-white hover:text-[#b8c6ff]">查看榜单 <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}

function NewsCard({ post, large = false }: { post: HomePost; large?: boolean }) {
  return (
    <Link href={postHref(post)} className={`group relative block overflow-hidden bg-[#032a72] ${large ? "min-h-[430px] lg:min-h-[520px]" : "min-h-[250px]"}`}>
      <TechVisual post={post} compact={!large} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#01183f] via-[#01183f]/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <span className="text-[11px] font-black uppercase tracking-[0.13em] text-[#b8c6ff]">{postCategory(post)}</span>
        <h3 className={`mt-2 font-black leading-tight tracking-[-0.02em] text-white ${large ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"}`}>{post.title}</h3>
        {large && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 line-clamp-2">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

function SectionHeader({ title, href, linkText }: { title: string; href: string; linkText: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 border-b-2 border-black pb-3">
      <h2 className="text-3xl font-black tracking-[-0.03em] text-black sm:text-4xl">{title}</h2>
      <Link href={href} className="mb-1 inline-flex items-center gap-1 text-sm font-bold text-black hover:text-[#032a72]">{linkText}<ArrowRight className="h-4 w-4 text-[#4870ff]" /></Link>
    </div>
  );
}

export default async function HomePage() {
  const [policyPost, featuredPosts, recentStories, latestPosts, activities, topPointMembers, activeRecruitments] = await Promise.all([
    prisma.post.findUnique({ where: { slug: "ai-application-project-incentive-policy", isPublished: true } }),
    prisma.post.findMany({
      where: { isPublished: true, OR: [{ isPinned: true }, { isFeatured: true }] },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 3,
    }),
    prisma.post.findMany({
      where: { isPublished: true, type: "blog", category: "success-stories" },
      orderBy: { createdAt: "desc" }, take: 3,
    }),
    prisma.post.findMany({
      where: { isPublished: true, type: "blog", category: { not: "success-stories" } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 6,
    }),
    prisma.post.findMany({
      where: { isPublished: true, type: "activity" },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 8,
    }),
    prisma.aiPointMember.findMany({
      orderBy: [{ historicalPoints: "desc" }, { updatedAt: "asc" }],
      take: 3,
      select: { id: true, name: true, level: true, historicalPoints: true },
    }),
    getActiveRecruitments(3),
  ]);

  const activeRecruitmentPostIds = new Set(activeRecruitments.map((request) => request.activityPostId).filter(Boolean));
  const otherActivities = activities.filter((post) => !activeRecruitmentPostIds.has(post.id));
  const featuredWithoutRecruitment = featuredPosts.filter((post) => !activeRecruitmentPostIds.has(post.id));
  const fallbackPosts = [...latestPosts, ...otherActivities];
  const spotlightSeed = policyPost ? [policyPost, ...featuredWithoutRecruitment.filter((post) => post.id !== policyPost.id)] : featuredWithoutRecruitment;
  const spotlight = [...spotlightSeed, ...fallbackPosts.filter((post) => !spotlightSeed.some((featured) => featured.id === post.id))].slice(0, 3);
  const primaryPosts = latestPosts.length > 0 ? latestPosts : spotlight;
  const storyGridClass = recentStories.length === 1
    ? "grid gap-6"
    : recentStories.length === 2
      ? "grid gap-6 md:grid-cols-2"
      : "grid gap-6 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="min-h-full bg-white text-black">
      {policyPost && (
        <Link href={`/posts/${policyPost.slug}`} className="group flex items-center justify-center gap-3 bg-[#4870ff] px-4 py-3 text-center text-sm font-black text-white hover:bg-[#5b80ff]">
          <span className="bg-[#032a72] px-2 py-1 text-[10px] tracking-[0.14em] text-white">重要公告</span>
          <span>AI 应用项目激励办法正式发布</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
      <RecruitmentSpotlight recruitments={activeRecruitments} />
      {spotlight.length > 0 && (
        <section className="grid border-b border-[#032a72] bg-[#032a72] md:grid-cols-3" aria-label="焦点内容">
          <div className="md:col-span-2 md:border-r md:border-white/20"><FeatureCard post={spotlight[0]} size="large" /></div>
          <div className="grid grid-rows-2">
            {spotlight.slice(1, 2).map((post) => <div key={post.id}><FeatureCard post={post} /></div>)}
            <div className="border-t border-white/20"><AiPointsLeaderboardCard members={topPointMembers} /></div>
          </div>
        </section>
      )}

      <nav className="border-b border-[#032a72] bg-[#032a72]" aria-label="内容分类">
        <div className="mx-auto flex max-w-7xl items-center gap-7 overflow-x-auto px-4 sm:px-6">
          <Link href="/" className="shrink-0 border-b-[3px] border-[#4870ff] py-4 text-sm font-black text-white">首页</Link>
          <Link href="/ai-projects" className="shrink-0 py-4 text-sm font-bold text-white/80 hover:text-white">AI 看板</Link>
          <Link href="/ai" className="shrink-0 py-4 text-sm font-bold text-white/80 hover:text-white">AI</Link>
          <Link href="/robots" className="shrink-0 py-4 text-sm font-bold text-white/80 hover:text-white">机器人</Link>
          <Link href="/success-stories" className="shrink-0 py-4 text-sm font-bold text-white/80 hover:text-white">成果案例</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {recentStories.length > 0 && (
          <section className="mb-16" aria-label="近期成果案例">
            <SectionHeader title="近期成果案例" href="/success-stories" linkText="更多案例" />
            <div className={storyGridClass}>
              {recentStories.map((post) => <NewsCard key={post.id} post={post} />)}
            </div>
          </section>
        )}

        {primaryPosts.length > 0 && (
          <section className="mb-16">
            <SectionHeader title="技术与实践" href="/posts" linkText="更多文章" />
            <div className="grid gap-6 lg:grid-cols-[1.75fr_0.85fr]">
              <NewsCard post={primaryPosts[0]} large />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                {primaryPosts.slice(1, 3).map((post) => <NewsCard key={post.id} post={post} />)}
              </div>
            </div>
          </section>
        )}

        {otherActivities.length > 0 && (
          <section className="mb-16">
            <SectionHeader title="社区活动" href="/activities" linkText="更多活动" />
            <div className="grid gap-6 lg:grid-cols-[1.75fr_0.85fr]">
              <NewsCard post={otherActivities[0]} large />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                {otherActivities.slice(1, 3).map((post) => <NewsCard key={post.id} post={post} />)}
                <Link href="/activities" className="group flex min-h-[180px] flex-col justify-between border border-[#d6deed] bg-[#f3f6fb] p-6 hover:border-[#4870ff]">
                  <CalendarDays className="h-7 w-7 text-[#032a72]" />
                  <div><p className="text-xl font-black">发现更多社区活动</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#032a72]">查看活动日历 <ArrowRight className="h-4 w-4" /></span></div>
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="grid overflow-hidden border border-[#032a72] bg-[#032a72] text-white lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="p-7 sm:p-10">
            <div className="mb-3 flex items-center gap-2 text-xs font-mono tracking-[0.18em] text-[#b8c6ff]"><Sparkles className="h-4 w-4" /> OPEN COMMUNITY</div>
            <h2 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl">分享你的 AI 实践与真实经验</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">让有价值的探索被看见，也让团队中的每一次尝试成为下一次创新的起点。</p>
          </div>
          <Link href="/posts/new" className="m-7 mt-0 inline-flex items-center justify-center gap-2 bg-[#4870ff] px-7 py-4 text-sm font-black text-white hover:bg-[#5b80ff] lg:m-10"><PenSquare className="h-4 w-4" /> 发布文章</Link>
        </section>
      </div>
    </div>
  );
}
