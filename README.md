# 科聚隆外贸机会雷达

Kejulong Trade Opportunity Radar 是一个本地单用户 MVP。它把真实公开来源整理为 Evidence，经人工核实后形成可解释的机会、开发动作和跟进任务，回答：今天最值得联系的公司是谁、为什么、下一步做什么。

## 边界

- 使用本地 SQLite，不适合部署到 Vercel。
- 不支持多用户、登录、云端定时任务或自动发送邮件。
- 不猜联系人、邮箱、电话、国家或发布日期。
- Source Adapter 只产生 Evidence，不会自动创建高优先级机会或联系客户。

## 安装与启动

```bash
npm ci
npm run db:migrate
npm run dev
```

默认数据库为 `data/ai-trade-leads.db`。可通过 `DATABASE_FILE` 指向其他本地路径；数据库文件不会被提交。

```bash
npm run db:check
npm run db:smoke
npm run test:v1
npm run lint
npm run typecheck
npm run build
```

## 使用流程

1. 打开 `/dashboard` 查看今日机会；无真实数据时会显示空状态。
2. 在 `/dashboard/sources` 手工添加公开 URL，或在完成 Serper/海关 CSV 人工确认后导入 Evidence。
3. 在 `/dashboard/verification` 审核公司、证据与机会；不确定信息保持待核实。
4. 在 `/dashboard/actions` 创建跟进任务、备注和开发草稿。草稿不会自动发送。
5. 在 `/dashboard/v1-migration` 备份旧 localStorage，预检、人工决策、导入、查看报告或回滚。

## 来源适配器

- Manual URL Evidence：不抓取网址，只保存用户提供的公开 URL 与证据文本。
- Serper Web Search：仅服务端读取 `SERPER_API_KEY`；没有配置时返回配置提示。搜索结果只形成待核实 Evidence。
- Customs CSV：仅导入用户合法取得的 CSV，不声称连接付费海关数据库。

在本地 `.env.local` 配置 Serper：

```bash
SERPER_API_KEY=your_key
```

不要提交 `.env.local`。密钥不会保存在 localStorage 或显示给浏览器。

## 旧数据迁移与隐私

迁移备份可能包含客户联系方式、备注、跟进记录和开发话术，请妥善保管。迁移保留原始 payload；不自动猜测缺失字段。支持预检、导入、软回滚和恢复重导入。请定期备份本地 SQLite 数据文件。

更多使用和安全信息见 [用户指南](docs/v1/USER_GUIDE.md)、[最终验收](docs/v1/FINAL_ACCEPTANCE.md) 与 [安全说明](docs/v1/SECURITY_NOTES.md)。
