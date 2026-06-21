import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  type CalculatorConfig,
  type Product,
  DEFAULT_CONFIG,
} from "./constants";

// --- Class Name Merger (existing) ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Format Rupiah ---
export const formatRp = (val: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(val);

// --- Modal Terbaik (QF > Distri > Agen) ---
export function getModalTerbaik(product: Product): {
  modal: number;
  sumber: string;
} {
  if (product.harga_distributor_qf > 0) {
    return { modal: product.harga_distributor_qf, sumber: "QF" };
  } else if (product.harga_distributor > 0) {
    return { modal: product.harga_distributor, sumber: "Distributor" };
  }
  return { modal: product.harga_agen, sumber: "Agen" };
}

// --- Hitung Otomatis Harga Distributor & QF ---
export function hitungOtomatis(
  agenValue: string,
  qfStatus: boolean,
): { distri: string; qf: string } {
  const agen = parseInt(agenValue) || 0;
  let distri = 0;
  let qf = 0;
  if (agen > 0) distri = agen - 5000;
  if (qfStatus && distri > 0) qf = Math.ceil(distri * 0.875);
  return {
    distri: distri > 0 ? distri.toString() : "",
    qf: qf > 0 ? qf.toString() : "",
  };
}

// --- Load Config dari localStorage ---
export function getCalcConfig(): CalculatorConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  const saved = localStorage.getItem("calc_settings");
  if (saved) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

// --- Pricing Breakdown ---
export interface PricingBreakdown {
  price: number;
  adminMurniRp: number;
  affiliateRp: number;
  biayaLain: number;
  netProfit: number;
  persenAdmin: number;
  persenAffil: number;
}

const EMPTY_BREAKDOWN: PricingBreakdown = {
  price: 0,
  adminMurniRp: 0,
  affiliateRp: 0,
  biayaLain: 0,
  netProfit: 0,
  persenAdmin: 0,
  persenAffil: 0,
};

// --- Kalkulasi Harga Online (Reverse Calculation) ---
export function calculateOnlinePrice(
  modal: number,
  config?: CalculatorConfig,
): PricingBreakdown {
  if (!modal) return EMPTY_BREAKDOWN;
  const c = config || getCalcConfig();

  const persenAdmin =
    c.admin + c.promo + c.ongkir + c.live + (c.isPreorder ? c.preorderFee : 0);
  const persenAffil = c.affiliator || 0;
  const totalPersen = persenAdmin + persenAffil;
  const biayaLain = c.packing + c.fixed;
  const biayaDasar = modal + c.profit + biayaLain;

  const hargaJualRaw = biayaDasar / (1 - totalPersen / 100);
  const price = Math.ceil(hargaJualRaw / 100) * 100;

  const adminMurniRp = price * (persenAdmin / 100);
  const affiliateRp = price * (persenAffil / 100);
  const netProfit = price - adminMurniRp - affiliateRp - modal - biayaLain;

  return {
    price,
    adminMurniRp,
    affiliateRp,
    biayaLain,
    netProfit,
    persenAdmin,
    persenAffil,
  };
}

// --- Kalkulasi Harga Toko ---
export function calculateStorePrice(
  hargaAgen: number,
  modal: number,
  kategori: string,
  config?: CalculatorConfig,
): PricingBreakdown {
  if (!hargaAgen || !modal) return EMPTY_BREAKDOWN;
  const c = config || getCalcConfig();

  const isFashion = kategori === "FASHION";
  const marginToko = isFashion ? 30000 : 15000;
  const price = hargaAgen + marginToko;

  const persenAdmin =
    c.admin + c.promo + c.ongkir + c.live + (c.isPreorder ? c.preorderFee : 0);
  const persenAffil = c.affiliator || 0;
  const biayaLain = c.packing + c.fixed;

  const adminMurniRp = price * (persenAdmin / 100);
  const affiliateRp = price * (persenAffil / 100);
  const netProfit = price - adminMurniRp - affiliateRp - modal - biayaLain;

  return {
    price,
    adminMurniRp,
    affiliateRp,
    biayaLain,
    netProfit,
    persenAdmin,
    persenAffil,
  };
}
