import type {
  BuyerPlatformCategory,
  BuyerPlatformFit,
  BuyerPlatformMission,
  GenerateBuyerPlatformMissionsInput,
} from "@/types/buyer-platform";
import type { ProductLineId } from "@/types/search-intelligence";
import { BUYER_PLATFORMS } from "@/lib/buyer-platforms";

function priorityFor(category: BuyerPlatformCategory, fit: BuyerPlatformFit, requiresLoginLikely: boolean): BuyerPlatformMission["priority"] {
  if ((category === "global_b2b_rfq" || category === "tender_procurement") && fit === "high") return "P0";
  if (category === "tender_procurement" && fit === "medium") return "P0";
  if (category === "global_b2b_rfq" || category === "regional_b2b") return fit === "not_recommended" ? "P3" : "P1";
  if (category === "business_procurement" || category === "marketplace_ecommerce") return fit === "high" || fit === "medium" ? "P2" : "P3";
  if (category === "forum_community" || category === "industry_directory") return "P3";
  return requiresLoginLikely ? "P2" : "P3";
}

function fitText(fit: BuyerPlatformFit): string {
  if (fit === "high") return "高度匹配";
  if (fit === "medium") return "中等匹配";
  if (fit === "low") return "低匹配，只适合验证";
  return "不推荐作为重点搜索";
}

function platformTag(category: BuyerPlatformCategory): string {
  if (category === "global_b2b_rfq") return "rfq-platform";
  if (category === "tender_procurement") return "tender-platform";
  if (category === "forum_community") return "forum-signal";
  if (category === "marketplace_ecommerce" || category === "business_procurement") return "marketplace-channel";
  return "buyer-platform";
}

function defaultVerificationSteps(category: BuyerPlatformCategory, requiresLoginLikely: boolean): string[] {
  const steps = [
    "打开平台公开搜索结果或原始页面",
    "确认结果是否与当前产品线一致",
    "确认页面类型：RFQ、buying lead、招标、电商商品、目录或论坛讨论",
    "确认发布日期、截止日期或页面是否仍有效",
    "确认不是供应商广告、SEO目录或旧页面",
  ];
  if (category === "marketplace_ecommerce" || category === "business_procurement") {
    steps.push("只把电商结果作为价格、渠道或竞品验证，不当成买家求购");
  }
  if (requiresLoginLikely) {
    steps.push("如果需要登录、付费或验证码才能看到买家信息，只标记为人工核实入口");
  }
  return steps;
}

function defaultSaveCriteria(category: BuyerPlatformCategory): string[] {
  if (category === "marketplace_ecommerce" || category === "business_procurement") {
    return [
      "仅保存为渠道/市场验证线索，而不是求购客户",
      "有公开来源链接、商品/渠道证据和可核实的公司或店铺信息",
      "不猜邮箱、联系人、电话或国家",
    ];
  }
  if (category === "tender_procurement") {
    return [
      "原网页显示招标/采购公告、发布日期或截止日期",
      "产品与当前产品线匹配",
      "采购方或招标方信息可在公开页面核实",
    ];
  }
  return [
    "原网页显示 RFQ、buying request、buyer 或 looking for supplier 证据",
    "能看到时间、买家身份或平台买家入口",
    "产品与当前产品线匹配，且不是供应商广告",
  ];
}

function defaultRejectCriteria(category: BuyerPlatformCategory): string[] {
  const criteria = [
    "命中另一产品线",
    "只是供应商广告或目录，没有买家/需求证据",
    "发布日期过旧或无法核实有效期",
  ];
  if (category === "marketplace_ecommerce" || category === "business_procurement") {
    criteria.push("把商品页误判为求购客户");
  }
  criteria.push("需要登录、付费或验证码才能看到核心需求，且无法公开验证");
  return criteria;
}

function matchesMarket(platformMarkets: string[], selectedMarket: string): boolean {
  return platformMarkets.includes(selectedMarket) || platformMarkets.includes("global") || selectedMarket === "custom";
}

function strictnessAllows(productLineId: ProductLineId, fit: BuyerPlatformFit, strictness: string): boolean {
  if (productLineId === "custom") return true;
  if (strictness === "strict") return fit === "high" || fit === "medium";
  if (strictness === "balanced") return fit !== "not_recommended";
  return true;
}

export function generateBuyerPlatformMissions(input: GenerateBuyerPlatformMissionsInput): BuyerPlatformMission[] {
  const productLineId = input.productLineId === "custom" ? "filament" : input.productLineId;
  const missions = BUYER_PLATFORMS.flatMap((platform) => {
    const fit = platform.productLineFit[productLineId];
    if (!matchesMarket(platform.marketPresets, input.targetMarketPresetId)) return [];
    if (input.platformCategory && input.platformCategory !== "all" && platform.category !== input.platformCategory) return [];
    if (!strictnessAllows(productLineId, fit, input.strictness)) return [];

    return platform.searchTemplates
      .filter((template) => template.productLineId === productLineId)
      .filter((template) => !input.useCase || input.useCase === "all" || template.useCase === input.useCase)
      .slice(0, input.strictness === "broad" ? 3 : 2)
      .map((template) => {
        const priority = priorityFor(platform.category, fit, platform.requiresLoginLikely);
        const marketplace = platform.category === "marketplace_ecommerce" || platform.category === "business_procurement";
        const searchQuery = input.freshnessWindow === "anytime" || marketplace
          ? template.queryTemplate
          : `${template.queryTemplate} "2026"`;
        return {
          id: `${platform.id}-${template.productLineId}-${template.useCase}-${template.label}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          platformId: platform.id,
          platformName: platform.name,
          platformCategory: platform.category,
          useCase: template.useCase,
          priority,
          productLineId: input.productLineId,
          targetMarketPresetId: input.targetMarketPresetId,
          searchQuery,
          expectedResult: template.expectedResult,
          resultMeaning: platform.resultMeaning,
          manualVerificationRequired: platform.requiresManualVerification,
          requiresLoginLikely: platform.requiresLoginLikely,
          whyThisPlatform: `${platform.name} 适合 ${platform.bestUseCases.join(", ")}；当前产品线匹配度：${fitText(fit)}。`,
          verificationSteps: defaultVerificationSteps(platform.category, platform.requiresLoginLikely),
          redFlags: platform.riskNotes,
          saveCriteria: defaultSaveCriteria(platform.category),
          rejectCriteria: defaultRejectCriteria(platform.category),
          tags: [
            "buyer-platform",
            `platform-${platform.id}`,
            `usecase-${template.useCase}`,
            platformTag(platform.category),
            `category-${platform.category}`,
          ],
        } satisfies BuyerPlatformMission;
      });
  });

  const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return missions.sort((a, b) => order[a.priority] - order[b.priority] || a.platformName.localeCompare(b.platformName));
}
