import nodemailer from "nodemailer";

function smtpTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) throw new Error("企业邮箱服务尚未配置，请联系管理员");
  return nodemailer.createTransport({
    host, port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || "true") === "true", auth: { user, pass },
  });
}

export async function sendVerificationEmail(email: string, code: string, purpose: "register" | "reset") {
  const subject = purpose === "register" ? "Medbot 企业账号注册验证码" : "Medbot 密码重置验证码";
  const action = purpose === "register" ? "完成企业账号注册" : "重置登录密码";
  if (process.env.NODE_ENV !== "production" && process.env.AUTH_EMAIL_MODE === "console") {
    console.info(`[auth-email] ${email} ${purpose} code=${code}`);
    return;
  }
  await smtpTransport().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER, to: email, subject,
    text: `您正在${action}。验证码：${code}，10 分钟内有效。若非本人操作，请忽略本邮件。`,
    html: `<div style="font-family:Arial,sans-serif;color:#111827"><h2>${subject}</h2><p>您正在${action}。</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#032a72">${code}</p><p>验证码 10 分钟内有效。若非本人操作，请忽略本邮件。</p></div>`,
  });
}
