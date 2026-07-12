import type {
  DemandFreshnessWindow,
  DemandSourceChannel,
  RfqIntelMission,
  RfqIntelMissionPriority,
  RfqIntelMissionType,
} from "@/types/demand-intelligence";
import type { ProductLineId, SearchStrictness } from "@/types/search-intelligence";
import { PRODUCT_LINES } from "@/lib/product-lines";
import { TARGET_MARKET_PRESETS, type TargetMarketPresetId } from "@/lib/target-market-presets";

type GenerateRfqIntelMissionsInput = {
  productLineId: ProductLineId;
  targetMarketPresetId: TargetMarketPresetId;
  sourceChannel: DemandSourceChannel;
  freshnessWindow: DemandFreshnessWindow;
  strictness: SearchStrictness;
  customProductKeyword?: string;
};

const FRESHNESS_LABELS: Record<DemandFreshnessWindow, string> = {
  past_month: "必须优先核实最近 1 个月内发布或仍有效的求购信息",
  past_3_months: "必须优先核实最近 3 个月内发布或仍有效的求购信息",
  past_6_months: "必须优先核实最近 6 个月内发布或仍有效的求购信息",
  past_year: "必须优先核实最近 1 年内发布或仍有效的求购信息",
  anytime: "不限时间，但保存前仍必须人工确认发布日期、有效期和需求是否仍然存在",
};

function quote(value: string): string {
  return `"${value.trim()}"`;
}

function productTerms(productLineId: ProductLineId, customProductKeyword?: string): string[] {
  if (productLineId === "custom") {
    const value = customProductKeyword?.trim();
    return value ? [value] : ["plastic materials"];
  }
  return PRODUCT_LINES[productLineId].userSells.slice(0, 4);
}

function marketTerms(targetMarketPresetId: TargetMarketPresetId): string[] {
  const preset = TARGET_MARKET_PRESETS[targetMarketPresetId];
  return preset.searchCountryTerms.length > 0 ? preset.searchCountryTerms.slice(0, 3) : [];
}

function appendMarket(query: string, targetMarketPresetId: TargetMarketPresetId): string {
  const terms = marketTerms(targetMarketPresetId);
  return terms.length > 0 ? `${query} ${terms.map(quote).join(" ")}` : query;
}

function sourceMatches(selected: DemandSourceChannel, missionSource: DemandSourceChannel): boolean {
  return selected === "all_sources" || selected === missionSource;
}

function strictnessNote(strictness: SearchStrictness): string {
  if (strictness === "strict") return "只保存证据非常明确的单条求购/RFQ结果。";
  if (strictness === "broad") return "可接受更多入口页，但必须人工打开核实具体求购。";
  return "优先保存明确求购，平台入口只作为进一步核实任务。";
}

function buildQuery(product: string, terms: string[], targetMarketPresetId: TargetMarketPresetId): string {
  return appendMarket([quote(product), ...terms.map(quote)].join(" "), targetMarketPresetId).replace(/\s+/g, " ").trim();
}

function baseVerificationSteps(): string[] {
  return [
    "打开原始网页，确认不是搜索摘要误判",
    "核实发布日期、截止日期或有效期是否符合时间范围",
    "确认页面明确表达 RFQ、求购、采购、招标或找供应商",
    "确认能看到买家、公司、采购方或平台买家身份线索",
    "确认产品词与当前产品线一致，未混入另一产品线",
    "确认不是供应商广告、目录页或旧的 SEO 页面",
  ];
}

function commonSaveCriteria(): string[] {
  return [
    "有真实来源链接，且原网页可以打开",
    "有明确产品词、求购意图和时间证据",
    "不是供应商广告、同行页面或泛目录",
    "保存时不猜邮箱、电话、联系人或国家",
  ];
}

function commonRejectCriteria(): string[] {
  return [
    "需要登录、付费或绕过验证码才能看到核心信息",
    "没有发布日期或有效期，且无法人工确认是否仍有效",
    "明显是供应商/制造商广告或卖家目录",
    "命中另一产品线，和当前产品线不匹配",
  ];
}

