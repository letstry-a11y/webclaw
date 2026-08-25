import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projects = [
  {
    id: "ai-opportunity-search",
    name: "商机检索系统",
    subtitle: "高价值商机检索与 LinkedIn 自动触达",
    status: "delivered",
    order: 1,
    progress: "商机检索系统已完成交付",
    actions: [
      ["合并商机系统至现有 LinkedIn 操作系统，共用数据库，并自动联系检索出的高价值对象", "曹起", "2026-08-25T00:00:00+08:00"],
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
      ["销售出差信息记录系统的 UI 交互", "徐鑫鑫", "2026-08-28T00:00:00+08:00"],
      ["语音识别与数据库推送钉钉，输出方案", "王超", "2026-08-25T00:00:00+08:00"],
      ["商业化语音模型调研", "明峰", "2026-08-28T00:00:00+08:00"],
      ["波兰 App 发布", "林宇豪", "2026-08-28T00:00:00+08:00"],
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
      ["评估试用问题，并给出解决方案", "向婷婷", "2026-08-25T00:00:00+08:00"],
      ["规划 Agent 网络建设与服务器部署环境", "于新航", "2026-08-28T00:00:00+08:00"],
    ],
  },
];

async function main() {
  for (const item of projects) {
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
        data: item.actions.map(([task, owner, dueDate]) => ({
          projectId: project.id,
          task,
          owner,
          dueDate: new Date(dueDate),
        })),
      });
    }
  }
}

main()
  .then(() => console.log("AI dashboard data is ready."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
