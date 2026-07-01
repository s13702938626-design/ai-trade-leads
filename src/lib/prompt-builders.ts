import type { Lead } from "@/types/lead";

function leadFacts(lead: Lead): string {
  return [
    `Company name: ${lead.companyName}`,
    `Website: ${lead.website || "Not provided"}`,
    `Country: ${lead.country || "Not provided. Do not guess."}`,
    `Customer type: ${lead.customerType || "Not provided"}`,
    `Product keyword: ${lead.productKeyword}`,
    `Source URL: ${lead.sourceUrl}`,
    `Source title: ${lead.sourceTitle || "Not provided"}`,
    `Source snippet: ${lead.sourceSnippet || "Not provided"}`,
    `Evidence text: ${lead.evidenceText || "Not provided"}`,
    `Email: ${lead.email || "Not provided. Do not guess."}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `LinkedIn URL: ${lead.linkedinUrl || "Not provided"}`,
    `Address: ${lead.address || "Not provided"}`,
    `Notes: ${lead.notes || "Not provided"}`,
  ].join("\n");
}

export function buildAiProfilePrompt(lead: Lead): string {
  return `You are helping me analyze a real overseas B2B lead for plastic materials exports.

Use only the facts below. Do not invent emails, countries, purchase intent, contacts, certifications, revenue, or company background.

Lead facts:
${leadFacts(lead)}

Please analyze:
1. What the company mainly does
2. Whether it may purchase my products
3. Match level: high / medium / low
4. Which products it may purchase
5. Recommended entry angle
6. Risk warnings
7. Next action

My products include masterbatch, black masterbatch, white masterbatch, plastic compounds, PLA/PETG/TPU 3D printer filament materials, PP food container related materials, and plastic packaging related materials.`;
}

export function buildColdEmailPrompt(lead: Lead): string {
  return `Write a practical English cold email for a real B2B plastic materials lead.

Rules:
- Include an English email subject
- Keep the email body within 150 words
- Do not exaggerate
- Do not make false claims
- Do not sound like spam
- Base it on the real source and business relevance below
- End with a low-pressure question
- Do not invent missing email, country, contacts, orders, certifications, or relationships

Lead facts:
${leadFacts(lead)}

My products include masterbatch, black masterbatch, white masterbatch, plastic compounds, PLA/PETG/TPU 3D printer filament materials, PP food container related materials, and plastic packaging related materials.`;
}
