# 塑料材料行业外贸客户开发工作台 v0.8

这是一个本地可运行的 B2B 外贸客户开发工作台，面向塑料材料行业。v0.8 用于辅助手动寻找真实海外客户、保存客户公开来源、按产品线生成买家搜索策略、把近期公开采购需求拆成求购情报任务、调用 Serper API 实时搜索候选客户、导入合法来源海关 CSV、对已保存 Lead 做服务端 AI 客户深度分析，管理本地客户开发跟进流程，并生成多渠道开发话术草稿。

当前版本不接数据库、不接邮箱群发，也不会自动保存搜索结果。Serper 搜索结果只能作为候选客户，必须由用户人工确认后才能保存。AI 和 Serper API Key 只在服务端读取，不会进入前端 bundle 或 localStorage。

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

进入 `/dashboard/serper`，选择产品线、目标国家、目标客户类型、搜索严格度和结果数量。页面会按产品线生成买家搜索策略，也支持你直接输入自定义搜索词，然后点击“调用 Serper 实时搜索”。

系统会调用服务端 `/api/serper-search`，从 Serper 返回 Google organic 结果，并过滤明显无关平台。返回结果只是候选客户，不会自动保存。

页面会展示搜索策略列表，每条都可以一键填入，或直接调用 Serper 搜索。v0.7 的搜索策略按产品线生成，不会把色母客户和 3D 打印耗材客户混在一起。

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

## v0.7 产品线感知买家搜索引擎

v0.7 将 Serper 搜索重构为 Product-aware Buyer Search Engine。

核心变化：

- 区分色母和 3D 打印耗材产品线
- 按产品线生成不同客户画像搜索词
- 色母重点找塑料制品厂、注塑厂、挤出厂、包装厂、PP 餐盒厂
- 3D 耗材重点找 3D 打印服务商、打印农场、快速原型公司、创客空间、学校实验室和渠道商
- 默认识别并隐藏同行/供应商结果
- 搜索放宽只在同一产品线内进行
- 候选结果增加客户角色分类
- 候选结果增加 `buyerFitScore` / `peerRiskScore`
- 保存同行/供应商结果前给人工警告
- 海关页面跳转 Serper 深挖时会带上产品线
- 不自动保存客户

色母产品线搜索不会放宽到 3D printing service、print farm、makerspace。3D 打印耗材产品线搜索不会放宽到 masterbatch、plastic injection molding、PP food container。

候选客户角色包括：

- 使用商
- 贸易商/分销商
- 同行/供应商
- 目录/平台
- 文章/内容
- 无关
- 未知

这些分类只是规则初筛，不替代人工打开官网确认。同行/供应商结果默认隐藏，但可以手动查看，也允许人工确认后保存。

## v0.7.1 需求信号搜索

进入 `/dashboard/demand` 可以使用 Buyer Intent Search。它不是普通客户搜索，而是搜索公开网页中已经暴露采购意图的线索，例如 RFQ、询价、找供应商、采购、招标、替代供应商、论坛求助等。

v0.7.1 支持：

- 寻找 RFQ / 询价 / 找供应商 / 采购 / 招标 / 替代供应商等公开需求信号
- 色母和 3D 耗材不同产品线的需求词
- 需求强度评分 `demandScore`
- 产品匹配评分 `productFitScore`
- 需求新鲜度 `freshnessScore`
- 买家匹配评分 `buyerFitScore`
- 同行风险评分 `peerRiskScore`
- 识别 RFQ 平台、B2B 平台、招标网站、论坛、公开社交内容、公司页面和目录页
- 默认隐藏同行、低质量和目录结果
- 人工确认后保存为 Lead

保存需求信号结果时，`Lead.sourceType` 会设为 `demand_signal_search`，证据文本会保留搜索词、需求类型、需求分数、产品匹配分、买家匹配分、证据词、原始标题、摘要和链接。

需求信号搜索不会自动保存客户，不会自动联系客户，不会自动发送邮件，不会编造需求、联系人、邮箱或电话。公开需求可能过期或来自平台页，必须人工打开来源核实。

## v0.7.2 需求信号搜索召回增强

v0.7.2 为需求信号搜索新增 strong / medium / broad 三层召回策略：

- strong：RFQ、request for quote、request quotation、looking for supplier、supplier needed 等强需求词，召回低但精准度高
- medium：sourcing、procurement、buying leads、buyer、importer、wholesale buyer、supplier wanted 等中需求词
- broad：buyers、importers、trade leads、purchase inquiry、sourcing agent、alternative supplier、new supplier 等广泛线索入口

同时新增 B2B 平台公开买家入口搜索，包括 go4worldbusiness、tradewheel、exporthub、tradeford、ec21、ecplaza、globalsources 等公开网页入口。平台结果不代表系统已经确认真实采购需求，必须人工打开原始页面核实发布日期、买家身份和有效期。

