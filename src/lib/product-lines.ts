import type { ProductLineId } from "@/types/search-intelligence";

export type ProductLineConfig = {
  id: ProductLineId;
  label: string;
  userSells: string[];
  targetBuyerTerms: string[];
  peerSupplierTerms: string[];
  searchFocus: string;
};

export const PRODUCT_LINES: Record<ProductLineId, ProductLineConfig> = {
  masterbatch: {
    id: "masterbatch",
    label: "色母 / Masterbatch",
    userSells: [
      "color masterbatch",
      "colour masterbatch",
      "color concentrate",
      "plastic colorant",
      "additive masterbatch",
      "functional masterbatch",
      "PP color masterbatch",
      "PE color masterbatch",
      "ABS color masterbatch",
      "PS color masterbatch",
    ],
    targetBuyerTerms: [
      "plastic injection molding company",
      "injection molder",
      "plastic product manufacturer",
      "plastic packaging manufacturer",
      "PP food container manufacturer",
      "disposable plastic container manufacturer",
      "plastic household products manufacturer",
      "plastic toy manufacturer",
      "plastic pipe manufacturer",
      "plastic extrusion company",
      "plastic blow molding company",
      "cable manufacturer",
      "bottle cap manufacturer",
      "plastic bucket manufacturer",
      "plastic crate manufacturer",
      "plastic furniture manufacturer",
    ],
    peerSupplierTerms: [
      "masterbatch manufacturer",
      "color masterbatch supplier",
      "color concentrate manufacturer",
      "pigment manufacturer",
      "compounder",
      "resin supplier",
      "plastic raw material supplier",
    ],
    searchFocus: "找会使用色母的塑料制品工厂，而不是找色母同行厂家。",
  },
  filament: {
    id: "filament",
    label: "3D打印耗材 / 3D Filament",
    userSells: [
      "3D printer filament",
      "PLA filament",
      "PETG filament",
      "TPU filament",
      "ABS filament",
      "FDM filament",
      "3D printing materials",
    ],
    targetBuyerTerms: [
      "3D printing service",
      "FDM 3D printing service",
      "3D print farm",
      "rapid prototyping service",
      "additive manufacturing service",
      "product prototyping company",
      "industrial design studio",
      "model making studio",
      "cosplay prop studio",
      "miniature printing service",
      "makerspace",
      "fab lab",
      "school 3D printing lab",
      "university maker lab",
      "3D printing bureau",
      "3D printing shop",
      "3D printer reseller",
      "3D printing filament distributor",
      "3D printing supplies store",
    ],
    peerSupplierTerms: [
      "filament manufacturer",
      "PLA filament manufacturer",
      "3D printer filament factory",
      "filament supplier",
      "filament producer",
      "3D filament exporter",
      "3D filament OEM factory",
    ],
    searchFocus: "找消耗 3D 打印耗材的服务商、打印农场、创客空间和渠道商，而不是找耗材生产同行。",
  },
  custom: {
    id: "custom",
    label: "自定义",
    userSells: [],
    targetBuyerTerms: [],
    peerSupplierTerms: [],
    searchFocus: "按用户输入的自定义产品和买家模式搜索。",
  },
};

export const PRODUCT_LINE_OPTIONS = [
  { value: "masterbatch" as const, label: PRODUCT_LINES.masterbatch.label },
  { value: "filament" as const, label: PRODUCT_LINES.filament.label },
  { value: "custom" as const, label: PRODUCT_LINES.custom.label },
];

export function inferProductLineFromText(text: string): ProductLineId | "" {
  const value = text.toLowerCase();
  if (/(filament|pla|petg|tpu|fdm|3d printing|3d printer)/i.test(value)) {
    return "filament";
  }
  if (/(masterbatch|color concentrate|colour concentrate|pigment|additive masterbatch)/i.test(value)) {
    return "masterbatch";
  }
  return "";
}
