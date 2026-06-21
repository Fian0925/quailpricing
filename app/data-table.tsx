"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { supabase } from "@/lib/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Store,
  TrendingUp,
  Package,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { OnlinePriceCell, StorePriceCell } from "./columns";
import { EditProductDialog } from "@/components/EditProductDialog";
import type { Product } from "@/lib/constants";
import { formatRp, getModalTerbaik } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRefresh: () => void;
}

// --- KOMPONEN KARTU MOBILE ---
const MobileProductCard = ({
  product,
  onRefresh,
}: {
  product: Product;
  onRefresh: () => void;
}) => {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const labelKategori = product.kategori || "JILBAB";
  const isFashion = labelKategori === "FASHION";
  const bgBadge = isFashion
    ? "bg-purple-100 text-purple-700 border-purple-200"
    : "bg-blue-100 text-blue-700 border-blue-200";

  const { modal: modalTerbaik, sumber: sumberModal } =
    getModalTerbaik(product);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      toast.error("Gagal hapus: " + error.message);
      setDeleting(false);
    } else {
      toast.success("Produk berhasil dihapus");
      setDeleteOpen(false);
      setDeleting(false);
      onRefresh();
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-3 relative overflow-hidden">
      <div
        className={`absolute top-0 right-0 w-16 h-16 opacity-5 rounded-bl-full ${isFashion ? "bg-purple-600" : "bg-blue-600"}`}
      ></div>
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex-1 pr-2">
          <h3 className="font-bold text-slate-800 text-base leading-snug pr-12">
            {product.nama_produk}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border ${bgBadge}`}
            >
              {labelKategori}
            </span>
            <div className="flex items-center text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <span className="mr-1 text-[10px] text-slate-400">Modal:</span>
              <span className="font-bold text-slate-700">
                {formatRp(modalTerbaik)}
              </span>
              <span className="ml-1 text-[9px] text-slate-400">
                ({sumberModal})
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 absolute right-0 top-0 pt-2 pr-2">
          <EditProductDialog product={product} onSuccess={onRefresh} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1">
            <Store className="h-3 w-3" /> Jual Toko
          </span>
          <StorePriceCell
            hargaAgen={product.harga_agen}
            modal={modalTerbaik}
            kategori={product.kategori}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 mb-1">
            <TrendingUp className="h-3 w-3" /> Jual Online
          </span>
          <OnlinePriceCell modal={modalTerbaik} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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

export function DataTable<TData, TValue>({
  columns,
  data,
  onRefresh,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchValue, setSearchValue] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters, sorting },
    initialState: { pagination: { pageSize: 10 } },
  });

  // --- DEBOUNCE SEARCH ---
  React.useEffect(() => {
    setIsSearching(true);
    const timeout = setTimeout(() => {
      table.getColumn("nama_produk")?.setFilterValue(searchValue);
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchValue, table]);

  return (
    <div className="w-full">
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm pb-4 pt-1 mb-4 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama produk..."
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            className="pl-10 h-12 text-base bg-white border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
          />
          {isSearching && searchValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* --- DESKTOP TABLE --- */}
      <div className="hidden md:block rounded-md border bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Tidak ada hasil ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* --- MOBILE CARDS --- */}
      <div className="md:hidden space-y-4 pb-20">
        {table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map((row) => (
              <MobileProductCard
                key={row.id}
                product={row.original as Product}
                onRefresh={onRefresh}
              />
            ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            <Package className="h-10 w-10 mb-2 opacity-50" />
            <p>Produk tidak ditemukan.</p>
          </div>
        )}
      </div>

      {/* --- PAGINATION --- */}
      <div className="flex items-center justify-between py-4 border-t border-slate-200 mt-2 bg-white/50 backdrop-blur md:bg-transparent">
        <span className="text-xs text-slate-500 font-medium pl-1">
          Hal. {table.getState().pagination.pageIndex + 1} dari{" "}
          {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-9 w-9 p-0 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-9 w-9 p-0 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