Broad 模式会少量增加西语、葡语、法语需求词，例如 `cotización`、`proveedor`、`cotação`、`fornecedor`、`devis`、`fournisseur`。多语言计划仍严格保留产品线，不会把色母和 3D 耗材混在一起。

页面会显示每条搜索计划的需求强度、预计召回和预计精准度，并支持按强需求、中需求、广泛线索和平台线索筛选。搜索结果较少时，页面会提供同产品线的放宽建议，不生成假结果。

## v0.7.3 全球搜索 / 目标国家可留空

v0.7.3 支持在 Serper 搜索、需求信号搜索和海关深挖搜索中留空目标国家。目标国家为空时，系统会生成不带国家的全球公开网页搜索词。

示例：

- 有国家：`"PLA filament" "looking for supplier" "United States"`
- 无国家：`"PLA filament" "looking for supplier"`

系统不会自动填 `Global`、`Worldwide`、`Unknown` 或默认国家。保存 Lead 时也不会猜国家；如果搜索时国家为空，`Lead.country` 保持为空。需求信号保存证据会记录 `Search scope: Global / no country filter`，有国家时记录具体搜索范围。

产品线隔离仍然有效：3D 耗材搜索不会混入色母、plastic colorant、injection molding；色母搜索不会混入 PLA filament、FDM、3D printing service。

## v0.7.4 贸易网站与论坛求购信息挖掘

v0.7.4 将需求信号搜索升级为来源平台优先的公开网页挖掘。系统仍然只调用 Serper 搜索公开网页，不接平台 API，不登录平台，不绕过验证码，不抓取付费或登录后内容。

支持来源频道：

- B2B RFQ 平台
- buying leads / trade leads 平台
- 招标 / 采购网站
- 论坛 / 社区
- 分类信息网站
- 公开社交帖子
- 本地区域网站

支持目标市场预设：

- 全球
- 俄罗斯
- 乌克兰
- 一带一路重点市场组合
- 中亚、东南亚、中东、非洲、拉美
- 自定义国家

一带一路重点市场组合是业务搜索预设，不是法律或官方完整名单，可手动调整。

v0.7.4 增加俄语、乌克兰语和区域本地需求词，例如 `купить`、`закупка`、`поставщик`、`тендер`、`купити`、`закупівля`、`постачальник`。页面支持 `site:` 平台站内搜索词，例如 Tradewheel、Go4WorldBusiness、ExportHub、B2BMap、EC21、ECPlaza、GlobalSources、zakupki.gov.ru、prozorro.gov.ua、smarttender.biz、Reddit、Quora 等公开入口。

保存需求信号 Lead 时，证据文本会记录来源频道、来源类型、目标市场预设、搜索词、需求分数、证据词、语言提示、原始标题、摘要、链接和搜索范围。系统不会自动保存客户，不会自动联系客户，也不会编造需求、联系人、邮箱、电话或国家。

## v0.7.5 近半年求购信息过滤

v0.7.5 将需求信号搜索默认限制为最近 6 个月，优先寻找仍可能有效的公开求购信息。页面支持切换：

- 最近 1 个月
- 最近 3 个月
- 最近 6 个月
- 最近 1 年
- 不限时间

系统会把时间范围传给 Serper / Google 搜索时间过滤参数，并在部分平台、招标和广泛召回搜索词中加入 `latest`、`recent`、`2026` 等日期提示词。时间过滤失败时，页面会提示用户尝试不限时间或调整搜索词，不会暴露 API Key。

每条需求候选会增加日期预审字段，包括 `freshnessScore`、检测到的日期文本、是否疑似近期、是否疑似过期和时间风险提示。缺少发布日期或有效期的结果默认不作为高优先线索；包含 2023-2019 等旧年份的结果会被标记为疑似过期并默认隐藏。

保存需求信号 Lead 时，证据文本会记录时间范围、Serper `tbs` 参数、freshness 分数、检测到的日期文本、近期/过期判断和时间风险提示。系统不会编造日期，不会把无日期结果伪装成近期需求；无日期或疑似过期的结果仍可人工保存，但保存前会再次提示必须打开来源核实。

## v0.8 求购情报作战台

v0.8 将 `/dashboard/demand` 从普通搜索结果页升级为 RFQ Intelligence Workbench，并新增买家平台优先搜索：系统先生成“情报任务”或“平台任务”，再由用户执行搜索、打开来源、按清单验证，最后才决定是否保存为 Lead。

支持任务类型：

- 近半年 RFQ / looking for supplier
- B2B buying leads / buyers 页面
- tender / procurement / deadline
- 论坛 / 社区公开求助
- 俄罗斯、乌克兰和区域市场本地语言搜索
- buyer / importer 目录入口复核
- 平台站内入口人工巡检

