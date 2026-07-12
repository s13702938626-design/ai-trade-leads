export type SearchMode =
  | "general_customer"
  | "contact_page"
  | "linkedin_people"
  | "google_maps"
  | "trade_show"
  | "email_clue";

export type SearchStrategyQuery = {
  id: string;
  mode: SearchMode;
  label: string;
  query: string;
  purpose: string;
  strictness: "narrow" | "medium" | "broad";
};

type BuildSearchStrategyQueriesInput = {
  productKeyword: string;
  country: string;
  customerType: string;
  mode: SearchMode;
};

export const SEARCH_MODES: { key: SearchMode; label: string; description: string }[] = [
  {
    key: "general_customer",
    label: "普通客户搜索",
    description: "找进口商、分销商、批发商、制造商。",
  },
  {
    key: "contact_page",
    label: "官网 Contact 搜索",
    description: "优先找 contact us、about us、products 页面。",
  },
  {
    key: "linkedin_people",
    label: "LinkedIn 决策人搜索",
    description: "使用 Google dork 搜 LinkedIn 公开页面，不调用 LinkedIn API。",
  },
  {
    key: "google_maps",
    label: "Google Maps 实体搜索",
    description: "用 site:google.com/maps 搜实体公司，不调用 Google Maps API。",
  },
  {
    key: "trade_show",
    label: "展会目录搜索",
    description: "搜索 exhibitor list、exhibitor directory、trade show、expo 等公开目录。",
  },
  {
    key: "email_clue",
    label: "邮箱线索搜索",
    description: "搜索公开网页中的 email/contact/procurement 线索，不猜邮箱。",
  },
];

function q(value: string): string {
  return `"${value.trim()}"`;
}

function optionalCountryTerm(value: string): string {
  const country = value.trim();
  return country ? q(country) : "";
}

function makeQuery(
  mode: SearchMode,
  index: number,
  label: string,
  query: string,
  purpose: string,
  strictness: SearchStrategyQuery["strictness"],
): SearchStrategyQuery {
  return {
    id: `${mode}-${index + 1}`,
    mode,
    label,
    query: query.replace(/\s+/g, " ").trim(),
    purpose,
    strictness,
  };
}