function makeMission(input: {
  productLineId: ProductLineId;
  targetMarketPresetId: TargetMarketPresetId;
  sourceChannel: DemandSourceChannel;
  freshnessWindow: DemandFreshnessWindow;
  priority: RfqIntelMissionPriority;
  missionType: RfqIntelMissionType;
  title: string;
  searchQuery: string;
  expectedResult: string;
  whyThisMatters: string;
  verificationSteps?: string[];
  redFlags?: string[];
  saveCriteria?: string[];
  rejectCriteria?: string[];
  languageHints?: string[];
  sourceDomains?: string[];
  searchUrlHint?: string;
}): RfqIntelMission {
  return {
    id: [
      input.productLineId,
      input.targetMarketPresetId,
      input.sourceChannel,
      input.missionType,
      input.priority,
      input.searchQuery,
    ].join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    missionType: input.missionType,
    priority: input.priority,
    productLineId: input.productLineId,
    targetMarketPresetId: input.targetMarketPresetId,
    sourceChannel: input.sourceChannel,
    title: input.title,
    searchQuery: input.searchQuery,
    searchUrlHint: input.searchUrlHint,
    expectedResult: input.expectedResult,
    whyThisMatters: input.whyThisMatters,
    verificationSteps: input.verificationSteps ?? baseVerificationSteps(),
    redFlags: input.redFlags ?? [
      "页面只是供应商列表或买家目录，没有单条采购需求",
      "发布日期过旧或没有有效期",
      "页面要求登录/付费后才显示买家或需求详情",
      "产品词属于另一产品线",
    ],
    freshnessRequirement: FRESHNESS_LABELS[input.freshnessWindow],
    saveCriteria: input.saveCriteria ?? commonSaveCriteria(),
    rejectCriteria: input.rejectCriteria ?? commonRejectCriteria(),
    languageHints: input.languageHints ?? TARGET_MARKET_PRESETS[input.targetMarketPresetId].languageHints,
    sourceDomains: input.sourceDomains ?? [],
  };
}

