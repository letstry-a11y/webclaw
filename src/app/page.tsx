import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, CalendarDays, PenSquare, Sparkles } from "lucide-react";
import type { Post } from "@prisma/client";

export const dynamic = "force-dynamic";

type HomePost = Post;

const categoryNames: Record<string, string> = {
  general: "社区动态", tech: "技术实践", share: "经验分享",
  question: "问题讨论", resource: "资源推荐",
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
    <div className="absolute inset-0 overflow-hidden bg-[#101410]" aria-hidden="true">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(118,185,0,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(118,185,0,0.14)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[38px] border-[#76b900]/25 shadow-[0_0_80px_rgba(118,185,0,0.3)]" />
      <div className="absolute bottom-8 right-8 flex items-end gap-2 opacity-80">
        {[38, 58, 84, 48, 72].map((height, index) => <span key={index} className="w-2 bg-[#76b900]" style={{ height: compact ? height / 2 : height }} />)}
      </div>
      <div className="absolute left-6 top-6 font-mono text-[10px] tracking-[0.28em] text-[#9bd63c]">MEDBOT / SIGNAL</div>
    </div>
  );
}

function FeatureCard({ post, size = "small" }: { post: HomePost; size?: "large" | "small" }) {
  return (
    <Link href={postHref(post)} className={`group relative block overflow-hidden bg-[#101410] ${size === "large" ? "min-h-[360px] lg:min-h-[500px]" : "min-h-[240px]"}`}>
      <TechVisual post={post} compact={size === "small"} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <span className="mb-3 inline-flex bg-[#76b900] px-2.5 py-1 text-[11px] font-black text-black">{postCategory(post)}</span>
        <h3 className={`${size === "large" ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"} max-w-4xl font-black leading-tight tracking-[-0.025em] text-white`}>{post.title}</h3>
        {size === "large" && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 line-clamp-2">{post.excerpt}</p>}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-[#9bd63c]">阅读更多 <ArrowRight className="h-4 w-4" /></span>
      </div>
    </Link>
  );
}

function NewsCard({ post, large = false }: { post: HomePost; large?: boolean }) {
  return (
    <Link href={postHref(post)} className={`group relative block overflow-hidden bg-[#101410] ${large ? "min-h-[430px] lg:min-h-[520px]" : "min-h-[250px]"}`}>
      <TechVisual post={post} compact={!large} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <span className="text-[11px] font-black uppercase tracking-[0.13em] text-[#9bd63c]">{postCategory(post)}</span>
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
      <Link href={href} className="mb-1 inline-flex items-center gap-1 text-sm font-bold text-black hover:text-[#416700]">{linkText}<ArrowRight className="h-4 w-4 text-[#76b900]" /></Link>
    </div>
  );
}

export default async function HomePage() {
  const [policyPost, featuredPosts, latestPosts, activities] = await Promise.all([
    prisma.post.findUnique({ where: { slug: "ai-application-project-incentive-policy", isPublished: true } }),
    prisma.post.findMany({
      where: { isPublished: true, OR: [{ isPinned: true }, { isFeatured: true }] },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 3,
    }),
    prisma.post.findMany({
      where: { isPublished: true, type: "blog" },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }], take: 6,
    }),
    prisma.post.findMany({
      where: { isPublished: true, type: "activity" },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 3,
    }),
  ]);

  const fallbackPosts = [...latestPosts, ...activities];
  const spotlightSeed = policyPost ? [policyPost, ...featuredPosts.filter((post) => post.id !== policyPost.id)] : featuredPosts;
  const spotlight = [...spotlightSeed, ...fallbackPosts.filter((post) => !spotlightSeed.some((featured) => featured.id === post.id))].slice(0, 3);
  const primaryPosts = latestPosts.length > 0 ? latestPosts : spotlight;

  return (
    <div className="min-h-full bg-white text-black">
      {policyPost && (
        <Link href={`/posts/${policyPost.slug}`} className="group flex items-center justify-center gap-3 bg-[#76b900] px-4 py-3 text-center text-sm font-black text-black hover:bg-[#8bd000]">
          <span className="bg-black px-2 py-1 text-[10px] tracking-[0.14em] text-white">重要公告</span>
          <span>AI 应用项目激励办法正式发布</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
      {spotlight.length > 0 && (
        <section className="grid border-b border-black bg-black md:grid-cols-3" aria-label="焦点内容">
          <div className="md:col-span-2 md:border-r md:border-white/20"><FeatureCard post={spotlight[0]} size="large" /></div>
          <div className="grid grid-rows-2">
            {spotlight.slice(1, 3).map((post) => <div key={post.id} className="border-t border-white/20 first:border-t-0 md:first:border-t-0"><FeatureCard post={post} /></div>)}
          </div>
        </section>
      )}

      <nav className="border-b border-black bg-[#181a18]" aria-label="内容分类">
        <div className="mx-auto flex max-w-7xl items-center gap-7 overflow-x-auto px-4 sm:px-6">
          <Link href="/" className="shrink-0 border-b-[3px] border-[#76b900] py-4 text-sm font-black text-white">首页</Link>
          <Link href="/ai-projects" className="shrink-0 py-4 text-sm font-bold text-white/80 hover:text-white">AI 看板</Link>
          <Link href="/ai" className="shrink-0 py-4 text-sm font-bold text-white/80 hover:text-white">AI</Link>
          <Link href="/robots" className="shrink-0 py-4 text-sm font-bold text-white/80 hover:text-white">机器人</Link>
          <Link href="/success-stories" className="shrink-0 py-4 text-sm font-bold text-white/80 hover:text-white">成果案例</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
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

        {activities.length > 0 && (
          <section className="mb-16">
            <SectionHeader title="社区活动" href="/activities" linkText="更多活动" />
            <div className="grid gap-6 lg:grid-cols-[1.75fr_0.85fr]">
              <NewsCard post={activities[0]} large />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                {activities.slice(1, 3).map((post) => <NewsCard key={post.id} post={post} />)}
                <Link href="/activities" className="group flex min-h-[180px] flex-col justify-between border border-[#d9ddd6] bg-[#f4f6f2] p-6 hover:border-[#76b900]">
                  <CalendarDays className="h-7 w-7 text-[#416700]" />
                  <div><p className="text-xl font-black">发现更多社区活动</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#416700]">查看活动日历 <ArrowRight className="h-4 w-4" /></span></div>
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="grid overflow-hidden border border-black bg-black text-white lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="p-7 sm:p-10">
            <div className="mb-3 flex items-center gap-2 text-xs font-mono tracking-[0.18em] text-[#9bd63c]"><Sparkles className="h-4 w-4" /> OPEN COMMUNITY</div>
            <h2 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl">分享你的 AI 实践与真实经验</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">让有价值的探索被看见，也让团队中的每一次尝试成为下一次创新的起点。</p>
          </div>
          <Link href="/posts/new" className="m-7 mt-0 inline-flex items-center justify-center gap-2 bg-[#76b900] px-7 py-4 text-sm font-black text-black hover:bg-[#8bd000] lg:m-10"><PenSquare className="h-4 w-4" /> 发布文章</Link>
        </section>
      </div>
    </div>
  );
}
