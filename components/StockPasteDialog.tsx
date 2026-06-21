"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  CheckCircle2,
  Trash2,
  PackageCheck,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  parseStockBroadcast,
  saveStockData,
  loadStockData,
  clearStockData,
  calculateStockDiff,
} from "@/lib/stockParser";
import type { StockDiff } from "@/lib/stockParser";

type ViewMode = "paste" | "diff";

export function StockPasteDialog() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    productCount: number;
    variantCount: number;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("paste");
  const [diff, setDiff] = useState<StockDiff | null>(null);
  const [diffTab, setDiffTab] = useState<"ready" | "habis">("ready");
  const [copied, setCopied] = useState(false);

  // Load info terakhir saat dialog dibuka
  useEffect(() => {
    if (open) {
      const data = loadStockData();
      if (data) {
        const date = new Date(data.date);
        setLastUpdate(
          date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      } else {
        setLastUpdate(null);
      }
      setText("");
      setPreview(null);
      setViewMode("paste");
      setDiff(null);
      setCopied(false);
    }
  }, [open]);

  // Live preview saat user paste/ketik
  useEffect(() => {
    if (!text.trim()) {
      setPreview(null);
      return;
    }
    const timeout = setTimeout(() => {
      const parsed = parseStockBroadcast(text);
      const productCount = Object.keys(parsed).length;
      const variantCount = Object.values(parsed).reduce(
        (sum, arr) => sum + arr.length,
        0,
      );
      setPreview(productCount > 0 ? { productCount, variantCount } : null);
    }, 300);
    return () => clearTimeout(timeout);
  }, [text]);

  const handleSave = () => {
    const parsed = parseStockBroadcast(text);
    const productCount = Object.keys(parsed).length;

    if (productCount === 0) {
      toast.error(
        "Tidak ada data stok terdeteksi. Pastikan format teks benar.",
      );
      return;
    }

    // Ambil data lama SEBELUM save (karena save akan menimpa)
    const oldData = loadStockData();

    saveStockData(parsed);
    window.dispatchEvent(new Event("stock-data-changed"));

    const variantCount = Object.values(parsed).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );

    // Hitung diff jika ada data sebelumnya
    if (oldData) {
      const stockDiff = calculateStockDiff(oldData.items, parsed);
      setDiff(stockDiff);
      setDiffTab(stockDiff.totalBaruReady > 0 ? "ready" : "habis");
      setViewMode("diff");
      toast.success(
        `Stok diperbarui! ${productCount} produk, ${variantCount} varian.`,
      );
    } else {
      toast.success(
        `Stok pertama disimpan! ${productCount} produk, ${variantCount} varian.`,
      );
      setOpen(false);
    }
  };

  const handleClear = () => {
    clearStockData();
    window.dispatchEvent(new Event("stock-data-changed"));
    setLastUpdate(null);
    toast.info("Data stok dihapus.");
  };

  // Copy diff ke clipboard untuk marketplace
  const handleCopyDiff = (type: "ready" | "habis") => {
    if (!diff) return;

    const items = type === "ready" ? diff.baruReady : diff.baruHabis;
    const header =
      type === "ready"
        ? "✅ VARIAN BARU READY (PERLU DIAKTIFKAN):"
        : "❌ VARIAN BARU HABIS (PERLU DINONAKTIFKAN):";

    let text = header + "\n\n";
    for (const [product, variants] of Object.entries(items)) {
      text += `${product}\n`;
      for (const v of variants) {
        text += `  - ${v}\n`;
      }
      text += "\n";
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- RENDER: DIFF VIEW ---
  const renderDiffView = () => {
    if (!diff) return null;

    const currentItems =
      diffTab === "ready" ? diff.baruReady : diff.baruHabis;
    const currentCount =
      diffTab === "ready" ? diff.totalBaruReady : diff.totalBaruHabis;
    const isEmpty = Object.keys(currentItems).length === 0;

    return (
      <div className="space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setDiffTab("ready")}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              diffTab === "ready"
                ? "border-green-500 bg-green-50"
                : "border-slate-200 hover:border-green-300"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-700">
                Baru Ready
              </span>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {diff.totalBaruReady}
            </span>
            <span className="text-[10px] text-green-500 ml-1">varian</span>
          </button>

          <button
            onClick={() => setDiffTab("habis")}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              diffTab === "habis"
                ? "border-red-500 bg-red-50"
                : "border-slate-200 hover:border-red-300"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs font-bold text-red-700">
                Baru Habis
              </span>
            </div>
            <span className="text-2xl font-bold text-red-600">
              {diff.totalBaruHabis}
            </span>
            <span className="text-[10px] text-red-500 ml-1">varian</span>
          </button>
        </div>

        {/* Info */}
        <div
          className={`text-xs px-3 py-2 rounded-lg ${
            diffTab === "ready"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {diffTab === "ready"
            ? "Varian ini baru tersedia → aktifkan di marketplace"
            : "Varian ini sudah habis → nonaktifkan di marketplace"}
        </div>

        {/* List */}
        <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-lg">
          {isEmpty ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {diffTab === "ready"
                ? "Tidak ada varian baru yang tersedia"
                : "Tidak ada varian yang baru habis"}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {Object.entries(currentItems).map(([product, variants]) => (
                <div key={product} className="p-3">
                  <h4 className="text-xs font-bold text-slate-800 mb-1.5">
                    {product}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {variants.map((v, i) => (
                      <span
                        key={i}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                          diffTab === "ready"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-slate-500"
            onClick={() => {
              setViewMode("paste");
              setText("");
              setPreview(null);
              // refresh last update
              const data = loadStockData();
              if (data) {
                const date = new Date(data.date);
                setLastUpdate(
                  date.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                );
              }
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Paste Lagi
          </Button>

          {currentCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => handleCopyDiff(diffTab)}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Tersalin!" : "Copy List"}
            </Button>
          )}

          <Button size="sm" onClick={() => setOpen(false)}>
            Selesai
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 shadow-sm"
        >
          <ClipboardList className="h-4 w-4" />
          <span className="hidden md:inline">Paste Stok</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-orange-500" />
            {viewMode === "paste"
              ? "Update Data Stok"
              : "Perubahan Stok"}
          </DialogTitle>
          {viewMode === "paste" && (
            <DialogDescription>
              Paste teks broadcast WA stok harian di bawah ini. Format:{" "}
              <code className="text-xs bg-slate-100 px-1 rounded">
                NAMA PRODUK {">>"} Warna Size
              </code>
            </DialogDescription>
          )}
          {viewMode === "diff" && (
            <DialogDescription>
              Perbandingan stok baru vs sebelumnya. Copy list untuk update
              marketplace.
            </DialogDescription>
          )}
        </DialogHeader>

        {viewMode === "diff" ? (
          renderDiffView()
        ) : (
          <>
            {/* Last update info */}
            {lastUpdate && (
              <div className="text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                <span className="text-green-700">
                  Stok terakhir diupdate: <strong>{lastUpdate}</strong>
                </span>
              </div>
            )}

            {/* Textarea */}
            <textarea
              className="w-full h-48 border border-slate-300 rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 placeholder:text-slate-400"
              placeholder={
                "Paste teks broadcast WA di sini...\n\nContoh:\nAIRA\t>>\tHitam\nAIRA\t>>\tOlive\nKEIKO\t>>\tStone"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* Preview */}
            {preview && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="text-orange-700">
                  Terdeteksi: <strong>{preview.productCount}</strong> produk,{" "}
                  <strong>{preview.variantCount}</strong> varian
                </span>
              </div>
            )}

            {!preview && text.trim() && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                Format tidak terdeteksi. Pastikan ada tanda{" "}
                <code className="bg-red-100 px-1 rounded">{">>"}</code> di
                setiap baris data.
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {lastUpdate && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
                  onClick={handleClear}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus Stok
                </Button>
              )}
              <div className="flex gap-2 w-full justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!preview}
                  className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
                >
                  <PackageCheck className="h-4 w-4" />
                  Proses & Simpan
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
