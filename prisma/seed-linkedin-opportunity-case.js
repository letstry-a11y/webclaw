// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const content = `
<div style="border-left:5px solid #032a72;background:#eef3fb;padding:18px 20px;margin-bottom:28px">
  <p style="margin:0 0 8px"><strong>案例速览</strong></p>
  <p style="margin:0">通过整合 LinkedInTrack 与商机检索系统，团队打通了“主动发现高价值联系人—自动触达—客户回复—销售跟进—结果回流”的完整链路，在保持两套系统独立演进的同时，让 3,000+ 潜在联系人进入可持续运营的销售闭环。</p>
</div>

<h2>从两个独立工具，到一条完整商机链路</h2>
<p>LinkedInTrack 擅长承接主动找上门的客户：接收 LinkedIn 私信、创建工单、辅助分诊、生成回复建议并转交负责人；商机检索系统则负责主动出击，通过搜索 Agent 找出值得联系的医生与经销商，完成评分、开发信触达和多轮跟进。</p>
<p>过去，两套系统各自解决一半问题。完成整合后，它们共同形成一条从“发现机会”到“销售确认结果”的闭环，同时保留各自独立的代码、数据库职责和发布节奏。</p>

<h2>项目成果一览</h2>
<table><thead><tr><th>成果维度</th><th>落地结果</th></tr></thead><tbody>
  <tr><td>商机覆盖</td><td>将 3,000+ 医生与经销商潜在联系人纳入评分、推荐与跟进流程</td></tr>
  <tr><td>系统集成</td><td>两套系统同机协作，但不共享代码、不相互依赖内部实现</td></tr>
  <tr><td>数据接口</td><td>通过 9 个只读业务视图提供推荐、回复、待跟进和意向确认数据</td></tr>
  <tr><td>结果回流</td><td>以 6 类标准事件记录推荐、人工建联、工单创建、意向判断和邮件跟进</td></tr>
  <tr><td>安全边界</td><td>公网统一入口，业务数据库仅限内部访问，操作采用签名与一次性凭证</td></tr>
  <tr><td>协作效率</td><td>通过每日推荐、触达日报、待跟进提醒和意向周报推动销售行动</td></tr>
</tbody></table>

<h2>架构原则：同机部署，低耦合协作</h2>
<p>整合并不是把两套代码强行揉成一个项目，而是把耦合面压缩到两条清晰契约：<strong>读取业务视图</strong>与<strong>回写标准事件</strong>。只要接口含义保持稳定，两侧都可以独立重构和升级。</p>
<blockquote><strong>核心设计：</strong>读取需要的数据，回写已经发生的事实，不跨系统修改对方的业务状态。</blockquote>
<p>系统整体采用四层结构：</p>
<ol>
  <li><strong>渠道接入层：</strong>连接 LinkedIn、邮件、钉钉和网页反馈入口，只做协议转换。</li>
  <li><strong>应用编排层：</strong>负责定时任务、工作清单、回复、转交、催办和日报等流程编排，LLM 能力也被限制在这一层。</li>
  <li><strong>领域层：</strong>集中管理工单状态、分诊、路由与跟进规则，保持纯业务逻辑，不直接访问外部系统。</li>
  <li><strong>基础设施层：</strong>承载数据库、配置、凭据、日志以及商机系统适配器。</li>
</ol>
<p>这次合并主要新增渠道入口、商机数据适配和一个应用步骤，原有领域状态机几乎无需改动。这种边界设计显著降低了集成风险，也让后续测试和迭代更可控。</p>

<h2>两条窄接口，连接九类业务视图</h2>
<h3>只读视图：把“该联系谁”交给业务数据</h3>
<p>LinkedInTrack 通过只读视图获取联系人评分、每日推荐、近期回复、国家概况、待跟进名单、意向确认队列和销售负责人名册等数据。数据库访问失败时，系统会安全降级为空结果，避免影响原有工单流程。</p>
<p>推荐逻辑支持按机构筛选、按国家分配负责人，并对近期已经推送过的联系人进行轮换过滤，减少销售收到重复推荐。</p>

<h3>事件回写：把“已经发生什么”变成可追踪事实</h3>
<p>系统不会直接跨库修改复杂状态，而是回写标准业务事件，例如“已进入每日推荐”“销售已人工建联”“已创建工单”“销售已确认意向”“系统收到销售抄送”等。事件既是后续提醒和轮换的依据，也让业务过程具备可审计性。</p>

