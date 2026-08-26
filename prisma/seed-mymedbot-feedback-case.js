// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const content = `
<div style="border-left:5px solid #032a72;background:#eef3fb;padding:18px 20px;margin-bottom:28px">
  <p style="margin:0 0 8px"><strong>案例速览</strong></p>
  <p style="margin:0">MyMedbot App 已完成 1.0 版本核心功能开发并上架 iOS 软件市场，面向外部客户、内部员工及合作医生建立统一的双向反馈通道。用户可以随时提交产品问题、功能需求和服务请求，团队通过身份审核、设备关联、语音输入、附件举证与进度跟踪，把分散反馈转化为可处理、可追踪的业务闭环。</p>
</div>

<h2>从“找到反馈入口”，到“让每一条声音都有回应”</h2>
<p>医疗产品覆盖客户、医生、员工与服务团队等多类用户。过去，产品问题和改进建议可能分散在邮件、即时通讯、口头沟通或线下记录中，信息格式不统一、上下文不完整，也难以持续追踪处理状态。</p>
<p>MyMedbot App 用户反馈交互系统将这些入口集中到一个移动端应用中：外部客户可以反馈产品使用问题，内部员工可以提交产品需求与功能缺陷，合作医生和服务人员也能围绕设备与服务发起请求。系统提供即时反馈入口，并以 24 小时快速响应机制推动问题进入处理流程。</p>

<img src="/cases/mymedbot/overview.png" alt="MyMedbot App 反馈入口与首页操作指南" style="width:100%;margin:24px 0 8px;border:1px solid #e3e6e1" />
<p style="margin-top:0;color:#667085;font-size:14px">MyMedbot App 为用户提供直接的产品反馈、服务请求与支持入口。</p>

<h2>一套系统，连接内外部多角色</h2>
<table><thead><tr><th>使用角色</th><th>主要场景</th><th>带来的价值</th></tr></thead><tbody>
  <tr><td>外部客户</td><td>提交产品使用问题、缺陷与服务请求</td><td>获得统一、便捷且可追踪的反馈入口</td></tr>
  <tr><td>内部员工</td><td>提交产品需求、功能缺陷及外勤办公信息</td><td>减少跨工具转述，让一线信息更快回到产品与服务团队</td></tr>
  <tr><td>合作医生</td><td>围绕设备使用、产品体验和临床协作提出反馈</td><td>让真实使用场景成为产品持续优化的输入</td></tr>
  <tr><td>运维与管理人员</td><td>关联设备、查看反馈进度和设备运维数据</td><td>形成面向设备与用户的服务记录，支持后续统计和管理</td></tr>
</tbody></table>

<h2>三类反馈，覆盖产品全生命周期</h2>
<p>用户进入应用后，可以根据实际情况选择相应的反馈类型：</p>
<ul>
  <li><strong>缺陷报告：</strong>反馈软件、设备或产品使用过程中遇到的问题。</li>
  <li><strong>功能需求：</strong>提出新功能、流程优化或体验改进建议。</li>
  <li><strong>其他服务：</strong>发起产品服务、支持或补充咨询请求。</li>
</ul>
<p>清晰的类型划分让信息从提交之初就具备结构，便于后续分派给对应团队，也减少了人工二次整理的成本。</p>

<img src="/cases/mymedbot/feedback-types.png" alt="MyMedbot App 的缺陷报告、功能需求和其他服务入口" style="width:100%;margin:24px 0 8px;border:1px solid #e3e6e1" />
<p style="margin-top:0;color:#667085;font-size:14px">缺陷报告、功能需求和其他服务三类入口，帮助用户快速选择合适的反馈路径。</p>

<h2>让反馈更快、更完整：语音、AI 整理与证据补充</h2>
<p>移动和外勤场景下，长文本输入往往会降低反馈意愿。MyMedbot 支持用户通过语音自然描述问题，系统将语音转写为结构化内容，并由 AI 自动生成问题标题、描述和发生时间。用户可以在提交前检查、修改并继续补充，最终决定是否发送。</p>

<img src="/cases/mymedbot/voice-feedback.png" alt="MyMedbot App 语音描述与 AI 文本整理" style="width:100%;margin:24px 0 8px;border:1px solid #e3e6e1" />
<p style="margin-top:0;color:#667085;font-size:14px">语音输入降低填写门槛，AI 负责整理，用户保留最终确认权。</p>

<p>对于需要进一步定位的问题，用户还可以上传图片等附件，并扫描条码、二维码或手动输入设备 ID。设备信息与反馈内容一起进入支持流程，减少服务团队来回询问，提高问题定位效率。</p>