每个任务都会展示优先级 P0/P1/P2/P3、搜索词、预期结果、为什么值得搜、验证步骤、红旗风险、时效要求、保存标准和拒绝标准。任务检查记录只保存在本地 localStorage，可记录已检查、无有效线索、需要复查或过期。

Serper 搜索结果会继续做规则分类，并增加 `missionFitScore`、是否需要人工核实、人工核实原因和平台门槛警告。B2B 平台页面不会直接当成有效求购；如果需要登录、付费或验证码才能看到核心信息，只能标记为平台入口，不能当作已验证 RFQ。

保存 `demand_signal_search` Lead 前，确认表单会显示求购真实性验证清单，包括是否已打开原网页、是否明确求购/RFQ/采购/招标、是否不是供应商广告、是否不是旧页面、发布日期或有效期是否合理，以及系统不会编造联系人或邮箱。未完成验证仍可保存，但会二次提醒，并标记为 `unverified-demand-signal`。

v0.8 不登录平台、不绕过验证码、不抓取付费内容、不自动保存客户、不自动联系客户，也不编造求购信息、发布日期、联系人、邮箱、电话或国家。

### v0.8 买家平台优先搜索

买家平台优先搜索从买家采购路径出发，而不是只从“我卖什么”出发。系统会思考买家如果要采购色母或 3D 打印耗材，可能先去哪些平台找供应商、发 RFQ、比价、找本地经销商、查招标或问社区。

当前支持的平台方向包括：

- Alibaba、TradeWheel、Go4WorldBusiness、ExportHub、EC21、ECPlaza、TradeFord、GlobalSources、B2BMap、eWorldTrade 等 B2B / RFQ 平台
- Amazon Business、Amazon、Ozon、Wildberries、Prom.ua 等电商或企业采购平台
- B2B-Center、Zakupki、Roseltorg、Fabrikant、Prozorro、SmartTender 等招标采购平台
- Tiu、Avito、Allbiz 等区域 B2B / 分类平台
- Reddit、RepRap Forum、Prusa Forum、3DPrinting StackExchange、Quora 等论坛社区

平台任务会显示平台名、平台类型、用途、适合产品线、搜索词、为什么值得搜、结果代表什么、可能风险、是否可能需要登录、验证步骤、保存标准和拒绝标准。

系统会明确区分 RFQ 求购、buying leads、招标采购、电商渠道、竞品价格、论坛讨论和平台入口。电商平台结果不直接当作求购，只能作为价格、渠道、竞品或市场验证线索。需要登录、付费或验证码才能看到核心买家信息的平台，只能作为人工核实入口，不能直接视为有效求购。

保存买家平台候选 Lead 前，页面会根据平台类型提示风险：电商平台会提示“渠道/价格验证，不代表买家求购”；B2B RFQ 平台会提示可能需要登录或付费核实完整买家信息。

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

- v0.8 不自动保存搜索结果
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
- 产品线搜索放宽不得跨产品线
- 3D 打印耗材搜索不得放宽到色母下游客户
- 色母搜索不得放宽到 3D 打印服务客户
- 同行/供应商识别只是规则预审，保存前仍需人工确认
- 需求信号搜索不得编造采购需求或采购记录
- 需求信号结果必须人工确认后才能保存
- 保存需求信号 Lead 时不自动填邮箱、电话、联系人或 WhatsApp
- 保存需求信号 Lead 时不自动修改开发状态或邮件状态
- 需求信号 broad 结果不轻易标记为建议保存，必须人工核实
- 目标国家可留空；留空时不生成空引号、不写 Global/Worldwide、不猜国家
- 保存全球搜索线索时，证据文本必须记录搜索范围
- 贸易网站、论坛和招标搜索只处理公开搜索结果，不登录平台、不绕过验证码、不抓付费内容
- 需求信号默认按最近 6 个月过滤，过期或缺少日期的结果默认隐藏
- 系统不编造发布日期、有效期或当前采购需求
- 保存无日期或疑似过期需求信号前必须人工确认来源有效性
- 求购情报任务只是搜索与验证流程，不代表系统已确认真实 RFQ
- B2B 平台入口、buyers 页面和目录页必须人工打开核实后才能保存
- 需要登录、付费或验证码才能查看核心信息的结果不能直接视为有效求购
- 买家平台优先搜索只处理公开搜索结果，不登录平台、不绕过验证码、不抓付费内容
- 电商平台结果只能作为渠道、价格、竞品或市场验证线索，不直接当作求购
- 3D 打印耗材平台任务不得混入色母、plastic colorant、injection molding
- 色母平台任务不得混入 PLA filament、FDM、3D printing service

## 下一阶段计划

- 接 Supabase
- 接 SMTP 邮件
- 接 CRM 跟进
