import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { setTimeout as wait } from "node:timers/promises";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

test("company approval, initial-device login, password changes, resets and protected pages", { timeout: 75000 }, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "medbot-company-access-"));
  const file = path.join(dir,"test.db");
  const dbUrl = "file:" + file;
  const random = () => randomBytes(18).toString("hex");
  const initial = random(), adminPassword = random(), personal = random();
  const env = { ...process.env, DATABASE_URL: dbUrl, NODE_ENV: "production", JWT_SECRET: random(), MANAGEMENT_REPORT_TOKEN: random(),
    PUBLIC_BASE_URL: "https://example.invalid", COMPANY_EMAIL_DOMAINS: "company.test", INITIAL_USER_PASSWORD: initial,
    COMPANY_ADMIN_EMAIL: "admin@company.test", COMPANY_ADMIN_DEPARTMENT: "QA", COMPANY_ADMIN_NAME: "QA admin", BOOTSTRAP_ADMIN_PASSWORD: adminPassword };
  const db = new PrismaClient({datasources:{db:{url:dbUrl}}});
  let app;
  try {
    await writeFile(file, "");
    execFileSync(process.execPath,["node_modules/prisma/build/index.js","db","push","--skip-generate"], { env, stdio:"pipe" });
    const adminLink = execFileSync(process.execPath,["scripts/bootstrap-company-admin.mjs"],{ env,encoding:"utf8",stdio:["ignore","pipe","pipe"] }).trim();
    const proof = link => new URLSearchParams(new URL(link).hash.slice(1)).get("activation");
    const listener = net.createServer(); listener.listen(0,"127.0.0.1"); await once(listener,"listening");
    const port = listener.address().port; await new Promise(resolve => listener.close(resolve));
    const base = "http://127.0.0.1:" + port;
    app = spawn(process.execPath,[".next/standalone/server.js"],{env:{...env,HOSTNAME:"127.0.0.1",PORT:String(port)},stdio:["ignore","ignore","inherit"]});
    let ready=false;
    for(let attempt=0;attempt<100;attempt++) {
      try { ready=(await fetch(base+"/login")).ok; } catch { /* server is starting */ }
      if(ready) break; await wait(150);
    }
    assert.ok(ready,"production server is ready");
    function client() {
      const jar = new Map();
      return async (route, body, headers={}) => {
        const res = await fetch(base+route, { method: body ? "POST":"GET", redirect:"manual", headers: {
          Cookie:[...jar].map(([k,v])=>k+"="+v).join("; "), ...(body ? {"Content-Type":"application/json", Origin:base}:{}), ...headers },
          body: body ? JSON.stringify(body):undefined });
        for (const line of res.headers.getSetCookie()) {
          const [k,v]=line.split(";")[0].split("=");
          if (v) jar.set(k,v); else jar.delete(k);
        }
        return res;
      };
    }
    const admin = client(), employee = client(), visitor = client();
    const account = {name:"QA employee",department:"QA",email:"employee@company.test"};
    for(const route of ["/","/ai-projects","/ai-requests","/account","/admin/users","/documents/ai-application-project-incentive-policy.pdf","/uploads/sample.txt"]) {
      const res=await visitor(route); assert.equal(res.status,307,route);
      const redirected = new URL(res.headers.get("location"), base);
      assert.equal(redirected.origin,base); assert.equal(redirected.pathname,"/login"); assert.equal(redirected.searchParams.get("next"),route);
    }
    for(const route of ["/api/posts","/api/files/sample.txt","/api/management/ai-projects"]) assert.equal((await visitor(route)).status,401,route);
    const reportPath = "/api/management/ai-projects";
    const reportHeaders = { Authorization: "Bearer " + env.MANAGEMENT_REPORT_TOKEN };
    assert.equal((await visitor(reportPath, null, reportHeaders)).status, 200);
    assert.equal((await visitor(reportPath, null, { ...reportHeaders, "X-Forwarded-For": "192.168.65.1" })).status, 200);
    assert.equal((await visitor(reportPath, null, { ...reportHeaders, "CF-Ray": "edge" })).status, 401);
    assert.equal((await visitor(reportPath, null, { Authorization: "Bearer invalid" })).status, 401);
    assert.equal((await visitor("/api/auth/register",{...account,email:"employee@example.invalid"})).status,400);
    assert.equal((await visitor("/api/auth/register",account)).status,200);
    const pending=await db.user.findUniqueOrThrow({where:{email:account.email}});
    assert.equal(pending.status,"pending");
    assert.equal((await employee("/api/auth/login",{email:account.email,password:initial})).status,401);
    assert.equal((await admin("/api/auth/login",{email:"admin", password:adminPassword})).status,401);
    assert.equal((await admin("/api/auth/login",{email:"admin",password:adminPassword,activation:proof(adminLink)})).status,200);
    assert.equal((await admin("/admin/users")).status,200);
    for (const [url, action] of [["/login", "/api/auth/login"], ["/register", "/api/auth/register"], ["/account", "/api/auth/change-password"]]) {
      const response = await admin(url);
      assert.equal(response.status, 200, url);
      const html = await response.text();
      const forms = html.match(/<form\b[^>]*>\s*<fieldset\b[^>]*>/g) || [];
      const form = forms.find(tag => tag.includes(`action="${action}"`));
      assert.ok(form, `Server-rendered account form for ${url}`);
      assert.match(form, /method="post"/i);
      assert.match(form, /<fieldset\b[^>]*\bdisabled\b/);
    }
    const manage="/api/admin/users/"+pending.id;
    const approval=await admin(manage,{action:"approve",version:pending.sessionVersion}); assert.equal(approval.status,200);
    const first=proof((await approval.json()).activationLink);
    assert.equal((await admin(manage,{action:"approve",version:pending.sessionVersion})).status,409);
    assert.equal((await employee("/api/auth/login",{email:account.email,password:initial})).status,401);
    assert.equal((await employee("/api/auth/login",{email:account.email,password:initial,activation:first})).status,200);
    assert.equal((await employee("/api/auth/login",{email:account.email,password:initial})).status,200);
    assert.equal((await employee("/ai-projects")).status,200);
    assert.equal((await employee("/admin/users")).status,403);
    assert.equal((await employee(reportPath, null, { ...reportHeaders, "CF-Ray": "edge" })).status, 401);
    assert.equal((await employee("/api/auth/change-password",{currentPassword:initial,password:personal,confirmPassword:personal})).status,200);
    const fresh=client();
    assert.equal((await fresh("/api/auth/login",{email:account.email,password:personal})).status,200);
    const current=await db.user.findUniqueOrThrow({where:{id:pending.id}});
    const reset=await admin(manage,{action:"reset",version:current.sessionVersion}); assert.equal(reset.status,200);
    const second=proof((await reset.json()).activationLink); assert.notEqual(first,second);
    assert.equal((await fresh("/api/posts")).status,401);
    assert.equal((await employee("/api/auth/login",{email:account.email,password:personal})).status,401);
    assert.equal((await employee("/api/auth/login",{email:account.email,password:initial,activation:first})).status,401);
    assert.equal((await employee("/api/auth/login",{email:account.email,password:initial,activation:second})).status,200);
    assert.equal((await employee("/api/auth/logout",{})).status,303);
    assert.equal((await employee("/api/auth/login",{email:account.email,password:initial})).status,401);
  } finally {
    if (app && app.exitCode === null) { const exited=once(app,"exit"); app.kill("SIGTERM"); await exited; }
    await db.$disconnect();
    await rm(dir,{recursive:true,force:true});
  }
});
