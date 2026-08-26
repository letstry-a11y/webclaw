/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");
const path = require("node:path");

process.env.TZ ||= "Asia/Shanghai";

function nextFridayAtFive(now = new Date()) {
  const next = new Date(now);
  next.setHours(17, 0, 0, 0);
  const daysUntilFriday = (5 - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + daysUntilFriday);
  if (next <= now) next.setDate(next.getDate() + 7);
  return next;
}

function runReport() {
  const child = spawn(process.execPath, [path.join(__dirname, "analytics-report.cjs")], {
    env: process.env,
    stdio: "inherit",
  });
  child.once("exit", (code) => {
    if (code !== 0) console.error(`[analytics] 周报进程退出，代码 ${code}`);
  });
}

function schedule() {
  const now = new Date();
  const next = nextFridayAtFive(now);
  const delay = next.getTime() - now.getTime();
  console.log(`[analytics] 下一次周报：${next.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai", hour12: false })}`);
  setTimeout(() => {
    runReport();
    schedule();
  }, delay);
}

if (require.main === module) schedule();

module.exports = { nextFridayAtFive };