<img src="/cases/mymedbot/submit-evidence.png" alt="MyMedbot App 上传附件、填写设备 ID 并提交反馈" style="width:100%;margin:24px 0 8px;border:1px solid #e3e6e1" />
<p style="margin-top:0;color:#667085;font-size:14px">附件、设备 ID 与结构化描述共同构成更完整的问题上下文。</p>

<h2>严格身份审核，为跨地区服务建立可信基础</h2>
<p>MyMedbot 面向外部客户、内部员工和合作医生等不同角色，用户注册时需要提交姓名、密码、昵称、国家或地区、用户角色以及可验证的联系方式。严格的注册身份审核机制帮助团队确认使用者身份，也为不同地区、不同角色的服务分配建立基础。</p>
<p>1.0 版本已经完成多地区适配，可服务海外多个国家和地区。用户还可以在账户中维护中英文语言偏好、隐私条款、设备信息与个人设置，让跨地区使用体验保持一致。</p>

<img src="/cases/mymedbot/account-management.png" alt="MyMedbot App 反馈记录、设备管理、语言和隐私设置" style="width:100%;margin:24px 0 8px;border:1px solid #e3e6e1" />
<p style="margin-top:0;color:#667085;font-size:14px">用户可查看已提交反馈及处理进度，并管理关联设备、语言与隐私设置。</p>

<h2>1.0 版本已交付的核心能力</h2>
<table><thead><tr><th>能力</th><th>上线情况</th></tr></thead><tbody>
  <tr><td>iOS 移动端</td><td>已上架 iOS 软件市场并可正式使用</td></tr>
  <tr><td>基础反馈闭环</td><td>支持分类、描述、复核、附件、设备关联、提交与进度跟踪</td></tr>
  <tr><td>智能输入</td><td>支持语音描述、转写和 AI 辅助整理</td></tr>
  <tr><td>身份审核</td><td>支持用户注册、身份资料收集与审核</td></tr>
  <tr><td>多角色使用</td><td>覆盖外部客户、内部员工与合作医生</td></tr>
  <tr><td>多地区适配</td><td>支持海外多个国家和地区使用，并提供中英文切换</td></tr>
</tbody></table>

<h2>对业务的影响</h2>
<ol>
  <li><strong>缩短反馈路径。</strong>用户不再需要寻找联系人或反复转述，随时可以从统一入口提交问题。</li>
  <li><strong>提高信息质量。</strong>反馈类型、设备信息、附件、语音转写和 AI 整理共同补全问题上下文。</li>
  <li><strong>连接一线与产品团队。</strong>外部客户体验、内部需求和合作医生建议能够进入同一套可追踪流程。</li>
  <li><strong>支撑全球业务。</strong>多地区适配、语言设置和身份审核机制，为海外用户服务提供基础能力。</li>
  <li><strong>沉淀服务数据。</strong>反馈记录、设备关联和运维信息可以持续积累，为产品改进与服务管理提供依据。</li>
</ol>

<blockquote><strong>项目价值：</strong>MyMedbot 不是一个简单的意见收集表，而是一条连接用户、产品、服务与设备数据的持续反馈通道。</blockquote>

<p><em>本文根据《My MedBot Quick User Guide》及项目组提供的 1.0 版本成果资料整理。</em></p>
`;

const data = {
  title: "成果案例｜MyMedbot App：搭建全球用户与内部团队的双向反馈通道",
  content,
  excerpt: "MyMedbot App 1.0 已上架 iOS 软件市场，通过身份审核、分类反馈、语音与 AI 整理、设备关联和进度跟踪，连接外部客户、内部员工与合作医生。",
  type: "blog",
  category: "success-stories",
  tags: "成果案例,MyMedbot,用户反馈,客户服务,移动应用,iOS,全球化,AI",
  authorName: "MyMedbot 项目组",
  authorFingerprint: "",
  isPinned: false,
  isFeatured: false,
  isPublished: true,
  coverImage: "/cases/mymedbot/overview.png",
  attachments: "",
};

async function main() {
  await prisma.category.upsert({
    where: { slug: "success-stories" },
    update: { name: "成果案例", icon: "trophy", order: 50 },
    create: { name: "成果案例", slug: "success-stories", icon: "trophy", order: 50 },
  });

  const post = await prisma.post.upsert({
    where: { slug: "mymedbot-app-feedback-interaction-system" },
    update: data,
    create: { ...data, slug: "mymedbot-app-feedback-interaction-system" },
  });
  console.log(`Success story is ready: ${post.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
