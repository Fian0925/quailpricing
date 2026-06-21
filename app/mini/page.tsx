"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Search, Package, XCircle, Calculator, Pin, Zap, PackageCheck, ChevronDown, ChevronUp } from "lucide-react";
import { OnlinePriceCell, StorePriceCell } from "../columns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Product } from "@/lib/constants";
import { DEFAULT_CONFIG, type CalculatorConfig } from "@/lib/constants";
import { formatRp, getModalTerbaik, getCalcConfig } from "@/lib/utils";
import { loadStockData, findStockForProduct } from "@/lib/stockParser";

const ProductCard = ({
  product,
  config,
  stockItems,
  stockDate,
}: {
  product: Product;
  config: CalculatorConfig | null;
  stockItems: Record<string, string[]> | null;
  stockDate: string | null;
}) => {
  const [customPrice, setCustomPrice] = useState("");
  const [showStock, setShowStock] = useState(false);

  const { modal: modalTerbaik, sumber: sumberModal } =
    getModalTerbaik(product);

  const isFashion = product.kategori === "FASHION";
  const bgBadge = isFashion
    ? "bg-purple-100 text-purple-700 border-purple-200"
    : "bg-blue-100 text-blue-700 border-blue-200";

  // Logic Kalkulator Mini
  let simAdminMurniRp = 0;
  let simAffiliateRp = 0;
  let simBiayaLain = 0;
  let simProfit = 0;
  let persenAdmin = 0;
  let persenAffil = 0;

  const activeConfig = config || DEFAULT_CONFIG;

  if (customPrice) {
    const priceNum = parseInt(customPrice) || 0;

    persenAdmin =
      activeConfig.admin +
      activeConfig.promo +
      activeConfig.ongkir +
      activeConfig.live +
      (activeConfig.isPreorder ? activeConfig.preorderFee : 0);

    persenAffil = activeConfig.affiliator || 0;

    simAdminMurniRp = priceNum * (persenAdmin / 100);
    simAffiliateRp = priceNum * (persenAffil / 100);

    simBiayaLain = activeConfig.packing + activeConfig.fixed;

    simProfit =
      priceNum - simAdminMurniRp - simAffiliateRp - modalTerbaik - simBiayaLain;
  }

  return (
    <div className="mb-6 border-b border-slate-100 pb-6 last:border-0 last:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-3 text-center">
        <h1 className="text-base font-bold text-slate-900 leading-tight mb-1.5">
          {product.nama_produk}
        </h1>
        <div className="flex justify-center gap-1.5">
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide border ${bgBadge}`}
          >
            {product.kategori || "JILBAB"}
          </span>
          <div className="flex items-center text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
            <span className="mr-1 text-[9px] text-slate-400">Modal:</span>
            <span className="font-bold text-slate-700">
              {formatRp(modalTerbaik)}
            </span>
            <span className="ml-0.5 text-[8px] text-slate-400">
              ({sumberModal})
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg flex flex-col items-center justify-center text-center shadow-sm overflow-hidden">
          <span className="text-[9px] uppercase font-bold text-blue-400 mb-0.5 tracking-wider truncate w-full">
            Toko
          </span>
          <div className="scale-95 origin-center">
            <StorePriceCell
              hargaAgen={product.harga_agen}
              modal={modalTerbaik}
              kategori={product.kategori}
            />
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 p-2 rounded-lg flex flex-col items-center justify-center text-center shadow-sm overflow-hidden">
          <span className="text-[9px] uppercase font-bold text-green-400 mb-0.5 tracking-wider truncate w-full">
            Online
          </span>
          <div className="scale-95 origin-center">
            <OnlinePriceCell modal={modalTerbaik} />
          </div>
        </div>
      </div>

      {/* --- CEK STOK TOGGLE --- */}
      {stockItems && (() => {
        const variants = findStockForProduct(product.nama_produk, stockItems);
        return (
          <>
            <button
              onClick={() => setShowStock(!showStock)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:text-orange-600 border border-dashed border-slate-200 rounded-lg hover:border-orange-300 transition-colors mt-2"
            >
              <PackageCheck className="h-3 w-3" />
              {showStock ? "Tutup Stok" : "Cek Stok"}
              {variants && (
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                  {variants.length}
                </span>
              )}
              {showStock ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {showStock && (
              <div className="mt-2 bg-orange-50/50 border border-orange-200 rounded-lg p-2.5 animate-in slide-in-from-top-1 duration-200">
                {variants && variants.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {variants.map((v, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-medium"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                    {stockDate && (
                      <div className="text-[9px] text-slate-400 mt-2 text-right">
                        📅 {stockDate}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] text-red-400 text-center py-1 font-medium">
                    ❌ Stok tidak tersedia / tidak ditemukan
                  </p>
                )}
              </div>
            )}
          </>
        );
      })()}

      {!stockItems && (
        <div className="text-[9px] text-center text-slate-300 mt-2 py-1">
          Stok belum diupdate
        </div>
      )}

      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Calculator className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Cek Profit Manual
          </span>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
            Rp
          </span>
          <Input
            type="number"
            placeholder="Misal 150000..."
            className="pl-8 h-9 text-sm font-bold bg-white border-slate-300 focus:border-slate-500"
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
          />
        </div>

        {customPrice && parseInt(customPrice) > 0 && (
          <div className="mt-3 space-y-1 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Admin ({persenAdmin.toFixed(2)}%):</span>
              <span className="text-red-400">
                - {formatRp(simAdminMurniRp)}
              </span>
            </div>

            {persenAffil > 0 && (
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Affiliate ({persenAffil.toFixed(2)}%):</span>
                <span className="text-red-400">
                  - {formatRp(simAffiliateRp)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Biaya Lain:</span>
              <span className="text-red-400">- {formatRp(simBiayaLain)}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-100 pb-1 mb-1">
              <span>Modal:</span>
              <span>- {formatRp(modalTerbaik)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-600">
                Profit Bersih:
              </span>
              <span
                className={`text-sm font-bold ${simProfit > 0 ? "text-green-600" : "text-red-500"}`}
              >
                {formatRp(simProfit)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function MiniPage() {
  const [data, setData] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [stockItems, setStockItems] = useState<Record<string, string[]> | null>(null);
  const [stockDate, setStockDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("nama_produk", { ascending: true });

      if (products) setData(products as Product[]);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const updateConfig = () => {
      setConfig(getCalcConfig());
    };

    updateConfig();
    window.addEventListener("calc-settings-changed", updateConfig);
    return () => window.removeEventListener("calc-settings-changed", updateConfig);
  }, []);

  // Load stock data + listen for updates
  useEffect(() => {
    const loadStock = () => {
      const data = loadStockData();
      if (data) {
        setStockItems(data.items);
        const date = new Date(data.date);
        setStockDate(
          date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      } else {
        setStockItems(null);
        setStockDate(null);
      }
    };
    loadStock();
    window.addEventListener("stock-data-changed", loadStock);
    // Also listen for storage events (cross-window sync)
    window.addEventListener("storage", (e) => {
      if (e.key === "stock_data") loadStock();
    });
    return () => {
      window.removeEventListener("stock-data-changed", loadStock);
    };
  }, []);

  const searchResults = useMemo(() => {
    if (!search) return [];
    const cleanSearch = search.toLowerCase().trim();
    if (!cleanSearch) return [];
    const filtered = data.filter((p) =>
      p.nama_produk.toLowerCase().includes(cleanSearch),
    );
    return filtered.slice(0, 20);
  }, [search, data]);

  return (
    <div className="min-h-screen bg-white p-3 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            Live <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" />
          </span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              title="Cara Pin on Top"
            >
              <Pin className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 bg-slate-800 text-white border-none p-3 shadow-xl mr-2">
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-yellow-400">
                Cara Pin Window (Always on Top)
              </h4>
              <p className="text-[10px] leading-relaxed text-slate-300">
                Browser memblokir fitur ini otomatis. Gunakan shortcut{" "}
                <b>Microsoft PowerToys</b>:
              </p>
              <div className="bg-slate-700 p-2 rounded text-center border border-slate-600">
                <span className="font-mono text-xs font-bold text-white tracking-widest">
                  Win + Ctrl + T
                </span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative mb-3 shrink-0">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          autoFocus
          placeholder="Cari produk..."
          className="pl-8 h-10 text-sm font-medium shadow-sm border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="text-center text-[10px] text-slate-400 mt-8">
            Memuat Data...
          </div>
        ) : !search ? (
          <div className="text-center text-slate-300 mt-8 select-none">
            <p className="text-xs">Siap mencari...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Package className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-[10px]">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="pb-10">
            {searchResults.map((prod) => (
              <ProductCard key={prod.id} product={prod} config={config} stockItems={stockItems} stockDate={stockDate} />
            ))}

            {searchResults.length >= 20 && (
              <div className="text-center text-[10px] text-slate-400 mt-4 pb-4 border-t border-dashed pt-2">
                --- Menampilkan 20 Teratas ---
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-[9px] text-center text-slate-300 mt-auto pt-2 shrink-0 bg-white">
        Mini Check
      </div>
    </div>
  );
}
