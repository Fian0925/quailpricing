"use client";

import { useState, useEffect } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import type { Product } from "@/lib/constants";
import { toast } from "sonner";
import { hitungOtomatis } from "@/lib/utils";

interface EditProps {
  product: Product;
  onSuccess: () => void;
}

export function EditProductDialog({ product, onSuccess }: EditProps) {
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

  useEffect(() => {
    if (open && product) {
      setFormData({
        nama_produk: product.nama_produk || "",
        kategori: product.kategori || "JILBAB",
        harga_agen: product.harga_agen ? product.harga_agen.toString() : "",
        harga_distributor: product.harga_distributor
          ? product.harga_distributor.toString()
          : "",
        harga_distributor_qf: product.harga_distributor_qf
          ? product.harga_distributor_qf.toString()
          : "",
      });
      setIsQf(product.harga_distributor_qf > 0);
    }
  }, [open, product]);



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
      kategori: formData.kategori,
      jenis: formData.kategori,
      harga_agen: parseInt(formData.harga_agen) || 0,
      harga_distributor: parseInt(formData.harga_distributor) || 0,
      harga_distributor_qf: parseInt(formData.harga_distributor_qf) || 0,
    };

    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", product.id);
    setLoading(false);

    if (error) {
      toast.error("Gagal update: " + error.message);
    } else {
      toast.success("Data berhasil diperbarui!");
      setOpen(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Data Produk</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nama_produk" className="text-slate-600">
              Nama Produk
            </Label>
            <Input
              id="nama_produk"
              value={formData.nama_produk}
              onChange={handleChange}
              className="font-bold text-slate-800"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-slate-600">Kategori</Label>
            <div className="flex gap-4">
              <div
                onClick={() => handleKategoriChange("JILBAB")}
                className={`flex items-center gap-2 border rounded-lg p-3 w-full cursor-pointer transition-all ${formData.kategori === "JILBAB" ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "hover:bg-slate-50"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.kategori === "JILBAB" ? "border-blue-600" : "border-slate-300"}`}
                >
                  {formData.kategori === "JILBAB" && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Jilbab
                </span>
              </div>

              <div
                onClick={() => handleKategoriChange("FASHION")}
                className={`flex items-center gap-2 border rounded-lg p-3 w-full cursor-pointer transition-all ${formData.kategori === "FASHION" ? "bg-purple-50 border-purple-500 ring-1 ring-purple-500" : "hover:bg-slate-50"}`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.kategori === "FASHION" ? "border-purple-600" : "border-slate-300"}`}
                >
                  {formData.kategori === "FASHION" && (
                    <div className="w-2 h-2 rounded-full bg-purple-600" />
                  )}
                </div>
                <span className="text-sm font-medium text-slate-700">
                  Fashion
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed my-1"></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="harga_agen" className="text-green-600 font-bold">
                Hrg. Agen
              </Label>
              <Input
                id="harga_agen"
                type="number"
                value={formData.harga_agen}
                onChange={handleAgenChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="harga_distributor" className="text-slate-600">
                Hrg. Distributor
              </Label>
              <Input
                id="harga_distributor"
                type="number"
                value={formData.harga_distributor}
                onChange={handleChange}
                className="bg-slate-50"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="qf_check_edit"
                checked={isQf}
                onCheckedChange={handleQfToggle}
              />
              <label
                htmlFor="qf_check_edit"
                className="text-sm font-medium cursor-pointer text-slate-700"
              >
                Aktifkan Harga QF?
              </label>
            </div>

            {isQf && (
              <div className="grid gap-2 animate-in slide-in-from-top-1">
                <Label
                  htmlFor="harga_distributor_qf"
                  className="text-purple-600 font-bold text-xs"
                >
                  Harga Distributor QF
                </Label>
                <Input
                  id="harga_distributor_qf"
                  type="number"
                  value={formData.harga_distributor_qf}
                  onChange={handleChange}
                  className="bg-white"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
