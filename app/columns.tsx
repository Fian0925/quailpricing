"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Info, TrendingUp, Store, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditProductDialog } from "@/components/EditProductDialog";
import { toast } from "sonner";
import { formatRp, getModalTerbaik, calculateOnlinePrice, calculateStorePrice } from "@/lib/utils";
import type { PricingBreakdown } from "@/lib/utils";

// Re-export Product for backward compatibility
export type { Product } from "@/lib/constants";
import type { Product } from "@/lib/constants";

// --- KOMPONEN AKSI (EDIT + DELETE) ---
const ActionsCell = ({
  product,
  onRefresh,
}: {
  product: Product;
  onRefresh: () => void;
}) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      toast.error("Gagal: " + error.message);
      setDeleting(false);
    } else {
      toast.success("Terhapus!");
      setDeleteOpen(false);
      setDeleting(false);
      onRefresh();
    }
  };

  return (
    <div className="flex items-center gap-1">
      <EditProductDialog product={product} onSuccess={onRefresh} />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
            <DialogDescription>
              Yakin hapus <strong>{product.nama_produk}</strong>? Data tidak bisa
              dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus Permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- KOMPONEN HARGA ONLINE ---
export const OnlinePriceCell = ({ modal }: { modal: number }) => {
  const [breakdown, setBreakdown] = useState<PricingBreakdown>(() =>
    calculateOnlinePrice(modal),
  );

  useEffect(() => {
    const update = () => setBreakdown(calculateOnlinePrice(modal));
    update();
    window.addEventListener("calc-settings-changed", update);
    return () => window.removeEventListener("calc-settings-changed", update);
  }, [modal]);

  return (
    <div className="flex items-center gap-2 group">
      <div className="font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 shadow-sm text-sm">
        {formatRp(breakdown.price)}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <div className="p-1 cursor-pointer active:scale-95 transition-transform">
            <Info className="h-4 w-4 text-green-400 hover:text-green-600" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="bg-slate-900 text-white border-none shadow-xl p-3 w-[240px] z-50">
          <p className="font-bold text-xs mb-2 text-green-300 border-b border-white/10 pb-1 flex items-center gap-2">
            <TrendingUp className="h-3 w-3" /> Profit Online (Bersih)
          </p>
          <div className="text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Jual:</span>
              <span className="font-bold">{formatRp(breakdown.price)}</span>
            </div>

            <div className="flex justify-between text-red-300">
              <span>Admin ({breakdown.persenAdmin.toFixed(2)}%):</span>
              <span>-{formatRp(breakdown.adminMurniRp)}</span>
            </div>

            {breakdown.persenAffil > 0 && (
              <div className="flex justify-between text-red-300">
                <span>
                  Affiliate ({breakdown.persenAffil.toFixed(2)}%):
                </span>
                <span>-{formatRp(breakdown.affiliateRp)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Modal:</span>
              <span>-{formatRp(modal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Biaya Lain:</span>
              <span>-{formatRp(breakdown.biayaLain)}</span>
            </div>
            <div className="border-t border-white/20 pt-1 mt-1 flex justify-between font-bold text-yellow-400 text-xs">
              <span>Cuan Bersih:</span>
              <span>{formatRp(breakdown.netProfit)}</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// --- KOMPONEN HARGA TOKO ---
export const StorePriceCell = ({
  hargaAgen,
  modal,
  kategori,
}: {
  hargaAgen: number;
  modal: number;
  kategori: string;
}) => {
  const [breakdown, setBreakdown] = useState<PricingBreakdown>(() =>
    calculateStorePrice(hargaAgen, modal, kategori),
  );

  useEffect(() => {
    const update = () =>
      setBreakdown(calculateStorePrice(hargaAgen, modal, kategori));
    update();
    window.addEventListener("calc-settings-changed", update);
    return () => window.removeEventListener("calc-settings-changed", update);
  }, [hargaAgen, modal, kategori]);

  return (
    <div className="flex items-center gap-2 group">
      <div className="font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm text-sm">
        {formatRp(breakdown.price)}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <div className="p-1 cursor-pointer active:scale-95 transition-transform">
            <Info className="h-4 w-4 text-blue-400 hover:text-blue-600" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="bg-slate-900 text-white border-none shadow-xl p-3 w-[240px] z-50">
          <p className="font-bold text-xs mb-2 text-blue-300 border-b border-white/10 pb-1 flex items-center gap-2">
            <Store className="h-3 w-3" /> Profit Toko (Bersih)
          </p>
          <div className="text-[11px] space-y-1">
            <div className="flex justify-between gap-4">
              <span>Jual (Agen+{breakdown.price - hargaAgen}):</span>
              <span className="font-bold">{formatRp(breakdown.price)}</span>
            </div>

            <div className="flex justify-between text-red-300">
              <span>Admin ({breakdown.persenAdmin.toFixed(2)}%):</span>
              <span>-{formatRp(breakdown.adminMurniRp)}</span>
            </div>

            {breakdown.persenAffil > 0 && (
              <div className="flex justify-between text-red-300">
                <span>
                  Affiliate ({breakdown.persenAffil.toFixed(2)}%):
                </span>
                <span>-{formatRp(breakdown.affiliateRp)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400">
              <span>Modal Terbaik:</span>
              <span>-{formatRp(modal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Biaya Lain:</span>
              <span>-{formatRp(breakdown.biayaLain)}</span>
            </div>
            <div className="border-t border-white/20 pt-1 mt-1 flex justify-between font-bold text-yellow-400 text-xs">
              <span>Cuan Bersih:</span>
              <span>{formatRp(breakdown.netProfit)}</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// --- DEFINISI KOLOM TABEL ---
export const createColumns = (
  onRefresh: () => void,
): ColumnDef<Product>[] => [
  {
    accessorKey: "nama_produk",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="pl-0 hover:bg-transparent font-bold text-slate-700"
      >
        Nama Produk <ArrowUpDown className="ml-2 h-4 w-4 text-slate-400" />
      </Button>
    ),
    cell: ({ row }) => {
      const kategori = row.original.kategori || "JILBAB";
      const isFashion = kategori === "FASHION";
      const warnaLabel = isFashion
        ? "bg-purple-100 text-purple-700 border-purple-200"
        : "bg-blue-100 text-blue-700 border-blue-200";
      return (
        <div className="py-1">
          <div className="font-bold text-slate-800 text-base mb-1">
            {row.getValue("nama_produk")}
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide border ${warnaLabel}`}
          >
            {kategori}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "harga_agen",
    header: "Hrg Agen",
    cell: ({ row }) => {
      const val = parseFloat(row.getValue("harga_agen"));
      return val ? (
        <div className="text-slate-600 font-medium">{formatRp(val)}</div>
      ) : (
        <span className="text-gray-300 text-xs">-</span>
      );
    },
  },
  {
    accessorKey: "harga_distributor",
    header: "Hrg Distri",
    cell: ({ row }) => {
      const val = parseFloat(row.getValue("harga_distributor"));
      return val ? (
        <div className="text-slate-600 font-medium">{formatRp(val)}</div>
      ) : (
        <span className="text-gray-300 text-xs">-</span>
      );
    },
  },
  {
    accessorKey: "harga_distributor_qf",
    header: "Distri QF",
    cell: ({ row }) => {
      const val = parseFloat(row.getValue("harga_distributor_qf"));
      return val ? (
        <div className="text-purple-600 font-bold">{formatRp(val)}</div>
      ) : (
        <span className="text-gray-300 text-xs">-</span>
      );
    },
  },
  {
    id: "rek_toko",
    header: () => (
      <div className="flex items-center gap-1 text-blue-700 font-bold">
        <Store className="h-4 w-4" /> Rek. Toko
      </div>
    ),
    cell: ({ row }) => {
      const prod = row.original;
      const { modal } = getModalTerbaik(prod);
      if (!prod.harga_agen || prod.harga_agen === 0)
        return <span className="text-gray-300 text-xs">-</span>;
      return (
        <StorePriceCell
          hargaAgen={prod.harga_agen}
          modal={modal}
          kategori={prod.kategori}
        />
      );
    },
  },
  {
    id: "rek_jual",
    header: () => (
      <div className="flex items-center gap-1 text-green-700 font-bold">
        <TrendingUp className="h-4 w-4" /> Rek. Online
      </div>
    ),
    cell: ({ row }) => {
      const prod = row.original;
      const { modal } = getModalTerbaik(prod);
      if (!modal || modal === 0)
        return <span className="text-gray-300 text-xs">Cek Modal</span>;
      return <OnlinePriceCell modal={modal} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionsCell product={row.original} onRefresh={onRefresh} />
    ),
  },
];
