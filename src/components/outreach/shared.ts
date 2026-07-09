import type { OutreachChannel, OutreachLanguage, OutreachTone } from "@/types/outreach";

export const OUTREACH_CHANNELS: OutreachChannel[] = [
  "email_first_touch",
  "email_follow_up",
  "linkedin_message",
  "whatsapp_message",
  "website_form",
  "reply_follow_up",
];

export const OUTREACH_LANGUAGES: OutreachLanguage[] = [
  "english",
  "chinese",
  "spanish",
  "french",
  "arabic",
  "portuguese",
];

export const OUTREACH_TONES: OutreachTone[] = [
  "professional",
  "concise",
  "friendly",
  "technical",
  "factory_direct",
  "trading",
];