export function generateRfqIntelMissions(input: GenerateRfqIntelMissionsInput): RfqIntelMission[] {
  const products = productTerms(input.productLineId, input.customProductKeyword);
  const primaryProduct = products[0];
  const preset = TARGET_MARKET_PRESETS[input.targetMarketPresetId];
  const localDemandTerm = preset.localDemandTerms[0] ?? "supplier";
  const localB2BSite = preset.localB2BSites[0] ?? "site:go4worldbusiness.com";
  const missions: RfqIntelMission[] = [
    makeMission({
      ...input,
      sourceChannel: "b2b_rfq_platforms",
      priority: "P0",
      missionType: "fresh_rfq",
      title: "近半年明确 RFQ / looking for supplier 情报",
      searchQuery: buildQuery(primaryProduct, ["RFQ", "looking for supplier", "2026"], input.targetMarketPresetId),
      expectedResult: "单条 RFQ、request for quote、looking for supplier 或明确采购请求页面。",
      whyThisMatters: "P0 任务优先寻找已经公开表达采购意图且可能仍有效的线索。",
      sourceDomains: ["go4worldbusiness.com", "tradewheel.com", "exporthub.com", "tradeford.com"],
    }),
    makeMission({
      ...input,
      sourceChannel: "trade_leads_platforms",
      priority: "P1",
      missionType: "platform_buying_leads",
      title: "B2B buying leads / buyers 页面人工核实",
      searchQuery: buildQuery(primaryProduct, ["buying leads", "buyers", "latest"], input.targetMarketPresetId),
      expectedResult: "平台上的 buyers、buying leads、purchase inquiry 入口，可能需要点开核实单条需求。",
      whyThisMatters: "很多真实买家线索藏在平台入口页，不能直接保存，但适合作为人工验证任务。",
      verificationSteps: [
        ...baseVerificationSteps(),
        "确认平台页中至少能看到单条买家需求、日期或有效期",
        "如果核心买家信息需要登录或付费，标记为平台入口，不当成有效求购",
      ],
      sourceDomains: ["go4worldbusiness.com", "tradewheel.com", "b2bmap.com", "ec21.com", "ecplaza.net"],
    }),
    makeMission({
      ...input,
      sourceChannel: "tender_procurement",
      priority: "P0",
      missionType: "tender_procurement",
      title: "招标 / procurement / deadline 情报",
      searchQuery: buildQuery(primaryProduct, ["tender", "procurement", "deadline"], input.targetMarketPresetId),
      expectedResult: "公开招标、采购公告、采购门户、带截止日期的采购项目。",
      whyThisMatters: "招标类信息通常有明确采购方和截止日期，适合优先核实。",
      verificationSteps: [
        ...baseVerificationSteps(),
        "核实招标资质、交付地、付款条款和是否允许海外供应商参与",
      ],
      redFlags: [
        "公告已经截止",
        "只允许本地注册供应商投标",
        "需要付费招标文件且无法确认核心采购内容",
        "产品规格不属于当前产品线",
      ],
      sourceDomains: preset.localTenderSites,
    }),
    makeMission({
      ...input,
      sourceChannel: "forums_communities",
      priority: "P2",
      missionType: "forum_request",
      title: "论坛 / 社区公开求助情报",
      searchQuery: buildQuery(primaryProduct, ["where to buy", "bulk", "supplier"], input.targetMarketPresetId),
      expectedResult: "论坛、社区或问答页面中有人询问供应商、批量购买或替代供应来源。",
      whyThisMatters: "论坛线索可能暴露真实需求痛点，但买家身份通常不完整，需要人工核实。",
      verificationSteps: [
        ...baseVerificationSteps(),
        "确认发帖人是否代表公司或可识别业务主体",
        "确认不是个人零售问题或技术闲聊",
      ],
      sourceDomains: ["reddit.com", "quora.com", "reprap.org", "forum.prusa3d.com"],
    }),
    makeMission({
      ...input,
      sourceChannel: "regional_local_sites",
      priority: input.targetMarketPresetId === "global" ? "P2" : "P1",
      missionType: "local_language_search",
      title: "本地语言采购线索搜索",
      searchQuery: buildQuery(primaryProduct, [localDemandTerm, "2026"], input.targetMarketPresetId),
      expectedResult: "俄罗斯、乌克兰或区域本地语言中的采购、供应商、招标或批发求助页面。",
      whyThisMatters: "本地语言搜索能避开英文关键词竞争，更适合发现区域市场真实采购入口。",
      sourceDomains: [...preset.localB2BSites, ...preset.localTenderSites],
    }),
    makeMission({
      ...input,
      sourceChannel: "trade_leads_platforms",
      priority: "P3",
      missionType: "buyer_directory_entry",
      title: "买家 / importers 目录入口复核",
      searchQuery: buildQuery(primaryProduct, ["importers", "buyers", "purchase manager"], input.targetMarketPresetId),
      expectedResult: "买家目录、importers 页面或采购经理入口，只作为进一步人工核实。",
      whyThisMatters: "目录页可能找到公司名单，但不等于近期求购，不能直接保存为有效 RFQ。",
      redFlags: [
        "只是 top suppliers / companies list / directory",
        "没有单条需求、发布日期或买家身份",
        "页面主要展示供应商广告",
      ],
      saveCriteria: [
        "只有点开后找到真实公司官网或公开采购页，才可作为 Lead 来源",
        "必须补充 sourceUrl 和 evidenceText 说明来源证据",
      ],
      sourceDomains: ["kompass.com", "europages.com", "go4worldbusiness.com"],
    }),
    makeMission({
      ...input,
      sourceChannel: "b2b_rfq_platforms",
      priority: "P3",
      missionType: "manual_platform_check",
      title: "平台站内入口人工巡检",
      searchQuery: `${localB2BSite} ${quote(primaryProduct)} "buy" "latest"`,
      searchUrlHint: localB2BSite,
      expectedResult: "公开平台站内搜索入口、买家入口或 RFQ 列表页。",
      whyThisMatters: "部分平台不会把单条需求完整暴露给搜索引擎，只能把入口作为人工巡检任务。",
      verificationSteps: [
        "打开平台入口页面",
        "确认是否能在公开页面看到单条需求、发布日期和产品信息",
        "如果需要登录、付费、验证码或联系信息隐藏，不保存为有效求购",
      ],
      redFlags: [
        "必须登录或付费才看到采购信息",
        "只能看到平台营销页或供应商列表",
        "无法确认发布时间或有效期",
      ],
      sourceDomains: [localB2BSite],
    }),
  ];

  const filtered = missions.filter((mission) => sourceMatches(input.sourceChannel, mission.sourceChannel));
  return filtered.map((mission) => ({
    ...mission,
    whyThisMatters: `${mission.whyThisMatters} ${strictnessNote(input.strictness)}`,
  }));
}
