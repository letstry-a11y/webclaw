"use client";

export default function PortfolioSortSelect({ sort }: { sort?: string }) {
  return (
    <label>
      排序
      <select name="sort" defaultValue={sort || "stage"} onChange={(event) => event.currentTarget.form?.requestSubmit()}>
        <option value="stage">当前阶段（流程顺序）</option>
        <option value="priority">管理优先</option>
        <option value="points">积分从高到低</option>
        <option value="updated">最近更新</option>
        <option value="due">目标日期</option>
      </select>
    </label>
  );
}
