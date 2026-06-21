// ========================================
// STOCK PARSER & STORAGE
// Parse broadcast WA stok harian
// ========================================

export interface StockData {
  date: string;
  items: Record<string, string[]>; // key = nama produk (UPPERCASE), value = varian tersedia
}

export interface StockDiff {
  baruReady: Record<string, string[]>; // varian baru tersedia (perlu diaktifkan)
  baruHabis: Record<string, string[]>; // varian baru habis (perlu dinonaktifkan)
  totalBaruReady: number;
  totalBaruHabis: number;
}

const STORAGE_KEY = "stock_data";
const STORAGE_KEY_PREV = "stock_data_previous";

// --- Normalize nama produk ---
function normalize(name: string): string {
  return name
    .toUpperCase()
    .replace(/[*]/g, "")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// --- Collapse huruf berulang: ANELLA → ANELA ---
function collapseDoubles(str: string): string {
  return str.replace(/(.)\1+/g, "$1");
}

// --- Parse teks broadcast WA ---
export function parseStockBroadcast(text: string): Record<string, string[]> {
  const lines = text.split("\n");
  const stockMap: Record<string, string[]> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.includes(">>")) continue;

    const parts = line.split(">>");
    if (parts.length < 2) continue;

    const productName = normalize(parts[0]);
    const variant = parts[1].replace(/\t/g, "").trim();

    if (!productName || !variant) continue;

    if (!stockMap[productName]) {
      stockMap[productName] = [];
    }
    stockMap[productName].push(variant);
  }

  return stockMap;
}

// --- Simpan stock data ke localStorage (otomatis arsip yang lama) ---
export function saveStockData(items: Record<string, string[]>): void {
  // Arsip data lama sebagai "previous"
  const currentData = localStorage.getItem(STORAGE_KEY);
  if (currentData) {
    localStorage.setItem(STORAGE_KEY_PREV, currentData);
  }

  const data: StockData = {
    date: new Date().toISOString(),
    items,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// --- Load stock data dari localStorage ---
export function loadStockData(): StockData | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as StockData;
  } catch {
    return null;
  }
}

// --- Load stock data SEBELUMNYA ---
export function loadPreviousStockData(): StockData | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(STORAGE_KEY_PREV);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as StockData;
  } catch {
    return null;
  }
}

// --- Hapus stock data ---
export function clearStockData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY_PREV);
}

// --- Hitung perbedaan stok (Diff) ---
export function calculateStockDiff(
  oldStock: Record<string, string[]>,
  newStock: Record<string, string[]>,
): StockDiff {
  const baruReady: Record<string, string[]> = {};
  const baruHabis: Record<string, string[]> = {};
  let totalBaruReady = 0;
  let totalBaruHabis = 0;

  // Cari varian BARU READY (ada di new, tidak ada di old)
  for (const [product, newVariants] of Object.entries(newStock)) {
    const oldVariants = new Set(
      (oldStock[product] || []).map((v) => v.toLowerCase()),
    );
    const added = newVariants.filter(
      (v) => !oldVariants.has(v.toLowerCase()),
    );
    if (added.length > 0) {
      baruReady[product] = added;
      totalBaruReady += added.length;
    }
  }

  // Cari varian BARU HABIS (ada di old, tidak ada di new)
  for (const [product, oldVariants] of Object.entries(oldStock)) {
    const newVariants = new Set(
      (newStock[product] || []).map((v) => v.toLowerCase()),
    );
    const removed = oldVariants.filter(
      (v) => !newVariants.has(v.toLowerCase()),
    );
    if (removed.length > 0) {
      baruHabis[product] = removed;
      totalBaruHabis += removed.length;
    }
  }

  return { baruReady, baruHabis, totalBaruReady, totalBaruHabis };
}

// --- Cari stok untuk produk (fuzzy matching) ---
export function findStockForProduct(
  productName: string,
  stockItems: Record<string, string[]>,
): string[] | null {
  const dbName = normalize(productName);
  const dbCollapsed = collapseDoubles(dbName);

  // 1. Exact match
  if (stockItems[dbName]) return stockItems[dbName];

  for (const stockKey of Object.keys(stockItems)) {
    const normalizedKey = normalize(stockKey);

    // 2. Exact match setelah normalisasi
    if (normalizedKey === dbName) return stockItems[stockKey];

    // 3. Awalan cocok (KEIKO → KEIKO HIJAB, atau sebaliknya)
    const shorter =
      dbName.length <= normalizedKey.length ? dbName : normalizedKey;
    const longer =
      dbName.length <= normalizedKey.length ? normalizedKey : dbName;
    if (
      longer.startsWith(shorter) &&
      (longer.length === shorter.length || longer[shorter.length] === " ")
    ) {
      return stockItems[stockKey];
    }

    // 4. Collapsed match (ANELLA → ANELA)
    const collapsedKey = collapseDoubles(normalizedKey);
    if (dbCollapsed === collapsedKey) return stockItems[stockKey];

    // 5. Collapsed + awalan
    const shorterC =
      dbCollapsed.length <= collapsedKey.length ? dbCollapsed : collapsedKey;
    const longerC =
      dbCollapsed.length <= collapsedKey.length ? collapsedKey : dbCollapsed;
    if (
      longerC.startsWith(shorterC) &&
      (longerC.length === shorterC.length || longerC[shorterC.length] === " ")
    ) {
      return stockItems[stockKey];
    }
  }

  return null;
}
