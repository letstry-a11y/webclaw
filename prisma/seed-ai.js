import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projects = [
  {
    id: "ai-opportunity-search",
    name: "商机检索系统",
    subtitle: "从 3,000+ 医生与经销商线索中检索、评分并推荐高价值联系人，联动 LinkedIn 自动触达。",
    businessImpact: "提升海外商机发现与销售跟进效率，减少重复筛选，让高价值对象及时进入销售闭环。",
    owner: "曹起",
    releasePlan: "2026 年 8 月已交付",
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
    subtitle: "面向用户的医疗 AI 助手，支持智能问答，并逐步接入销售出差记录、语音识别与钉钉协同。",
    businessImpact: "扩展患者服务与销售协同场景，验证移动端医疗 AI 产品的商业化路径。",
    owner: "徐鑫鑫 / 王超 / 明峰 / 林宇豪",
    releasePlan: "2026 年 8 月已上架 App Store",
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
    subtitle: "通过产品参数选择、规则校验与智能推荐，辅助销售快速完成配置并衔接下单流程。",
    businessImpact: "降低复杂产品配置门槛，减少人工确认和下单差错，缩短销售响应周期。",
    owner: "向婷婷 / 于新航",
    releasePlan: "预计 2026 年 9 月发布",
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
      update: {
        name: item.name,
        subtitle: item.subtitle,
        businessImpact: item.businessImpact,
        owner: item.owner,
        releasePlan: item.releasePlan,
        status: item.status,
        order: item.order,
      },
      create: {
        id: item.id,
        name: item.name,
        subtitle: item.subtitle,
        businessImpact: item.businessImpact,
        owner: item.owner,
        releasePlan: item.releasePlan,
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
