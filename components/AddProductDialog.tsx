"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { hitungOtomatis } from "@/lib/utils";

export function AddProductDialog({
  onProductAdded,
}: {
  onProductAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isQf, setIsQf] = useState(false);

  const [formData, setFormData] = useState({
    nama_produk: "",
    kategori: "JILBAB",
    harga_agen: "",
    harga_distributor: "",
    harga_distributor_qf: "",
  });



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleAgenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const hasil = hitungOtomatis(val, isQf);
    setFormData((prev) => ({
      ...prev,
      harga_agen: val,
      harga_distributor: hasil.distri,
      harga_distributor_qf: hasil.qf,
    }));
  };

  const handleQfToggle = (checked: boolean | string) => {
    const status = checked === true;
    setIsQf(status);
    const hasil = hitungOtomatis(formData.harga_agen, status);
    setFormData((prev) => ({ ...prev, harga_distributor_qf: hasil.qf }));
  };

  const handleKategoriChange = (value: string) => {
    setFormData({ ...formData, kategori: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      nama_produk: formData.nama_produk,
      jenis: formData.kategori,
      kategori: formData.kategori,
      warna: "All Colors",
      harga_agen: parseInt(formData.harga_agen) || 0,
      harga_distributor: parseInt(formData.harga_distributor) || 0,
      harga_distributor_qf: parseInt(formData.harga_distributor_qf) || 0,
      stok: 0,
    };

    const { error } = await supabase.from("products").insert([payload]);
    setLoading(false);

    if (error) {
      toast.error("Gagal simpan: " + error.message);
    } else {
      toast.success("Produk berhasil ditambahkan!");
      setOpen(false);
      setFormData({
        nama_produk: "",
        kategori: "JILBAB",
        harga_distributor: "",
        harga_agen: "",
        harga_distributor_qf: "",
      });
      setIsQf(false);
      onProductAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
        >
          <PlusCircle className="h-4 w-4" /> Tambah Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nama_produk">Nama Produk</Label>
            <Input
              id="nama_produk"
              value={formData.nama_produk}
              onChange={handleChange}
              placeholder="Masukkan nama produk..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Jenis / Kategori</Label>
            <div className="flex gap-4">
              <div
                className="flex items-center space-x-2 border rounded-lg p-3 w-full cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleKategoriChange("JILBAB")}
              >
                <input
                  type="radio"
                  checked={formData.kategori === "JILBAB"}
                  onChange={() => handleKategoriChange("JILBAB")}
                  className="text-blue-600"
                />
                <label className="text-sm font-medium text-slate-700 cursor-pointer">
                  Jilbab
                </label>
              </div>
              <div
                className="flex items-center space-x-2 border rounded-lg p-3 w-full cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => handleKategoriChange("FASHION")}
              >
                <input
                  type="radio"
                  checked={formData.kategori === "FASHION"}
                  onChange={() => handleKategoriChange("FASHION")}
                  className="text-purple-600"
                />
                <label className="text-sm font-medium text-slate-700 cursor-pointer">
                  Fashion
                </label>
              </div>
            </div>
          </div>
          <div className="border-t pt-2 mt-2">
            <p className="text-xs text-center text-gray-500">
              Input Harga (Isi angka saja)
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="harga_agen" className="text-green-600 font-bold">
              Harga Agen Biasa
            </Label>
            <Input
              id="harga_agen"
              type="number"
              placeholder="Masukkan harga agen..."
              value={formData.harga_agen}
              onChange={handleAgenChange}
            />
            <p className="text-[10px] text-gray-400">
              Dasar perhitungan otomatis
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="harga_distributor">
              Harga Distributor (Agen - 5rb)
            </Label>
            <Input
              id="harga_distributor"
              type="number"
              value={formData.harga_distributor}
              onChange={handleChange}
              className="bg-slate-50"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="qf_check"
              checked={isQf}
              onCheckedChange={handleQfToggle}
            />
            <label
              htmlFor="qf_check"
              className="text-sm font-medium cursor-pointer"
            >
              Produk ini ada versi QF?
            </label>
          </div>
          {isQf && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              <Label
                htmlFor="harga_distributor_qf"
                className="text-purple-600 font-bold"
              >
                Harga Distributor QF (Diskon 12.5%)
              </Label>
              <Input
                id="harga_distributor_qf"
                type="number"
                value={formData.harga_distributor_qf}
                onChange={handleChange}
                placeholder="Otomatis dihitung..."
              />
            </div>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-slate-900 hover:bg-slate-800"
          >
            {loading ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
