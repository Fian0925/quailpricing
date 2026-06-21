// ========================================
// SHARED TYPES & CONSTANTS
// Satu sumber kebenaran untuk seluruh app
// ========================================

export type Product = {
  id: string;
  nama_produk: string;
  jenis: string;
  kategori: string;
  warna: string;
  harga_agen: number;
  harga_distributor: number;
  harga_distributor_qf: number;
  stok: number;
};

export interface CalculatorConfig {
  profit: number;
  packing: number;
  fixed: number;
  admin: number;
  promo: number;
  ongkir: number;
  live: number;
  affiliator: number;
  preorderFee: number;
  isPreorder: boolean;
}

export const DEFAULT_CONFIG: CalculatorConfig = {
  profit: 5000,
  packing: 0,
  fixed: 1250,
  admin: 8.25,
  promo: 4.5,
  ongkir: 8,
  live: 3,
  affiliator: 0,
  preorderFee: 3,
  isPreorder: false,
};
