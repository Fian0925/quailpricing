"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Product, createColumns } from "./columns";
import { DataTable } from "./data-table";
import { supabase } from "@/lib/supabaseClient";
import { CsvUploader } from "@/components/CsvUploader";
import { AddProductDialog } from "@/components/AddProductDialog";
import { GlobalCalculator } from "@/components/GlobalCalculator";
import { StockPasteDialog } from "@/components/StockPasteDialog";
import { RefreshCw, Database, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [data, setData] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("nama_produk", { ascending: true });

    if (error) {
      console.error("Error fetching:", error);
    } else {
      setData(products as Product[]);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const cols = useMemo(() => createColumns(fetchData), [fetchData]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      {/* --- HEADER SIMPLE --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 md:relative">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-200">
                <Database className="text-white h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Pricelist Manager
                </h1>
                <p className="text-[10px] text-slate-500 font-medium hidden md:block">
                  Sistem Manajemen Harga Cerdas
                </p>
              </div>
            </div>

            <div className="hidden md:flex gap-4">
              <div className="px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex flex-col items-center min-w-[100px]">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                  Total SKU
                </span>
                <span className="text-lg font-bold text-slate-800">
                  {data.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-slate-800">Daftar Produk</h2>
            <p className="text-sm text-slate-500">
              Kelola harga modal dan rekomendasi harga jual.
            </p>
          </div>

          <div className="hidden md:flex flex-wrap gap-2 items-center w-full md:w-auto justify-end">
            {/* TOMBOL MINI MODE (POPUP SLIM) */}
            <Button
              variant="outline"
              className="gap-2 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200"
              onClick={() => {
                const popup = window.open(
                  "/mini",
                  "MiniPricelist",
                  "width=320,height=480,resizable=yes,scrollbars=yes,status=yes"
                );
                // Jika diblokir oleh browser atau di HP, popup akan bernilai null
                if (!popup || popup.closed || typeof popup.closed == 'undefined') {
                  // Fallback: Buka di tab baru biasa
                  window.open("/mini", "_blank");
                }
              }}
            >
              <MonitorPlay className="h-4 w-4" />
              Mini Mode
            </Button>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <Button
              variant="ghost"
              size="icon"
              onClick={fetchData}
              className="text-slate-400 hover:text-blue-600"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>

            <StockPasteDialog />
            <GlobalCalculator />
            <AddProductDialog onProductAdded={fetchData} />
            <CsvUploader onUploadSuccess={fetchData} />
          </div>
        </div>

        <div className="bg-transparent md:bg-white md:rounded-xl md:border md:border-slate-200 md:shadow-sm overflow-hidden min-h-[500px] relative">
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 z-10 pt-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">
                Memuat data...
              </p>
            </div>
          ) : (
            <DataTable columns={cols} data={data} onRefresh={fetchData} />
          )}
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 hidden md:block">
          &copy; 2026 Pricelist System. All rights reserved.
        </div>
      </div>

      {/* --- MOBILE BOTTOM ACTION BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-2 flex items-center justify-around gap-1 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <StockPasteDialog />
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="flex flex-col items-center gap-0.5 h-auto py-1.5 text-slate-500 hover:text-blue-600"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="text-[10px]">Refresh</span>
        </Button>
        <GlobalCalculator />
        <AddProductDialog onProductAdded={fetchData} />
        <CsvUploader onUploadSuccess={fetchData} />
      </div>
    </div>
  );
}
