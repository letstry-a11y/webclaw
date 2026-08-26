# Medbot 访问记录

该目录由 `webclaw-analytics` Docker 后台任务使用。系统每周五 17:00（Asia/Shanghai）生成：

- `访问分析-YYYY-MM-DD.md`：供管理人员和 Codex 阅读的周度分析；
- `访问分析-YYYY-MM-DD.json`：便于进一步统计的结构化汇总。

报告包含 IP 等内部访问数据，不会在 Web 前台展示，也不应提交到 Git 或对外传播。原始逐页访问记录保存在 Docker 的 SQLite 数据库中。
