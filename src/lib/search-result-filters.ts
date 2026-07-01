const BLOCKED_DOMAINS = [
  "alibaba.com",
  "amazon.com",
  "made-in-china.com",
  "globalsources.com",
  "1688.com",
  "temu.com",
  "shein.com",
  "pinterest.com",
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "wikipedia.org",
  "indeed.com",
  "glassdoor.com",
  "ziprecruiter.com",
];

const BLOCKED_URL_PATTERNS = ["linkedin.com/jobs"];

export function getDomainFromSearchLink(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function domainMatches(domain: string, blockedDomain: string): boolean {
  return domain === blockedDomain || domain.endsWith(`.${blockedDomain}`);
}

export function isLowQualitySearchResult(link: string): boolean {
  const lowerLink = link.toLowerCase();
  const domain = getDomainFromSearchLink(lowerLink);

  if (BLOCKED_URL_PATTERNS.some((pattern) => lowerLink.includes(pattern))) {
    return true;
  }

  return BLOCKED_DOMAINS.some((blockedDomain) => domainMatches(domain, blockedDomain));
}
