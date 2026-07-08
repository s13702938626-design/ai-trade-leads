import type { CustomsLead, CustomsLeadPriority } from "@/types/customs";

type CustomsReview = {
  reviewScore: number;
  priority: CustomsLeadPriority;
  importFrequency: CustomsLead["importFrequency"];
  estimatedMonthlyVolume: number | null;
  reviewReasons: string[];
  risks: string[];
  missingInfo: string[];
};

function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function uniqueMonths(dates: string[]): number {
  const months = new Set(
    dates
      .map(parseDate)
      .filter((date): date is Date => Boolean(date))
      .map((date) => `${date.getFullYear()}-${date.getMonth() + 1}`),
  );
  return months.size;
}

function inferFrequency(dates: string[]): CustomsLead["importFrequency"] {
  const validDates = dates.map(parseDate).filter((date): date is Date => Boolean(date));
  if (validDates.length === 0) return "unknown";
  if (validDates.length >= 4 && uniqueMonths(dates) >= 3) return "monthly";
  if (validDates.length >= 2) return "quarterly";
  if (validDates.length === 1) return "occasional";
  return "irregular";
}

function priorityFromScore(score: number, missingInfo: string[]): CustomsLeadPriority {
  if (missingInfo.length >= 3) return "unknown";
  if (score >= 80) return "P0";
  if (score >= 60) return "P1";
  if (score >= 40) return "P2";
  return "P3";
}

export function reviewCustomsLead(lead: CustomsLead): CustomsReview {
  let score = 0;
  const reviewReasons: string[] = [];
  const risks: string[] = [];
  const missingInfo: string[] = [];
  const importFrequency = inferFrequency(lead.shipmentDates);
  const estimatedMonthlyVolume = lead.estimatedMonthlyVolume;
  const lastImportDate = parseDate(lead.lastImportDate);

  if (lastImportDate) {
    const age = daysSince(lastImportDate);
    if (age <= 90) {
      score += 35;
      reviewReasons.push("最近 90 天内有采购记录，需求较新");
    } else if (age <= 180) {
      score += 25;
      reviewReasons.push("最近 180 天内有采购记录，仍有跟进价值");
    } else {
      score += 10;
      reviewReasons.push("有历史采购记录，但最近采购时间超过 180 天");
    }
  } else {
    missingInfo.push("缺少进口日期");
  }

  if (importFrequency === "monthly") {
    score += 30;
    reviewReasons.push("采购频率接近 monthly，优先级较高");
  } else if (importFrequency === "quarterly") {
    score += 20;
    reviewReasons.push("采购频率接近 quarterly，有持续采购迹象");
  } else if (importFrequency === "occasional") {
    score += 10;
    reviewReasons.push("采购频率 occasional，需要进一步确认");
  } else if (importFrequency === "irregular") {
    score += 8;
    reviewReasons.push("采购频率 irregular，稳定性待确认");
  } else {
    missingInfo.push("缺少足够记录判断采购频率");
  }

  if (typeof estimatedMonthlyVolume === "number") {
    if (estimatedMonthlyVolume >= 100 && estimatedMonthlyVolume <= 500) {
      score += 25;
      reviewReasons.push("估算月采购量 100-500，适合作为高优先级线索");
    } else if (estimatedMonthlyVolume > 500 && estimatedMonthlyVolume <= 2000) {
      score += 20;
      reviewReasons.push("估算月采购量 500-2000，采购规模较大");
    } else if (estimatedMonthlyVolume >= 50 && estimatedMonthlyVolume < 100) {
      score += 12;
      reviewReasons.push("估算月采购量 50-100，有跟进价值");
    } else if (estimatedMonthlyVolume < 50) {
      score += 8;
      reviewReasons.push("估算月采购量低于 50，适合低优先级跟进");
    } else {
      score += 10;
      risks.push("采购量较大，需要评估产能和账期");
    }
  } else {
    missingInfo.push("缺少数量/重量");
  }

  if (lead.hsCode) {
    score += 5;
    reviewReasons.push("记录包含 HS Code");
  } else {
    missingInfo.push("缺少 HS Code");
  }

  const productText = lead.productDescription.toLowerCase();
  if (/(plastic|masterbatch|compound|resin|filament|additives)/.test(productText)) {
    score += 10;
    reviewReasons.push("产品描述包含塑料材料相关关键词");
  } else {
    missingInfo.push("产品描述未看到明确塑料材料关键词");
  }

  const reviewScore = Math.min(100, Math.max(0, Math.round(score)));

  return {
    reviewScore,
    priority: priorityFromScore(reviewScore, missingInfo),
    importFrequency,
    estimatedMonthlyVolume,
    reviewReasons,
    risks,
    missingInfo,
  };
}
