import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed categories
  const categories = [
    { name: "综合", slug: "general", icon: "📋", order: 0 },
    { name: "技术", slug: "tech", icon: "💻", order: 1 },
    { name: "设计", slug: "design", icon: "🎨", order: 2 },
    { name: "生活", slug: "life", icon: "🌱", order: 3 },
    { name: "随笔", slug: "essay", icon: "✍️", order: 4 },
    { name: "教程", slug: "tutorial", icon: "📖", order: 5 },
    { name: "分享", slug: "share", icon: "🔗", order: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // Seed sample posts
  const posts = [
    {
      title: "欢迎来到 Medbot 社区",
      slug: "welcome-to-webclaw",
      content: "<h2>欢迎！</h2><p>Medbot 是一个开放的 AI 实践社区。在这里，你可以自由地分享想法、技术心得与真实应用经验。</p><p>无需注册，即刻开始写作。让我们一起构建一个开放、包容的知识分享平台。</p><h3>特色功能</h3><ul><li>匿名发布，无需注册</li><li>支持富文本编辑器</li><li>点赞和评论互动</li><li>活动发起与参与</li></ul>",
      excerpt: "Medbot 是一个开放的 AI 实践社区，在这里自由分享想法、技术心得与真实应用经验。",
      category: "general",
      tags: "公告,社区",
      authorName: "Medbot 团队",
      isPinned: true,
      isFeatured: true,
    },
    {
      title: "Next.js App Router 实战指南",
      slug: "nextjs-app-router-guide",
      content: "<h2>什么是 App Router？</h2><p>Next.js 13+ 引入了全新的 App Router，基于 React Server Components 构建，提供了更好的性能和开发体验。</p><h3>核心概念</h3><p>App Router 使用文件系统路由，每个文件夹代表一个路由段。通过 <code>page.tsx</code> 定义页面，通过 <code>layout.tsx</code> 定义布局。</p><h3>Server Components</h3><p>默认情况下，App Router 中的组件都是 Server Components，可以直接在组件中访问数据库、读取文件等。</p>",
      excerpt: "Next.js 13+ 引入了全新的 App Router，基于 React Server Components 构建，提供了更好的性能和开发体验。",
      category: "tech",
      tags: "Next.js,React,前端",
      authorName: "前端爱好者",
    },
    {
      title: "如何用 Tailwind CSS 构建现代 UI",
      slug: "tailwind-css-modern-ui",
      content: "<h2>Tailwind CSS 简介</h2><p>Tailwind CSS 是一个功能类优先的 CSS 框架，让你可以快速构建自定义设计。</p><h3>为什么选择 Tailwind？</h3><ul><li>开发速度快</li><li>设计一致性好</li><li>打包体积小</li><li>响应式设计简单</li></ul><p>通过组合原子类，你可以创建任何你想要的设计，而无需离开 HTML。</p>",
      excerpt: "Tailwind CSS 是一个功能类优先的 CSS 框架，让你可以快速构建自定义设计。",
      category: "design",
      tags: "CSS,Tailwind,UI设计",
      authorName: "设计师小明",
    },
    {
      title: "程序员的周末：在咖啡馆写代码",
      slug: "programmer-weekend-coffee",
      content: "<p>周末的早晨，阳光透过咖啡馆的玻璃窗洒在键盘上。点一杯拿铁，打开笔记本，开始敲代码。</p><p>这可能是程序员最惬意的时光了。没有需求变更，没有代码审查，只有自己和代码之间的对话。</p><p>今天打算把那个一直想做的个人项目往前推进一下。用 Rust 重写那个 Python 脚本，看看性能能提升多少。</p>",
      excerpt: "周末的早晨，阳光透过咖啡馆的玻璃窗洒在键盘上。点一杯拿铁，打开笔记本，开始敲代码。",
      category: "life",
      tags: "生活,程序员,周末",
      authorName: "匿名用户",
    },
    {
      title: "SQLite 在生产环境中的应用",
      slug: "sqlite-in-production",
      content: "<h2>SQLite 不只是测试数据库</h2><p>很多人认为 SQLite 只适合开发和测试环境，但实际上，SQLite 在很多场景下都可以作为生产数据库使用。</p><h3>适用场景</h3><ul><li>个人项目和小型应用</li><li>嵌入式系统</li><li>边缘计算</li><li>读多写少的应用</li></ul><h3>性能数据</h3><p>在适当的配置下（WAL 模式、合理的缓存大小），SQLite 的读取性能可以达到每秒数万次查询。</p>",
      excerpt: "很多人认为 SQLite 只适合开发和测试环境，但实际上，SQLite 在很多场景下都可以作为生产数据库使用。",
      category: "tech",
      tags: "SQLite,数据库,后端",
      authorName: "数据库工程师",
    },
    {
      title: "2024 开源项目分享活动",
      slug: "2024-opensource-sharing",
      content: "<h2>活动介绍</h2><p>我们发起了一个开源项目分享活动！欢迎大家分享你正在参与或者关注的开源项目。</p><h3>参与方式</h3><ol><li>撰写一篇关于开源项目的博客</li><li>在标签中添加 \"开源分享\"</li><li>在评论区互相交流</li></ol><h3>活动时间</h3><p>即日起至本月底</p>",
      excerpt: "我们发起了一个开源项目分享活动！欢迎大家分享你正在参与或者关注的开源项目。",
      type: "activity",
      category: "share",
      tags: "活动,开源,分享",
      authorName: "Medbot 团队",
      isPinned: true,
    },
  ];

  for (const post of posts) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }

  // Seed AI initiative dashboard data
  const aiProjects = [
    {
      id: "ai-opportunity-search",
      name: "商机检索系统",
      subtitle: "高价值商机检索与 LinkedIn 自动触达",
      status: "delivered",
      order: 1,
      progress: "商机检索系统已完成交付",
      actions: [
        { task: "合并商机系统至现有 LinkedIn 操作系统，共用数据库，并自动联系检索出的高价值对象", owner: "曹起", dueDate: new Date("2026-08-25T00:00:00+08:00") },
      ],
    },
    {
      id: "ai-my-medbot",
      name: "My Medbot",
      subtitle: "医疗智能助手与销售出差信息协同",
      status: "launched",
      order: 2,
      progress: "已在 Apple Store 发布",
      actions: [
        { task: "销售出差信息记录系统的 UI 交互", owner: "徐鑫鑫", dueDate: new Date("2026-08-28T00:00:00+08:00") },
        { task: "语音识别与数据库推送钉钉，输出方案", owner: "王超", dueDate: new Date("2026-08-25T00:00:00+08:00") },
        { task: "商业化语音模型调研", owner: "明峰", dueDate: new Date("2026-08-28T00:00:00+08:00") },
        { task: "波兰 App 发布", owner: "林宇豪", dueDate: new Date("2026-08-28T00:00:00+08:00") },
      ],
    },
    {
      id: "ai-product-ordering",
      name: "产品配置与下单系统",
      subtitle: "产品配置、Agent 网络与下单链路建设",
      status: "evaluating",
      order: 3,
      progress: "预计 8.21 试用结束，进入问题评估阶段",
      actions: [
        { task: "评估试用问题，并给出解决方案", owner: "向婷婷", dueDate: new Date("2026-08-25T00:00:00+08:00") },
        { task: "规划 Agent 网络建设与服务器部署环境", owner: "于新航", dueDate: new Date("2026-08-28T00:00:00+08:00") },
      ],
    },
  ];

  for (const item of aiProjects) {
    const project = await prisma.aiProject.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        name: item.name,
        subtitle: item.subtitle,
        status: item.status,
        order: item.order,
      },
    });

    const [progressCount, actionCount] = await Promise.all([
      prisma.aiProjectProgress.count({ where: { projectId: project.id } }),
      prisma.aiActionItem.count({ where: { projectId: project.id } }),
    ]);

    if (progressCount === 0) {
      await prisma.aiProjectProgress.create({
        data: { projectId: project.id, content: item.progress },
      });
    }

    if (actionCount === 0) {
      await prisma.aiActionItem.createMany({
        data: item.actions.map((action) => ({ ...action, projectId: project.id })),
      });
    }
  }

  // Seed some comments
  const welcomePost = await prisma.post.findUnique({ where: { slug: "welcome-to-webclaw" } });
  if (welcomePost) {
    const existingComments = await prisma.comment.count({ where: { postId: welcomePost.id } });
    if (existingComments === 0) {
      await prisma.comment.create({
        data: {
          content: "社区做得很不错，支持匿名发帖这个想法很好！",
          authorName: "路过的网友",
          postId: welcomePost.id,
        },
      });
      await prisma.comment.create({
        data: {
          content: "期待看到更多有趣的内容！",
          authorName: "匿名用户",
          postId: welcomePost.id,
        },
      });
    }
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