export function buildSearchStrategyQueries({
  productKeyword,
  country,
  customerType,
  mode,
}: BuildSearchStrategyQueriesInput): SearchStrategyQuery[] {
  const product = productKeyword.trim();
  const targetCountry = country.trim();
  const countryTerm = optionalCountryTerm(targetCountry);
  const type = customerType.trim();

  const templates: Record<SearchMode, Omit<SearchStrategyQuery, "id" | "mode">[]> = {
    general_customer: [
      { label: "精准组合", query: `${q(product)} ${q(type)} ${countryTerm}`, purpose: "按当前产品、客户类型、国家精准搜索", strictness: "narrow" },
      { label: "分销商", query: `${q(product)} distributor ${countryTerm}`, purpose: "寻找分销商客户", strictness: "medium" },
      { label: "进口商", query: `${q(product)} importer ${countryTerm}`, purpose: "寻找进口商客户", strictness: "medium" },
      { label: "批发商", query: `${q(product)} wholesaler ${countryTerm}`, purpose: "寻找批发商客户", strictness: "medium" },
      { label: "供应商", query: `${q(product)} supplier ${countryTerm}`, purpose: "寻找供应链相关公司", strictness: "broad" },
      { label: "制造商", query: `${q(product)} manufacturer ${countryTerm}`, purpose: "寻找生产型客户", strictness: "medium" },
      { label: "塑料制品", query: `${q(product)} "plastic products" ${countryTerm}`, purpose: "扩展到下游塑料制品公司", strictness: "broad" },
      { label: "树脂分销", query: `${q(product)} "resin distributor" ${countryTerm}`, purpose: "寻找塑料原料分销渠道", strictness: "medium" },
      { label: "聚合物分销", query: `${q(product)} "polymer distributor" ${countryTerm}`, purpose: "寻找聚合物材料渠道", strictness: "medium" },
      { label: "塑料材料", query: `"plastic materials supplier" ${countryTerm} ${product}`, purpose: "用材料供应商宽泛词补充搜索", strictness: "broad" },
    ],
    contact_page: [
      { label: "Contact us", query: `${q(product)} ${countryTerm} "contact us"`, purpose: "找公司联系页面", strictness: "medium" },
      { label: "About us", query: `${q(product)} ${countryTerm} "about us"`, purpose: "找公司介绍页面", strictness: "medium" },
      { label: "Products", query: `${q(product)} ${countryTerm} "products"`, purpose: "找产品页面确认业务", strictness: "medium" },
      { label: "RFQ", query: `${q(product)} ${countryTerm} "request a quote"`, purpose: "找有询价入口的公司页面", strictness: "narrow" },
      { label: ".com Contact", query: `site:.com ${q(product)} "contact us"`, purpose: "优先找 .com 公司联系页", strictness: "broad" },
      { label: ".com About", query: `site:.com ${q(product)} "about us"`, purpose: "优先找 .com 公司介绍页", strictness: "broad" },
      { label: "Product catalog", query: `${q(product)} ${countryTerm} "catalog" "contact"`, purpose: "找产品目录和联系方式", strictness: "medium" },
      { label: "Capabilities", query: `${q(product)} ${countryTerm} "capabilities"`, purpose: "找制造能力页面", strictness: "medium" },
    ],
    linkedin_people: [
      { label: "Procurement", query: `site:linkedin.com/in "procurement" ${q(product)} ${countryTerm}`, purpose: "找公开 LinkedIn 采购相关人员", strictness: "narrow" },
      { label: "Purchasing manager", query: `site:linkedin.com/in "purchasing manager" ${q(product)} ${countryTerm}`, purpose: "找采购经理公开页面", strictness: "narrow" },
      { label: "Sourcing manager", query: `site:linkedin.com/in "sourcing manager" ${q(product)} ${countryTerm}`, purpose: "找寻源经理公开页面", strictness: "narrow" },
      { label: "Product manager", query: `site:linkedin.com/in "product manager" "plastic" ${countryTerm}`, purpose: "找塑料相关产品经理", strictness: "medium" },
      { label: "Supply chain", query: `site:linkedin.com/in "supply chain" "plastic" ${countryTerm}`, purpose: "找供应链相关人员", strictness: "medium" },
      { label: "CEO distributor", query: `site:linkedin.com/in "CEO" "plastic distributor" ${countryTerm}`, purpose: "找分销商管理层公开页面", strictness: "medium" },
      { label: "Buyer", query: `site:linkedin.com/in "buyer" "plastic" ${countryTerm}`, purpose: "找买手或采购公开页面", strictness: "medium" },
      { label: "Operations", query: `site:linkedin.com/in "operations manager" "plastic" ${countryTerm}`, purpose: "找运营负责人公开页面", strictness: "broad" },
    ],
    google_maps: [
      { label: "产品 Maps", query: `site:google.com/maps ${q(product)} ${countryTerm}`, purpose: "用 Google Maps 公开页找实体公司", strictness: "medium" },
      { label: "塑料分销 Maps", query: `site:google.com/maps "plastic distributor" ${countryTerm}`, purpose: "找塑料分销实体", strictness: "medium" },
      { label: "塑料供应 Maps", query: `site:google.com/maps "plastic supplier" ${countryTerm}`, purpose: "找塑料供应商实体", strictness: "broad" },
      { label: "树脂分销 Maps", query: `site:google.com/maps "resin distributor" ${countryTerm}`, purpose: "找树脂分销实体", strictness: "medium" },
      { label: "注塑 Maps", query: `site:google.com/maps "injection molding" ${countryTerm}`, purpose: "找注塑工厂实体", strictness: "broad" },
      { label: "包装 Maps", query: `site:google.com/maps "plastic packaging" ${countryTerm}`, purpose: "找塑料包装实体", strictness: "broad" },
      { label: "Compound Maps", query: `site:google.com/maps "plastic compound" ${countryTerm}`, purpose: "找配混或改性塑料实体", strictness: "medium" },
      { label: "Filament Maps", query: `site:google.com/maps "3D printer filament" ${countryTerm}`, purpose: "找 3D 打印耗材实体", strictness: "medium" },
    ],
    trade_show: [
      { label: "Trade show", query: `${q(product)} "trade show" ${countryTerm}`, purpose: "找产品相关展会线索", strictness: "medium" },
      { label: "Exhibitor list", query: `${q(product)} "exhibitor list"`, purpose: "找展商列表", strictness: "medium" },
      { label: "Exhibitor directory", query: `${q(product)} "exhibitor directory"`, purpose: "找展商目录", strictness: "medium" },
      { label: "Plastic exhibitors", query: `"plastic" "exhibitor list" ${countryTerm}`, purpose: "找塑料行业展商列表", strictness: "broad" },
      { label: "Plastics expo", query: `"plastics expo" ${countryTerm} exhibitors`, purpose: "找塑料展参展商", strictness: "broad" },
      { label: "Packaging exhibition", query: `"packaging exhibition" ${countryTerm} exhibitors`, purpose: "找包装展参展商", strictness: "broad" },
      { label: "3D printing expo", query: `"3D printing expo" exhibitors ${countryTerm}`, purpose: "找 3D 打印展参展商", strictness: "broad" },
      { label: "Conference directory", query: `${q(product)} "conference" "exhibitors" ${countryTerm}`, purpose: "找会议展商公开目录", strictness: "medium" },
    ],
    email_clue: [
      { label: "Email", query: `${q(product)} ${countryTerm} "email"`, purpose: "搜索公开邮箱线索", strictness: "medium" },
      { label: "Contact", query: `${q(product)} ${countryTerm} "contact"`, purpose: "搜索公开联系信息", strictness: "medium" },
      { label: "Procurement", query: `${q(product)} ${countryTerm} "procurement"`, purpose: "搜索采购相关公开页面", strictness: "narrow" },
      { label: "sales@", query: `${q(product)} ${countryTerm} "sales@"`, purpose: "搜索公开 sales 邮箱文本", strictness: "narrow" },
      { label: "info@", query: `${q(product)} ${countryTerm} "info@"`, purpose: "搜索公开 info 邮箱文本", strictness: "narrow" },
      { label: "contact@", query: `${q(product)} ${countryTerm} "contact@"`, purpose: "搜索公开 contact 邮箱文本", strictness: "narrow" },
      { label: "@", query: `${q(product)} ${countryTerm} "@"`, purpose: "搜索网页公开邮箱符号线索", strictness: "broad" },
      { label: "Purchasing", query: `${q(product)} ${countryTerm} "purchasing"`, purpose: "搜索采购相关公开联系线索", strictness: "medium" },
    ],
  };

  return templates[mode].map((template, index) =>
    makeQuery(mode, index, template.label, template.query, template.purpose, template.strictness),
  );
}
