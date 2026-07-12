import { NextResponse } from "next/server";
import type { SerperSearchCandidate } from "@/types/search";
import type { DemandFreshnessWindow, DemandIntentType, DemandSearchPlan } from "@/types/demand-intelligence";
import type { ProductLineId, SearchQueryPlan } from "@/types/search-intelligence";
import type { BuyerPlatformMission } from "@/types/buyer-platform";
import { reviewCandidate } from "@/lib/candidate-review";
import { classifyCandidateResult } from "@/lib/candidate-classifier";
import { classifyDemandSignal } from "@/lib/demand-signal-classifier";
import { getDomainFromSearchLink, isLowQualitySearchResult } from "@/lib/search-result-filters";

type SerperSearchRequest = {
  query?: unknown;
  country?: unknown;
  productKeyword?: unknown;
  customerType?: unknown;
  productLineId?: unknown;
  searchPlan?: unknown;
  searchMode?: unknown;
  demandIntentType?: unknown;
  demandSearchPlanId?: unknown;
  demandSearchPlan?: unknown;
  buyerPlatformMission?: unknown;
  targetMarketPresetId?: unknown;
  freshnessWindow?: unknown;
  serperTbs?: unknown;
  limit?: unknown;
};

type SerperOrganicResult = {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
};

type SerperResponse = {
  organic?: SerperOrganicResult[];
};

const COUNTRY_GL: Record<string, string> = {
  "United States": "us",
  Germany: "de",
  "United Kingdom": "uk",
  Canada: "ca",
  Australia: "au",
  Mexico: "mx",
  Brazil: "br",
  UAE: "ae",
  "Saudi Arabia": "sa",
  India: "in",
  Vietnam: "vn",
  Thailand: "th",
  Indonesia: "id",
};

const PRODUCT_LINE_IDS: ProductLineId[] = ["masterbatch", "filament", "custom"];
const DEMAND_INTENT_TYPES: DemandIntentType[] = [
  "rfq",
  "looking_for_supplier",
  "procurement",
  "tender",
  "distributor_wanted",
  "substitution",
  "forum_request",
  "all",
];
const FRESHNESS_WINDOWS: DemandFreshnessWindow[] = ["past_month", "past_3_months", "past_6_months", "past_year", "anytime"];

function normalizeLimit(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 10;
  }

  return Math.min(Math.max(Math.floor(value), 1), 20);
}

function createCandidateId(link: string, position: number): string {
  return `${position}-${Buffer.from(link).toString("base64url").slice(0, 18)}`;
}

