import Link from "next/link";
import type { Post } from "@prisma/client";
import { ArrowRight, Bot, Cpu, Sparkles, Trophy } from "lucide-react";

type TopicKind = "ai" | "robots" | "stories";

const topicMeta = {
  ai: { eyebrow: "ARTIFICIAL INTELLIGENCE", icon: Cpu },
  robots: { eyebrow: "INTELLIGENT ROBOTICS", icon: Bot },
  stories: { eyebrow: "MEDBOT SUCCESS STORIES", icon: Trophy },
} satisfies Record<TopicKind, { eyebrow: string; icon: typeof Cpu }>;

function href(post: Post) {
  return post.type === "activity" ? `/activities/${post.slug}` : `/posts/${post.slug}`;
}

function Visual({ post, variant }: { post: Post; variant: number }) {
  if (post.coverImage) {
    return <img src={post.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0c100c]" aria-hidden="true">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(118,185,0,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(118,185,0,0.13)_1px,transparent_1px)] [background-size:38px_38px]" />
      <div className={`absolute rounded-full border-[32px] border-[#76b900]/25 shadow-[0_0_90px_rgba(118,185,0,0.2)] ${variant % 2 === 0 ? "-right-10 -top-12 h-56 w-56" : "-bottom-16 -left-12 h-64 w-64"}`} />
      <div className="absolute right-7 top-7 font-mono text-[10px] tracking-[0.28em] text-[#9bd63c]">0{variant + 1} / MEDBOT</div>
    </div>
  );
}

function TopicCard({ post, large = false, variant = 0 }: { post: Post; large?: boolean; variant?: number }) {
  return (
    <Link href={href(post)} className={`group relative block overflow-hidden bg-black ${large ? "min-h-[430px] lg:min-h-[540px]" : "min-h-[255px]"}`}>
      <Visual post={post} variant={variant} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <span className="inline-flex bg-[#76b900] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-black">{post.category || "MEDBOT"}</span>
        <h2 className={`mt-3 font-black leading-tight tracking-[-0.025em] text-white ${large ? "text-2xl sm:text-4xl" : "text-xl sm:text-2xl"}`}>{post.title}</h2>
        {large && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 line-clamp-2">{post.excerpt}</p>}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-white group-hover:text-[#9bd63c]">阅读更多 <ArrowRight className="h-4 w-4" /></span>
      </div>
    </Link>
  );
}

export default function TopicLanding({ title, description, kind, posts }: { title: string; description: string; kind: TopicKind; posts: Post[] }) {
  const meta = topicMeta[kind];
  const Icon = meta.icon;

  return (
    <div className="min-h-full bg-white text-black">
      <section className="border-b border-[#dfe3dc] bg-[#f5f7f3]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-[#416700]"><Icon className="h-4 w-4" /> {meta.eyebrow}</div>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-black sm:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4e544c] sm:text-base">{description}</p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-end justify-between border-b-2 border-black pb-3">
          <h2 className="text-2xl font-black sm:text-3xl">最新内容</h2>
          <span className="mb-1 flex items-center gap-2 text-xs font-bold text-[#416700]"><Sparkles className="h-4 w-4" /> 持续更新</span>
        </div>

        {posts.length > 0 ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[1.75fr_0.85fr]" aria-label={`${title}精选内容`}>
              <TopicCard post={posts[0]} large />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
                {posts.slice(1, 3).map((post, index) => <TopicCard key={post.id} post={post} variant={index + 1} />)}
              </div>
            </section>

            {posts.length > 3 && (
              <section className="mt-10 grid gap-x-8 gap-y-0 border-t border-[#dfe3dc] md:grid-cols-2">
                {posts.slice(3).map((post) => (
                  <Link key={post.id} href={href(post)} className="group flex items-start justify-between gap-5 border-b border-[#dfe3dc] py-6">
                    <div><p className="text-xs font-bold text-[#416700]">{post.category}</p><h3 className="mt-2 text-xl font-black leading-snug group-hover:text-[#416700]">{post.title}</h3><p className="mt-2 text-sm text-[#60665d] line-clamp-2">{post.excerpt}</p></div>
                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#76b900]" />
                  </Link>
                ))}
              </section>
            )}
          </>
        ) : (
          <div className="border border-dashed border-[#cfd4cc] bg-[#fafbf9] py-20 text-center">
            <Icon className="mx-auto h-9 w-9 text-[#76b900]" />
            <h2 className="mt-4 text-xl font-black text-black">内容待添加</h2>
            <p className="mt-2 text-sm text-[#60665d]">该栏目目前为空，后续添加的内容将在这里展示。</p>
          </div>
        )}
      </main>
    </div>
  );
}
