import { NextResponse } from "next/server";
import type { SerperSearchCandidate } from "@/types/search";
import { getDomainFromSearchLink, isLowQualitySearchResult } from "@/lib/search-result-filters";

type SerperSearchRequest = {
  query?: unknown;
  country?: unknown;
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
  const limit = normalizeLimit(body.limit);

  if (!query) {
    return NextResponse.json({ error: "query 必填" }, { status: 400 });
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
      { error: `Serper 搜索失败，状态码 ${response.status}` },
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

      return {
        id: createCandidateId(link, position),
        title: item.title ?? "",
        link,
        snippet: item.snippet ?? "",
        domain: getDomainFromSearchLink(link),
        position,
        sourceType: "serper_google_search",
        fetchedAt,
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
