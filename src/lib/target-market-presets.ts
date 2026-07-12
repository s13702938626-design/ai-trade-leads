export type TargetMarketPresetId =
  | "global"
  | "russia"
  | "ukraine"
  | "belt_and_road"
  | "central_asia"
  | "southeast_asia"
  | "middle_east"
  | "africa"
  | "latin_america"
  | "custom";

export type TargetMarketPreset = {
  id: TargetMarketPresetId;
  labelZh: string;
  labelEn: string;
  countries: string[];
  searchCountryTerms: string[];
  languageHints: string[];
  localDemandTerms: string[];
  localB2BSites: string[];
  localTenderSites: string[];
  forumHints: string[];
  notes: string;
};

export const TARGET_MARKET_PRESETS: Record<TargetMarketPresetId, TargetMarketPreset> = {
  global: {
    id: "global",
    labelZh: "全球",
    labelEn: "Global",
    countries: [],
    searchCountryTerms: [],
    languageHints: ["en"],
    localDemandTerms: [],
    localB2BSites: [],
    localTenderSites: ["site:tendersinfo.com", "site:tenderimpulse.com", "site:globaltenders.com"],
    forumHints: ["reddit", "quora"],
    notes: "不限制国家，搜索全球公开网页。",
  },
  russia: {
    id: "russia",
    labelZh: "俄罗斯",
    labelEn: "Russia",
    countries: ["Russia", "Russian Federation"],
    searchCountryTerms: ["Россия", "Russia", "Russian", "РФ"],
    languageHints: ["en", "ru"],
    localDemandTerms: ["купить", "закупка", "поставщик", "поставщики", "запрос цены", "коммерческое предложение", "тендер", "оптом", "импортёр", "требуется поставщик"],
    localB2BSites: ["site:b2bmap.com/russia", "site:allbiz.com", "site:tiu.ru", "site:avito.ru"],
    localTenderSites: ["site:zakupki.gov.ru", "site:tenderguru.ru", "site:roseltorg.ru", "site:fabrikant.ru"],
    forumHints: ["форум", "купить", "поставщик"],
    notes: "公开搜索入口，不登录、不绕验证码、不抓付费内容。",
  },
  ukraine: {
    id: "ukraine",
    labelZh: "乌克兰",
    labelEn: "Ukraine",
    countries: ["Ukraine"],
    searchCountryTerms: ["Україна", "Ukraine", "Ukrainian", "Украина"],
    languageHints: ["en", "uk", "ru"],
    localDemandTerms: ["купити", "закупівля", "постачальник", "постачальники", "запит ціни", "комерційна пропозиція", "тендер", "оптом", "імпортер", "потрібен постачальник"],
    localB2BSites: ["site:prom.ua", "site:b2bmap.com/ukraine", "site:allbiz.com.ua"],
    localTenderSites: ["site:smarttender.biz", "site:prozorro.gov.ua"],
    forumHints: ["форум", "Україна", "постачальник"],
    notes: "公开搜索入口，不登录、不绕验证码、不抓付费内容。",
  },
  belt_and_road: {
    id: "belt_and_road",
    labelZh: "一带一路重点市场组合",
    labelEn: "Belt and Road business preset",
    countries: ["Kazakhstan", "Uzbekistan", "Pakistan", "Bangladesh", "Vietnam", "Thailand", "Indonesia", "Malaysia", "UAE", "Saudi Arabia", "Turkey", "Kenya", "Nigeria", "Russia", "Ukraine", "Chile", "Peru", "Mexico"],
    searchCountryTerms: ["Kazakhstan", "Uzbekistan", "Pakistan", "Vietnam", "Thailand", "Indonesia", "UAE", "Saudi Arabia", "Turkey", "Kenya", "Nigeria", "Russia", "Ukraine", "Mexico"],
    languageHints: ["en", "ru", "ar", "es", "fr"],
    localDemandTerms: ["buyer", "importer", "sourcing", "procurement", "tender", "supplier"],
    localB2BSites: ["site:b2bmap.com", "site:go4worldbusiness.com", "site:tradewheel.com"],
    localTenderSites: ["site:tendersinfo.com", "site:tenderimpulse.com", "site:globaltenders.com"],
    forumHints: ["forum", "supplier", "where to buy"],
    notes: "这是商业搜索预设，不是法律或官方完整名单，可手动调整。",
  },
  central_asia: {
    id: "central_asia",
    labelZh: "中亚",
    labelEn: "Central Asia",
    countries: ["Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan"],
    searchCountryTerms: ["Kazakhstan", "Uzbekistan", "Kyrgyzstan", "Tajikistan", "Turkmenistan"],
    languageHints: ["en", "ru"],
    localDemandTerms: ["закупка", "поставщик", "оптом"],
    localB2BSites: ["site:b2bmap.com", "site:allbiz.com"],
    localTenderSites: ["site:tendersinfo.com"],
    forumHints: ["форум", "supplier"],
    notes: "中亚商业搜索预设。",
  },
  southeast_asia: {
    id: "southeast_asia",
    labelZh: "东南亚",
    labelEn: "Southeast Asia",
    countries: ["Vietnam", "Thailand", "Indonesia", "Malaysia", "Philippines", "Cambodia", "Laos", "Myanmar"],
    searchCountryTerms: ["Vietnam", "Thailand", "Indonesia", "Malaysia", "Philippines", "Cambodia", "Laos", "Myanmar"],
    languageHints: ["en"],
    localDemandTerms: ["buyer", "importer", "supplier", "sourcing"],
    localB2BSites: ["site:b2bmap.com", "site:go4worldbusiness.com"],
    localTenderSites: ["site:tendersinfo.com"],
    forumHints: ["forum", "supplier"],
    notes: "东南亚商业搜索预设。",
  },
  middle_east: {
    id: "middle_east",
    labelZh: "中东",
    labelEn: "Middle East",
    countries: ["UAE", "Saudi Arabia", "Turkey", "Egypt", "Iran"],
    searchCountryTerms: ["UAE", "Saudi Arabia", "Turkey", "Egypt", "Iran"],
    languageHints: ["en", "ar"],
    localDemandTerms: ["buyer", "importer", "supplier", "tender"],
    localB2BSites: ["site:b2bmap.com", "site:tradewheel.com"],
    localTenderSites: ["site:tendersinfo.com", "site:globaltenders.com"],
    forumHints: ["forum", "supplier"],
    notes: "中东商业搜索预设。",
  },
  africa: {
    id: "africa",
    labelZh: "非洲",
    labelEn: "Africa",
    countries: ["Kenya", "Nigeria", "Ethiopia", "Tanzania", "Egypt"],
    searchCountryTerms: ["Kenya", "Nigeria", "Ethiopia", "Tanzania", "Egypt"],
    languageHints: ["en", "fr"],
    localDemandTerms: ["buyer", "importer", "supplier", "tender"],
    localB2BSites: ["site:b2bmap.com", "site:go4worldbusiness.com"],
    localTenderSites: ["site:tendersinfo.com", "site:globaltenders.com"],
    forumHints: ["forum", "supplier"],
    notes: "非洲商业搜索预设。",
  },
  latin_america: {
    id: "latin_america",
    labelZh: "拉美",
    labelEn: "Latin America",
    countries: ["Chile", "Peru", "Mexico"],
    searchCountryTerms: ["Chile", "Peru", "Mexico"],
    languageHints: ["en", "es", "pt"],
    localDemandTerms: ["cotización", "proveedor", "comprar", "importador", "mayorista"],
    localB2BSites: ["site:b2bmap.com", "site:go4worldbusiness.com"],
    localTenderSites: ["site:tendersinfo.com"],
    forumHints: ["foro", "proveedor"],
    notes: "拉美商业搜索预设。",
  },
  custom: {
    id: "custom",
    labelZh: "自定义国家",
    labelEn: "Custom",
    countries: [],
    searchCountryTerms: [],
    languageHints: ["en"],
    localDemandTerms: [],
    localB2BSites: [],
    localTenderSites: [],
    forumHints: [],
    notes: "使用手动输入的目标国家或全球搜索。",
  },
};

export const TARGET_MARKET_PRESET_OPTIONS = Object.values(TARGET_MARKET_PRESETS).map((preset) => ({
  value: preset.id,
  label: `${preset.labelZh} / ${preset.labelEn}`,
}));