<h2>三条业务流，形成完整闭环</h2>
<h3>1. 入站：有人主动找上门</h3>
<p>客户通过 LinkedIn 发来私信后，系统自动创建工单、完成初步分诊并生成回复建议。涉及正式回复、拟稿审核和负责人确认的步骤仍由人工完成。AI 只提供判断和草稿，不越过授权边界直接代表员工发信。</p>

<h3>2. 出站：主动寻找高价值对象</h3>
<p>搜索 Agent 找出潜在联系人并完成评分后，系统启动开发信和多轮跟进。客户产生回复时，系统识别回复性质，将有效线索进入每日触达报告，再由对应销售负责人继续推进。</p>

<h3>3. 回流：销售动作自动成为系统状态</h3>
<p>销售既可以在报告中点击“已联系”，也可以直接回复客户邮件并抄送系统邮箱。系统识别到销售身份和联系人关系后，会自动记录跟进事件，不要求销售重复录入。随后，系统按时间触发待跟进提醒、二阶意向确认和周报汇总。</p>

<h2>让 AI 有能力，也有边界</h2>
<ul>
  <li><strong>AI 不直接发信：</strong>LLM 负责判断和拟稿，真正发送必须经过受控的发送授权。</li>
  <li><strong>写入只有一个入口：</strong>工单、事件和任务状态统一经过领域 API 校验，避免渠道各自修改数据库。</li>
  <li><strong>读取不产生副作用：</strong>打开链接只展示信息，确认动作必须通过受保护的提交完成，避免邮件安全扫描误触发业务操作。</li>
  <li><strong>数据库不暴露公网：</strong>外部访问统一经过应用入口，商机数据与内部服务保持在受控网络边界内。</li>
  <li><strong>一次性操作凭证：</strong>关键反馈采用签名和单次使用机制，防止链接被重复提交。</li>
</ul>

<h2>业务价值：自动化不是替代销售，而是消除断点</h2>
<p>这套系统最重要的价值，不只是自动搜索或自动写信，而是让每一次推荐、联系、回复和意向判断都能自然进入下一步。AI 负责整理信息、识别优先级和减少重复劳动；销售保留客户沟通和商业判断的最终决定权。</p>
<p>通过每日推荐、48 小时待跟进提醒、意向确认和周期性汇总，管理层可以更清晰地看到高价值对象是否被及时联系、客户回复是否得到处理，以及商机当前处于哪个阶段。</p>

<h2>可复用的项目经验</h2>
<ol>
  <li><strong>先定义事件，再连接系统。</strong>明确“推荐、联系、回复、确认”等业务事实，集成会比共享内部表结构更稳定。</li>
  <li><strong>把人工动作嵌入原有习惯。</strong>让销售继续使用邮件，通过抄送自动留痕，比要求重复填写系统更容易落地。</li>
  <li><strong>把 AI 权限设计成能力对象。</strong>不仅在提示词里要求 AI 不发信，还要在代码结构上让它拿不到发送权限。</li>
  <li><strong>失败时保护主流程。</strong>外部数据不可用时安全降级，不让新增能力拖垮已经稳定运行的业务链路。</li>
  <li><strong>公网入口越少越好。</strong>统一入口、最小暴露面和一次性凭证，能够显著降低维护与安全成本。</li>
</ol>

<p><em>本文根据《LinkedInTrack × 商机搜索系统架构》内部技术资料整理，敏感主机、账号及凭据细节已省略。</em></p>
`;

const data = {
  title: "成果案例｜LinkedInTrack × 商机检索系统：打通从发现到跟进的智能闭环",
  content,
  excerpt: "整合 LinkedInTrack 与商机检索系统，以 9 个只读视图和 6 类标准事件连接 3,000+ 潜在联系人，形成发现、触达、回复、销售跟进与结果回流的完整闭环。",
  type: "blog",
  category: "success-stories",
  tags: "成果案例,LinkedIn,商机检索,销售自动化,Agent,系统架构",
  authorName: "AI 应用项目组",
  authorFingerprint: "",
  isPinned: false,
  isFeatured: false,
  isPublished: true,
  attachments: "",
};

async function main() {
  await prisma.category.upsert({
    where: { slug: "success-stories" },
    update: { name: "成果案例", icon: "trophy", order: 50 },
    create: { name: "成果案例", slug: "success-stories", icon: "trophy", order: 50 },
  });

  const post = await prisma.post.upsert({
    where: { slug: "linkedin-opportunity-intelligence-loop" },
    update: data,
    create: { ...data, slug: "linkedin-opportunity-intelligence-loop" },
  });
  console.log(`Success story is ready: ${post.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