export async function POST(request: Request) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "需要在 .env.local 中配置 SERPER_API_KEY" },
      { status: 500 },
    );
  }

  let body: SerperSearchRequest;
  try {
    body = (await request.json()) as SerperSearchRequest;
  } catch {
    return NextResponse.json({ error: "请求 JSON 不合法" }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const country = typeof body.country === "string" ? body.country.trim() : "";
  const productKeyword = typeof body.productKeyword === "string" ? body.productKeyword.trim() : "";
  const customerType = typeof body.customerType === "string" ? body.customerType.trim() : "";
  const productLineId = PRODUCT_LINE_IDS.includes(body.productLineId as ProductLineId)
    ? (body.productLineId as ProductLineId)
    : undefined;
  const searchPlan = body.searchPlan && typeof body.searchPlan === "object" ? (body.searchPlan as SearchQueryPlan) : undefined;
  const searchMode = body.searchMode === "demand_signal" ? "demand_signal" : "buyer_persona";
  const demandIntentType = DEMAND_INTENT_TYPES.includes(body.demandIntentType as DemandIntentType)
    ? (body.demandIntentType as DemandIntentType)
    : undefined;
  const demandSearchPlan = body.demandSearchPlan && typeof body.demandSearchPlan === "object" ? (body.demandSearchPlan as DemandSearchPlan) : undefined;
  const buyerPlatformMission = body.buyerPlatformMission && typeof body.buyerPlatformMission === "object" ? (body.buyerPlatformMission as BuyerPlatformMission) : undefined;
  const targetMarketPresetId = typeof body.targetMarketPresetId === "string" ? body.targetMarketPresetId : undefined;
  const freshnessWindow = FRESHNESS_WINDOWS.includes(body.freshnessWindow as DemandFreshnessWindow)
    ? (body.freshnessWindow as DemandFreshnessWindow)
    : undefined;
  const serperTbs = typeof body.serperTbs === "string" && body.serperTbs.trim() ? body.serperTbs.trim() : demandSearchPlan?.serperTbs;
  const limit = normalizeLimit(body.limit);

  if (!query) {
    return NextResponse.json({ error: "请输入搜索词" }, { status: 400 });
  }

  const fetchedAt = new Date().toISOString();
  const serperBody: Record<string, string | number> = {
    q: query,
    num: limit,
  };
  const gl = COUNTRY_GL[country];
  if (gl) {
    serperBody.gl = gl;
  }
  if (serperTbs && freshnessWindow !== "anytime") {
    serperBody.tbs = serperTbs;
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serperBody),
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        error: serperTbs
          ? `时间过滤请求失败，状态码 ${response.status}。可尝试不限时间或调整搜索词。`
          : `Serper 搜索失败，状态码 ${response.status}。请检查搜索词格式、结果数量和 Serper 账户状态。`,
        query,
        status: response.status,
      },
      { status: 502 },
    );
  }

  const data = (await response.json()) as SerperResponse;
  const organic = data.organic ?? [];
  const filteredOrganic = organic.filter((item) => item.link && !isLowQualitySearchResult(item.link));
  const candidates: SerperSearchCandidate[] = filteredOrganic
    .slice(0, limit)
    .map((item, index) => {
      const link = item.link ?? "";
      const position = item.position ?? index + 1;

      const domain = getDomainFromSearchLink(link);
      const classification = productLineId && productLineId !== "custom"
        ? classifyCandidateResult(
            {
              title: item.title ?? "",
              link,
              domain,
              snippet: item.snippet ?? "",
            },
            {
              productLineId,
              searchPlan,
            },
          )
        : undefined;
      const demandClassification = searchMode === "demand_signal" && productLineId
        ? classifyDemandSignal(
            {
              title: item.title ?? "",
              link,
              domain,
              snippet: item.snippet ?? "",
            },
            {
              productLineId,
              searchPlan: demandSearchPlan,
              targetCountry: country,
              targetMarketPresetId,
              freshnessWindow,
              platformId: buyerPlatformMission?.platformId,
              platformCategory: buyerPlatformMission?.platformCategory,
              useCase: buyerPlatformMission?.useCase,
              resultMeaning: buyerPlatformMission?.resultMeaning,
            },
          )
        : undefined;
      const review = reviewCandidate(
        {
          title: item.title ?? "",
          link,
          domain,
          snippet: item.snippet ?? "",
          query,
          productKeyword,
          country,
          customerType,
        },
        {
          productLineId,
          searchPlan,
        },
      );

      return {
        id: createCandidateId(link, position),
        title: item.title ?? "",
        link,
        snippet: item.snippet ?? "",
        domain,
        position,
        sourceType: "serper_google_search",
        fetchedAt,
        review,
        productLineId,
        buyerPersonaId: classification?.buyerPersonaId,
        searchIntent: searchPlan?.intent,
        searchPlanId: searchPlan?.id,
        classification,
        businessRole: classification?.businessRole,
        buyerFitScore: classification?.buyerFitScore,
        peerRiskScore: classification?.peerRiskScore,
        shouldHideByDefault: demandClassification?.shouldHideByDefault ?? classification?.shouldHideByDefault,
        demandClassification,
        demandScore: demandClassification?.demandScore,
        demandIntentType: demandClassification?.intentType ?? demandIntentType,
        demandRecommendedAction: demandClassification?.recommendedAction,
        demandEvidenceTerms: demandClassification?.evidenceTerms,
        demandFreshnessWindow: freshnessWindow ?? demandSearchPlan?.freshnessWindow,
        demandSerperTbs: serperTbs,
        buyerPlatformMission,
      };
    });

  return NextResponse.json({
    query,
    fetchedAt,
    rawOrganicCount: organic.length,
    candidateCount: candidates.length,
    filteredOutCount: organic.length - filteredOrganic.length,
    candidates,
  });
}
