// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const content = `
<div style="border-left:5px solid #76b900;background:#f3f7ed;padding:18px 20px;margin-bottom:28px">
  <p style="margin:0 0 8px"><strong>政策速览</strong></p>
  <p style="margin:0">AI 项目按战略影响分为 5 级，项目积分总包最高 2,000 分，并根据结题评审结果乘以 0.1-1.5 的成效系数。积分可按 1:1 兑换 Token、VPN 或其他 AI 工具费用报销额度。</p>
</div>

<h2>一、目的</h2>
<p>为鼓励公司全体员工积极参与公司 AI 应用变革与发展，有效应对项目推进过程中存在的时间碎片化、投入不可控等问题，激发员工的创新热情与协作精神，特围绕 AI 应用项目建立清晰、可量化的激励机制，制定本办法。</p>

<h2>二、适用范围</h2>
<p>全体在职员工。凡以兼职或项目制形式参与 AI 应用项目，并在项目主导、技术开发、周边支持（含测试、文档编写、协调管理等）环节做出实际贡献的人员，均纳入本办法覆盖范围。</p>

<h2>三、AI 积分</h2>
<p><strong>定义：</strong>AI 积分（以下简称“积分”）是衡量员工在 AI 应用项目中贡献度的量化指标。AI 发展委员会指定 AI 项目主导人，并对每个 AI 项目参照开发该类项目过程中花费的 Token 量以及战略意义分级定积分总包。</p>

<h3>项目等级与积分总包</h3>
<table><thead><tr><th>AI 项目等级</th><th>影响程度</th><th>AI 积分总包范围</th></tr></thead><tbody>
<tr><td>1 级</td><td>影响公司层面的营销、收入、经营等</td><td>1,000-2,000</td></tr>
<tr><td>2 级</td><td>影响部门层面的流程、管理、效率等</td><td>800-1,000</td></tr>
<tr><td>3 级</td><td>影响高管级员工的日常工作</td><td>500-800</td></tr>
<tr><td>4 级</td><td>影响多名员工的日常工作</td><td>300-500</td></tr>
<tr><td>5 级</td><td>仅影响项目主导人本人的工作</td><td>100-300</td></tr>
</tbody></table>

<h3>项目成效系数</h3>
<p>项目完成并通过评审结题后，由 AI 项目评审小组对执行情况进行成果评估，最终打分得到 AI 项目成效系数。</p>
<table><thead><tr><th>AI 项目总分 X</th><th>成果描述</th><th>成效系数</th></tr></thead><tbody>
<tr><td>X≥90</td><td>远超预期完成项目目标，在公司营收、经营等方面有杰出贡献或成就</td><td>1.5</td></tr>
<tr><td>85≤X＜90</td><td>超额完成项目目标，在部门流程、管理和降本增效方面有较高贡献或成就</td><td>1.2</td></tr>
<tr><td>80≤X＜85</td><td>顺利完成项目目标，并达到需求者认可的质量标准</td><td>1</td></tr>
<tr><td>70≤X＜80</td><td>基本完成项目目标，但略有不足和失误</td><td>0.8</td></tr>
<tr><td>X＜70</td><td>未完成项目目标，或在某些方面存在明显不足和失误</td><td>0.1-0.5</td></tr>
</tbody></table>

<blockquote><strong>项目 AI 总积分 = 项目积分包 × 成效系数。</strong></blockquote>
<p>项目主导人根据团队成员实际贡献度提出积分分配方案，经 AI 发展委员会审核确认后生效。项目交付后，团队须保障后续基础缺陷修复与运维工作。AI 项目评审小组将根据项目差异设定 3 个月至 1 年的质保期。</p>
<ul>
  <li>项目交付后先行发放 <strong>70%</strong> AI 积分，并向全员公示。</li>
  <li>剩余 <strong>30%</strong> 为质保积分，于质保期结束后发放给参与质保工作的开发团队。</li>
  <li>历史累计积分可兑换 Token、VPN 或其他 AI 工具费用报销额，兑换比例为 <strong>1:1</strong>，兑换后用于奖励的积分失效。</li>
</ul>

