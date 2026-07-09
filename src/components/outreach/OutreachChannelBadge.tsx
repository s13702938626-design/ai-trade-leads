import type { OutreachChannel } from "@/types/outreach";
import { Badge } from "@/components/ui/Badge";

export const OUTREACH_CHANNEL_LABELS: Record<OutreachChannel, string> = {
  email_first_touch: "第一封开发信",
  email_follow_up: "二次跟进邮件",
  linkedin_message: "LinkedIn 私信",
  whatsapp_message: "WhatsApp 开场白",
  website_form: "网站表单留言",
  reply_follow_up: "已回复后沟通",
};

export function OutreachChannelBadge({ channel }: { channel: OutreachChannel }) {
  return <Badge tone={channel.includes("email") ? "blue" : "neutral"}>{OUTREACH_CHANNEL_LABELS[channel]}</Badge>;
}
