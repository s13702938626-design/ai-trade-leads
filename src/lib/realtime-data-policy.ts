export const REALTIME_DATA_POLICY = [
  "v0.1 不自动抓取客户。",
  "所有客户必须来自真实公开来源。",
  "sourceUrl 必填。",
  "email 不允许猜测。",
  "country 不允许猜测。",
  "没有证据的客户不应录入。",
  "不允许 mock leads。",
  "不允许 seed fake data。",
  "Serper 搜索结果只能作为候选客户，必须人工确认后才能保存。",
];

export const REALTIME_DATA_POLICY_TEXT = REALTIME_DATA_POLICY.join("\n");
