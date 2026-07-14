# 塑料材料行业外贸客户开发工作台 v0.6

这是一个本地可运行的 B2B 外贸客户开发工作台，面向塑料材料行业。v0.6 用于辅助手动寻找真实海外客户、保存客户公开来源、生成搜索策略、调用 Serper API 实时搜索候选客户、导入合法来源海关 CSV、对已保存 Lead 做服务端 AI 客户深度分析，管理本地客户开发跟进流程，并生成多渠道开发话术草稿。

当前版本不接数据库、不接邮箱群发，也不会自动保存搜索结果。Serper 搜索结果只能作为候选客户，必须由用户人工确认后才能保存。AI 和 Serper API Key 只在服务端读取，不会进入前端 bundle 或 localStorage。

## v1 Phase 1A database development

The v1 data foundation uses local SQLite. Its default database file is
`data/ai-trade-leads.db`; set the non-sensitive `DATABASE_FILE` environment
variable to use another local path. Database files are ignored by Git.

```bash
npm run db:generate
npm run db:migrate
npm run db:check
npm run db:smoke
```

Phase 1A adds only the database foundation. The existing localStorage UI has
not yet been replaced.

## 如何安装依赖

```bash
npm install
```

## 如何配置 Serper API Key

先到 [Serper](https://serper.dev/) 注册账号并申请 API Key。

在本地创建 `.env.local`：

```bash
SERPER_API_KEY=自己的 Serper API Key
AI_BASE_URL=OpenAI-compatible API Base URL
AI_API_KEY=自己的 AI API Key
AI_MODEL=自己选择的模型
```

不要提交 `.env.local`。项目只会在服务端 API Route 中读取 `SERPER_API_KEY` 和 `AI_API_KEY`，不会把 API Key 保存到浏览器 localStorage，也不会写入前端代码。

## 如何本地启动

```bash
npm run dev
```

然后打开终端提示的本地地址，通常是 `http://localhost:3000`。

## 如何使用搜索页找客户

进入 `/dashboard/search`，选择行业方向、目标国家和客户类型。系统会生成 10 条搜索语句，每条都可以复制，也可以直接打开 Google 或 Bing 搜索。

搜索页只生成搜索语句，不展示客户、不抓取客户、不创建客户。

## 如何使用 Serper 实时搜索候选客户

进入 `/dashboard/serper`，选择行业方向、目标国家、客户类型和结果数量。页面会默认生成搜索词，也支持你直接输入自定义搜索词，然后点击“调用 Serper 实时搜索”。

系统会调用服务端 `/api/serper-search`，从 Serper 返回 Google organic 结果，并过滤明显无关平台。返回结果只是候选客户，不会自动保存。

页面会展示搜索策略列表，每条都可以一键填入，或直接调用 Serper 搜索。页面也提供实盘测试词，例如 `plastic distributor United States`、`plastic resin distributor United States`、`masterbatch distributor United States`。

每次搜索后，页面会显示本次实际搜索词，以及 `rawOrganicCount`、`candidateCount`、`filteredOutCount`，方便判断是搜索词太窄，还是结果被明显无关平台过滤。

v0.3.2 会对 Serper 候选结果做规则预审。预审只基于 Serper 返回的 `title`、`snippet`、`domain`、搜索词、产品关键词、国家和客户类型，不接 AI API，不编造公司信息。页面会显示预审分数、建议动作、匹配度、理由、风险、匹配信号和缺失信息。

预审建议包括：

- 建议保存
- 继续研究
- 不建议保存
- 证据不足

预审不是最终判断，不能替代人工打开官网确认。`reject` 的候选结果仍可人工保存，但系统会提示你再次确认。

v0.3.3 将 Serper 搜索升级为搜索策略工作台，支持普通客户搜索、官网 Contact 搜索、LinkedIn 决策人搜索、Google Maps 实体搜索、展会目录搜索和邮箱线索搜索。每种模式会生成 8-12 条搜索策略，展示 `label`、`query`、`purpose` 和 `strictness`。

当搜索没有候选结果时，页面会展示搜索收缩建议，例如从精准色母分销词放宽到 `masterbatch`、`color concentrate`、`plastic additives`、`resin distributor`、`plastic distributor`。页面也会记录最近搜索效果，只保存 query、模式、候选数量、预审数量、实际保存数量等统计，不保存 API Key，也不保存完整 Serper 原始响应。

你需要勾选候选结果，点击“把选中结果加入待确认录入”，再人工确认 `companyName`、`productKeyword`、`sourceUrl` 等字段。只有点击“确认保存到客户列表”后，候选结果才会写入 localStorage。

`email` 不允许猜，`country` 不允许猜；没有 `sourceUrl` 的客户不会保存。

## 如何使用海关数据反查进口商

进入 `/dashboard/customs`。当前模块不是直接查询付费海关数据库，也不会假装接入真实海关 API。你可以从自己购买或合法获取的海关数据平台导出 CSV 后导入。

页面支持 HS Code / 产品词搜索模板，用于查找海关数据入口或公开进口记录。模板只是搜索 query，不代表系统已经拿到海关数据。

CSV 导入会尽量识别不同平台字段，例如 importer、buyer、consignee、product_description、hs_code、shipment_date、quantity、source_url 等。系统会按最近采购记录、采购频率、采购量、HS Code 和产品描述做规则评分，生成 P0/P1/P2/P3 优先级。

海关线索必须人工确认后才能转为客户线索。缺少来源的海关线索可以导入为待补来源状态，但不能转为 Lead，除非用户补充 `sourceUrl`。系统不猜邮箱、不猜国家、不自动保存客户、不生成虚假海关记录。

## v0.4 AI 客户深度分析

在客户详情页可以点击“AI 分析客户”。系统会通过服务端 `/api/analyze-lead` 调用 OpenAI-compatible Chat Completions API，并把分析结果保存到本地 Lead。

AI 分析支持：

- 客户真实度判断
- 客户匹配度评分
- 推荐开发等级
- 推荐开发产品方向
- 第一封开发信切入角度
- 风险和缺失信息提示
- 下一步动作建议

AI 只能基于 Lead 已有真实字段分析，不得编造官网、邮箱、联系人、国家或采购记录。AI 分析结果只是建议，不自动发送邮件，不自动修改客户状态，不暴露 API Key。如果没有配置 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`，页面会显示“AI API 未配置”，不会崩溃。

## v0.5 客户开发动作台 / 跟进流程管理

进入 `/dashboard/followups` 可以使用本地 CRM 式客户开发动作台。

v0.5 支持：

- 客户开发状态管理
- 记录联系动作
- 安排下一次跟进
- 今日待跟进和逾期待跟进
- 客户动作时间线
- Lead 详情页直接操作
- Dashboard 跟进统计

本版本不自动发邮件，不接 Gmail API，不自动联系客户，也不根据 AI 建议自动修改客户状态。所有状态变化、联系记录和跟进任务都必须由用户点击明确动作按钮。系统不编造联系人、邮箱、电话或 WhatsApp，继续使用 localStorage，不引入数据库。

## v0.6 开发信草稿生成 / 多渠道开发话术

进入客户详情页，可以为已保存 Lead 生成并保存开发话术草稿。支持渠道：

- 第一封开发信
- 二次跟进邮件
- LinkedIn 私信
- WhatsApp 开场白
- 网站表单留言
- 已回复后沟通

草稿生成支持语言、语气、产品重点、我方公司简介、优势、案例参考和额外要求。AI 草稿通过服务端 `/api/generate-outreach-draft` 调用 OpenAI-compatible Chat Completions API，复用 `AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。

如果没有配置 AI API，页面会显示配置提示，不会崩溃。客户详情页也提供基础模板按钮，无 AI API 时可以生成基础草稿。基础模板只使用当前 Lead 已有字段，不编造联系人、邮箱、电话、WhatsApp、国家、采购记录或认证信息。

进入 `/dashboard/outreach` 可以查看：

- 有开发话术草稿的客户数量
- 草稿总数
- 各渠道草稿数量
- 已有草稿客户列表
- 待生成话术建议

v0.6 只生成、复制、保存草稿，不自动发送邮件，不调用 Gmail / LinkedIn / WhatsApp API，不自动联系客户，不自动修改客户状态。用户必须人工复制草稿并自行判断是否使用。

## 如何手动录入真实客户

进入 `/dashboard/leads`，点击“新增客户”。必填字段：

- `companyName`
- `productKeyword`
- `sourceUrl`

`email` 可以为空，不能猜测；`country` 可以为空，不能猜测。没有真实公开来源和证据的客户不应录入。

## 如何导出 CSV

进入 `/dashboard/export`，点击“导出 CSV”。导出的 CSV 包含所有 Lead 字段，数据来自当前浏览器的 localStorage。

## 如何导入 CSV

进入 `/dashboard/export`，选择 CSV 文件导入。导入时 `companyName`、`productKeyword`、`sourceUrl` 必填；如果失败，页面会提示具体失败行。

CSV 字段包含基础 Lead 字段、AI 分析摘要字段、跟进摘要字段和话术草稿摘要字段：

```text
id, companyName, website, domain, country, customerType, productKeyword, sourceUrl, sourceTitle, sourceSnippet, sourceType, evidenceText, email, phone, linkedinUrl, address, matchLevel, status, notes, fetchedAt, searchRunId, createdAt, updatedAt, aiFitScore, aiFitLevel, aiRecommendedDecision, aiSummary, aiOpeningAngle, aiNextAction, aiConfidence, aiAnalyzedAt, aiModel, pipelineStatus, lastContactedAt, nextFollowUpAt, followUpTaskCount, pendingFollowUpTaskCount, activityCount, outreachDraftCount, latestOutreachDraftAt, latestOutreachChannel, latestOutreachLanguage
```

## 实盘数据规则

- v0.6 不自动保存搜索结果
- 所有客户必须来自真实公开来源
- `sourceUrl` 必填
- `email` 不允许猜测
- `country` 不允许猜测
- 没有证据的客户不应录入
- 不允许 mock leads
- 不允许 seed fake data
- 所有客户数据只能来自用户手动录入或 CSV 导入
- Serper 搜索结果只能作为候选客户，不能自动保存
- Serper 候选预审只是规则初筛建议，不是最终判断
- 用户必须人工确认后才能保存客户
- 保存 Serper 候选客户时必须保留 `sourceUrl`、`sourceTitle`、`sourceSnippet`、`sourceType`、`fetchedAt`
- 搜索策略只生成真实搜索 query，不编造客户
- 搜索效果记录只基于真实搜索结果数量和用户操作，不允许假统计
- 海关数据模块不直接查询付费数据库，不假装接入真实海关 API
- 海关数据只能来自用户手动录入或 CSV 导入
- 不生成虚假海关记录
- AI 分析必须走服务端 API
- AI 不自动发送邮件
- AI 不自动修改客户状态
- AI 不编造邮箱、联系人、国家、采购记录
- 不暴露 API Key
- 客户开发动作必须由用户点击触发
- 不自动发邮件
- 不编造联系人、邮箱、电话、WhatsApp
- 开发话术草稿只基于 Lead 已有真实字段和用户输入生成
- 开发话术不自动发送、不自动联系客户、不自动修改客户状态
- 不接 Gmail API、LinkedIn API、WhatsApp API 或 SMTP 群发
- 不承诺未经验证的价格、交期、认证、代理权或合作历史

## 下一阶段计划

- 接 Supabase
- 接 SMTP 邮件
- 接 CRM 跟进
