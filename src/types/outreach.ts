export type OutreachChannel =
  | "email_first_touch"
  | "email_follow_up"
  | "linkedin_message"
  | "whatsapp_message"
  | "website_form"
  | "reply_follow_up";

export type OutreachTone =
  | "professional"
  | "concise"
  | "friendly"
  | "technical"
  | "factory_direct"
  | "trading";

export type OutreachLanguage =
  | "english"
  | "chinese"
  | "spanish"
  | "french"
  | "arabic"
  | "portuguese";

export type OutreachDraft = {
  id: string;
  leadId: string;
  channel: OutreachChannel;
  language: OutreachLanguage;
  tone: OutreachTone;
  subject?: string;
  body: string;
  shortVersion?: string;
  callToAction: string;
  assumptions: string[];
  missingInfo: string[];
  evidenceUsed: string[];
  warnings: string[];
  createdAt: string;
  model?: string | null;
};

export type OutreachDraftRequest = {
  leadId: string;
  channel: OutreachChannel;
  language: OutreachLanguage;
  tone: OutreachTone;
  productFocus?: string;
  userCompanyIntro?: string;
  userAdvantages?: string;
  userCaseReference?: string;
  extraInstruction?: string;
};
