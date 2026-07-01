# 塑料材料行业外贸客户开发工作台 v0.1

这是一个本地可运行的 B2B 外贸客户开发工作台，面向塑料材料行业。v0.1 用于辅助手动寻找真实海外客户、保存客户公开来源、生成搜索词，并生成可以复制给 ChatGPT 的客户分析 Prompt 和英文开发信 Prompt。

当前版本不接数据库、不接外部 API、不接 AI API、不接邮箱群发，也不自动抓取客户。

## 如何安装依赖

```bash
npm install
```

## 如何本地启动

```bash
npm run dev
```

然后打开终端提示的本地地址，通常是 `http://localhost:3000`。

## 如何使用搜索页找客户

进入 `/dashboard/search`，选择行业方向、目标国家和客户类型。系统会生成 10 条搜索语句，每条都可以复制，也可以直接打开 Google 或 Bing 搜索。

搜索页只生成搜索语句，不展示客户、不抓取客户、不创建客户。

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
id, companyName, website, domain, country, customerType, productKeyword, sourceUrl, sourceTitle, sourceSnippet, sourceType, evidenceText, email, phone, linkedinUrl, address, matchLevel, status, notes, createdAt, updatedAt
```

## 实盘数据规则

- v0.1 不自动抓取客户
- 所有客户必须来自真实公开来源
- `sourceUrl` 必填
- `email` 不允许猜测
- `country` 不允许猜测
- 没有证据的客户不应录入
- 不允许 mock leads
- 不允许 seed fake data
- 所有客户数据只能来自用户手动录入或 CSV 导入

## 下一阶段计划

- 接 Serper API
- 接 Supabase
- 接 AI API
- 接 SMTP 邮件
- 接 CRM 跟进