<h2>四、AI 水平等级</h2>
<p>AI 水平等级是衡量员工 AI 实战能力和经验双维度的资格标尺，共分五级。等级认定以“历史累计积分”（个人历史获得的全部积分，只增不减，积分兑换奖励后不扣减）和已结题项目经历为依据；“主导”指担任 AI 项目主导人并完成结题。</p>
<table><thead><tr><th>等级</th><th>名称</th><th>历史累计积分</th><th>结题项目数</th><th>项目经历要求</th></tr></thead><tbody>
<tr><td>L1</td><td>AI 入门</td><td>不设门槛</td><td>≥1</td><td>参与 AI 项目≥1 个</td></tr>
<tr><td>L2</td><td>AI 初级</td><td>≥2,000</td><td>≥2</td><td>至少 1 个项目成效系数≥1</td></tr>
<tr><td>L3</td><td>AI 中级</td><td>≥8,000</td><td>≥3</td><td>主导项目结题≥1 个</td></tr>
<tr><td>L4</td><td>AI 高级</td><td>≥20,000</td><td>≥5</td><td>主导项目结题≥2 个</td></tr>
<tr><td>L5</td><td>AI 专家</td><td>≥35,000</td><td>≥8</td><td>主导项目结题≥3 个，且成效系数≥1.5 的项目≥1 个</td></tr>
</tbody></table>
<p><strong>注：项目统计仅统计已结题项目，且成效系数≥1。</strong></p>

<h3>等级管理与资源倾斜</h3>
<ul>
  <li>AI 高级及以上优先获得 Token 额度、算力资源与外部 AI 培训名额等资源倾斜。</li>
  <li>AI 高级每年至少带教 1 名、AI 专家至少带教 2 名较低等级员工参与 AI 项目。</li>
  <li>被带教人所在项目结题且评审达到 80 分及以上，导师每人次奖励 1,000 积分，年度上限 3,000 积分。</li>
  <li>AI 项目评审小组每半年集中评定并公示一次；员工达到条件后也可随时提出晋级申请。</li>
  <li>AI 高级及以上人员连续 12 个月未参与任何 AI 项目，等级下调一级；对公司 AI 战略有特殊重大贡献者可经特批破格晋级。</li>
</ul>

<h3>职业发展激励</h3>
<ul>
  <li>同级别 AI 积分 TOP 20%：直接获得专业/管理通道晋升破格提名名额，且任用率不低于 30%。</li>
  <li>同级别 AI 积分 TOP 50%：专业/管理通道晋升自动加 3 分。</li>
  <li>同级别 AI 积分 TOP 75%：专业/管理通道晋升自动加 1.5 分。</li>
  <li>AI 团队成员在模块、单元部门两级干部任用评估同等条件时，优先任用 AI 历史积分高者。</li>
  <li>AI 发展委员会拥有单独提报评优候选人/团队的权限。</li>
</ul>

<h2>五、员工流动情况下的积分管理</h2>
<ol>
  <li>新入职员工自入职之日起自动纳入本办法范围，参与后续项目即可累积积分。</li>
  <li>离职员工离职时已获得的积分自动失效。</li>
  <li>升职、调岗员工自人员变动生效之日起，其积分继续有效，并适用于新岗位的相关激励场景。</li>
</ol>

<h2>六、附则</h2>
<ol>
  <li><strong>解释与修订：</strong>本办法由人力资本部和 AI 发展委员会负责解释和修订，并联合研发条线根据公司 AI 战略发展及实际运行情况，定期复盘与调整。</li>
  <li><strong>配套规范：</strong>积分分配细则、项目验收标准、评审小组组成等具体操作规范，将以附件或单独管理办法形式另行发布，与本办法具有同等效力。</li>
  <li><strong>生效：</strong>本办法自 <strong>2026 年 1 月 1 日</strong>起生效，试行期一年，至 <strong>2026 年 12 月 31 日</strong>止。如需延续，应经升版评审后重新发布。</li>
</ol>

<p><em>本文根据《AI 应用项目激励办法》原文件整理，正式执行口径以附件 PDF 及后续发布的配套规范为准。</em></p>
`;

const data = {
  title: "重磅发布｜AI 应用项目激励办法（试行）",
  content,
  excerpt: "AI 项目最高可获 2,000 积分，按成效系数结算；积分可 1:1 兑换 AI 工具费用报销，并与 AI 能力等级和职业发展激励挂钩。",
  type: "blog",
  category: "tech",
  tags: "AI,激励政策,AI积分,项目管理,重要公告",
  authorName: "人力资本部 × AI 发展委员会",
  authorFingerprint: "",
  isPinned: true,
  isFeatured: true,
  isPublished: true,
  attachments: JSON.stringify([{
    url: "/documents/ai-application-project-incentive-policy.pdf",
    name: "AI应用项目激励办法.pdf",
    size: 139473,
    type: "application/pdf",
  }]),
};

async function main() {
  const post = await prisma.post.upsert({
    where: { slug: "ai-application-project-incentive-policy" },
    update: data,
    create: { ...data, slug: "ai-application-project-incentive-policy" },
  });
  console.log(`Incentive policy article is ready: ${post.slug}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
