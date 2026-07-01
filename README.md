# 塑料材料行业外贸客户开发工作台 v0.3.1

这是一个本地可运行的 B2B 外贸客户开发工作台，面向塑料材料行业。v0.3.1 用于辅助手动寻找真实海外客户、保存客户公开来源、生成搜索词、调用 Serper API 实时搜索候选客户，并生成可以复制给 ChatGPT 的客户分析 Prompt 和英文开发信 Prompt。

当前版本不接数据库、不接 AI API、不接邮箱群发，也不会自动保存搜索结果。Serper 搜索结果只能作为候选客户，必须由用户人工确认后才能保存。

## 如何安装依赖

```bash
npm install
```

## 如何配置 Serper API Key

先到 [Serper](https://serper.dev/) 注册账号并申请 API Key。

在本地创建 `.env.local`：

```bash
SERPER_API_KEY=自己的 Serper API Key
```

不要提交 `.env.local`。项目只会在服务端 API Route 中读取 `SERPER_API_KEY`，不会把 API Key 保存到浏览器 localStorage，也不会写入前端代码。

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

页面会展示 10 条推荐搜索词，每条都可以一键填入，或直接调用 Serper 搜索。页面也提供实盘测试词，例如 `plastic distributor United States`、`plastic resin distributor United States`、`masterbatch distributor United States`。

每次搜索后，页面会显示本次实际搜索词，以及 `rawOrganicCount`、`candidateCount`、`filteredOutCount`，方便判断是搜索词太窄，还是结果被明显无关平台过滤。

你需要勾选候选结果，点击“把选中结果加入待确认录入”，再人工确认 `companyName`、`productKeyword`、`sourceUrl` 等字段。只有点击“确认保存到客户列表”后，候选结果才会写入 localStorage。

`email` 不允许猜，`country` 不允许猜；没有 `sourceUrl` 的客户不会保存。

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

CSV 字段包含：

```text
id, companyName, website, domain, country, customerType, productKeyword, sourceUrl, sourceTitle, sourceSnippet, sourceType, evidenceText, email, phone, linkedinUrl, address, matchLevel, status, notes, fetchedAt, createdAt, updatedAt
```

## 实盘数据规则

- v0.3.1 不自动保存搜索结果
- 所有客户必须来自真实公开来源
- `sourceUrl` 必填
- `email` 不允许猜测
- `country` 不允许猜测
- 没有证据的客户不应录入
- 不允许 mock leads
- 不允许 seed fake data
- 所有客户数据只能来自用户手动录入或 CSV 导入
- Serper 搜索结果只能作为候选客户，不能自动保存
- 用户必须人工确认后才能保存客户
- 保存 Serper 候选客户时必须保留 `sourceUrl`、`sourceTitle`、`sourceSnippet`、`sourceType`、`fetchedAt`

## 下一阶段计划

- 接 Supabase
- 接 AI API
- 接 SMTP 邮件
- 接 CRM 跟进
