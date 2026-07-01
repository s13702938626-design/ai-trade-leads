export type SearchQueryInput = {
  industry: string;
  country: string;
  customerType: string;
};

export function buildSearchQueries({
  industry,
  country,
  customerType,
}: SearchQueryInput): string[] {
  const base = [industry, customerType, country].filter(Boolean).join(" ");
  const quotedIndustry = industry ? `"${industry}"` : "";
  const quotedCountry = country ? `"${country}"` : "";

  return [
    `${base}`,
    `${quotedIndustry} ${customerType} ${quotedCountry} company`,
    `${quotedIndustry} ${customerType} ${quotedCountry} contact`,
    `${quotedIndustry} ${customerType} ${quotedCountry} "about us"`,
    `${quotedIndustry} ${customerType} ${quotedCountry} "products"`,
    `${quotedIndustry} ${customerType} ${quotedCountry} "import"`,
    `${quotedIndustry} ${customerType} ${quotedCountry} "distributor"`,
    `${quotedIndustry} ${customerType} ${quotedCountry} "manufacturer"`,
    `site:linkedin.com/company ${quotedIndustry} ${customerType} ${quotedCountry}`,
    `site:kompass.com ${quotedIndustry} ${customerType} ${quotedCountry}`,
  ].map((query) => query.replace(/\s+/g, " ").trim());
}

export function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function bingSearchUrl(query: string): string {
  return `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
}
