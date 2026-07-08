import type { CustomsLead } from "@/types/customs";
import { reviewCustomsLead } from "@/lib/customs-review";

type ParseResult = {
  leads: CustomsLead[];
  errors: string[];
};

type RowRecord = Record<string, string>;

const COMPANY_FIELDS = ["importer", "importer_name", "buyer", "buyer_name", "consignee", "company", "company_name"];
const COUNTRY_FIELDS = ["country", "destination_country", "importer_country"];
const PRODUCT_FIELDS = ["product", "product_description", "description", "goods_description"];
const HS_FIELDS = ["hs_code", "hscode", "hs"];
const DATE_FIELDS = ["date", "shipment_date", "import_date", "arrival_date"];
const QUANTITY_FIELDS = ["quantity", "qty", "weight", "gross_weight", "net_weight", "volume", "amount"];
const SOURCE_NAME_FIELDS = ["source", "source_name"];
const SOURCE_URL_FIELDS = ["source_url"];

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function pick(row: RowRecord, fields: string[]): string {
  for (const field of fields) {
    const value = row[field]?.trim();
    if (value) return value;
  }
  return "";
}

function normalizeDate(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.trim() : date.toISOString().slice(0, 10);
}

function parseQuantity(value: string): number | null {
  const normalized = value.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return normalized ? Number(normalized[0]) : null;
}

export function normalizeCustomsRow(row: RowRecord, importedAt: string): CustomsLead | null {
  const importerName = pick(row, COMPANY_FIELDS);
  if (!importerName) return null;

  const country = pick(row, COUNTRY_FIELDS);
  const productDescription = pick(row, PRODUCT_FIELDS);
  const hsCode = pick(row, HS_FIELDS);
  const shipmentDate = normalizeDate(pick(row, DATE_FIELDS));
  const quantityRaw = pick(row, QUANTITY_FIELDS);
  const sourceName = pick(row, SOURCE_NAME_FIELDS);
  const sourceUrl = pick(row, SOURCE_URL_FIELDS);
  const estimatedMonthlyVolume = parseQuantity(quantityRaw);

  const lead: CustomsLead = {
    id: createId(),
    importerName,
    country,
    productDescription,
    hsCode,
    shipmentDates: shipmentDate ? [shipmentDate] : [],
    lastImportDate: shipmentDate,
    importFrequency: "unknown",
    estimatedMonthlyVolume,
    quantityRaw,
    sourceName,
    sourceUrl,
    sourceType: "customs_csv_import",
    importedAt,
    reviewScore: 0,
    priority: "unknown",
    reviewReasons: [],
    risks: [],
    missingInfo: [],
    status: sourceName || sourceUrl ? "imported" : "needs_source",
    convertedLeadId: null,
  };
  const review = reviewCustomsLead(lead);

  return {
    ...lead,
    ...review,
  };
}

export function parseCustomsCsv(text: string): ParseResult {
  const rows = parseCsvRows(text);
  const errors: string[] = [];
  if (rows.length === 0) {
    return { leads: [], errors: ["CSV 文件为空"] };
  }

  const headers = rows[0].map(normalizeHeader);
  const hasCompanyField = headers.some((header) => COMPANY_FIELDS.includes(header));
  if (!hasCompanyField) {
    return { leads: [], errors: ["无法识别 company/importer 字段"] };
  }

  const importedAt = new Date().toISOString();
  const grouped = new Map<string, CustomsLead>();

  rows.slice(1).forEach((row, index) => {
    const record = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex] ?? ""]));
    const lead = normalizeCustomsRow(record, importedAt);
    if (!lead) {
      errors.push(`第 ${index + 2} 行：缺少 importer/company 字段值`);
      return;
    }

    const key = `${lead.importerName.toLowerCase()}|${lead.country.toLowerCase()}|${lead.hsCode.toLowerCase()}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, lead);
      return;
    }

    const shipmentDates = Array.from(new Set([...existing.shipmentDates, ...lead.shipmentDates])).sort();
    const quantityParts = [existing.quantityRaw, lead.quantityRaw].filter(Boolean);
    const merged: CustomsLead = {
      ...existing,
      productDescription: existing.productDescription || lead.productDescription,
      sourceName: existing.sourceName || lead.sourceName,
      sourceUrl: existing.sourceUrl || lead.sourceUrl,
      shipmentDates,
      lastImportDate: shipmentDates.at(-1) ?? null,
      quantityRaw: quantityParts.join("; "),
      estimatedMonthlyVolume:
        typeof existing.estimatedMonthlyVolume === "number" && typeof lead.estimatedMonthlyVolume === "number"
          ? existing.estimatedMonthlyVolume + lead.estimatedMonthlyVolume
          : existing.estimatedMonthlyVolume ?? lead.estimatedMonthlyVolume,
      status: existing.sourceName || existing.sourceUrl || lead.sourceName || lead.sourceUrl ? "imported" : "needs_source",
    };
    grouped.set(key, { ...merged, ...reviewCustomsLead(merged) });
  });

  return { leads: Array.from(grouped.values()), errors };
}
