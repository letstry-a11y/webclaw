"use client";

import { useSyncExternalStore, type FormEventHandler, type ReactNode } from "react";

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

export default function AccountForm({ action, onSubmit, className, children }: {
  action: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  className: string;
  children: ReactNode;
}) {
  const ready = useSyncExternalStore(subscribe, onClient, onServer);
  return (
    <form action={action} method="post" onSubmit={onSubmit}>
      <fieldset disabled={!ready} className={className}>{children}</fieldset>
      {!ready && <p role="status" className="mt-3 text-sm text-slate-600">正在加载表单…</p>}
      <noscript>请启用 JavaScript 并刷新页面，然后再提交。</noscript>
    </form>
  );
}
