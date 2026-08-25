// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const replace = (value) => typeof value === "string" ? value.replace(/openclaw/gi, "Agent") : value;

const slugOverrides = new Map([
  ["openclaw养成记-使用经验分享大赛", "agent养成记-使用经验分享大赛"],
  ["openclaw探索小组报名", "agent探索小组报名"],
]);

async function main() {
  let updated = 0;

  const posts = await prisma.post.findMany();
  for (const post of posts) {
    const data = {
      title: replace(post.title),
      slug: slugOverrides.get(post.slug) ?? replace(post.slug),
      content: replace(post.content),
      excerpt: replace(post.excerpt),
      category: replace(post.category),
      tags: replace(post.tags),
      authorName: replace(post.authorName),
      attachments: replace(post.attachments),
      eventLocation: replace(post.eventLocation),
      eventLink: replace(post.eventLink),
    };
    if (Object.entries(data).some(([key, value]) => value !== post[key])) {
      await prisma.post.update({ where: { id: post.id }, data });
      updated += 1;
    }
  }

  const comments = await prisma.comment.findMany();
  for (const comment of comments) {
    const data = { content: replace(comment.content), authorName: replace(comment.authorName) };
    if (data.content !== comment.content || data.authorName !== comment.authorName) {
      await prisma.comment.update({ where: { id: comment.id }, data });
      updated += 1;
    }
  }

  const categories = await prisma.category.findMany();
  for (const category of categories) {
    const data = { name: replace(category.name), slug: replace(category.slug), icon: replace(category.icon) };
    if (data.name !== category.name || data.slug !== category.slug || data.icon !== category.icon) {
      await prisma.category.update({ where: { id: category.id }, data });
      updated += 1;
    }
  }

  const projects = await prisma.aiProject.findMany();
  for (const project of projects) {
    const data = { name: replace(project.name), subtitle: replace(project.subtitle), status: replace(project.status) };
    if (data.name !== project.name || data.subtitle !== project.subtitle || data.status !== project.status) {
      await prisma.aiProject.update({ where: { id: project.id }, data });
      updated += 1;
    }
  }

  const progressItems = await prisma.aiProjectProgress.findMany();
  for (const item of progressItems) {
    const content = replace(item.content);
    if (content !== item.content) {
      await prisma.aiProjectProgress.update({ where: { id: item.id }, data: { content } });
      updated += 1;
    }
  }

  const actionItems = await prisma.aiActionItem.findMany();
  for (const item of actionItems) {
    const data = { task: replace(item.task), owner: replace(item.owner) };
    if (data.task !== item.task || data.owner !== item.owner) {
      await prisma.aiActionItem.update({ where: { id: item.id }, data });
      updated += 1;
    }
  }

  console.log(`Agent naming is ready. Updated records: ${updated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
