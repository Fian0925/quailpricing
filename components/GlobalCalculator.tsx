"use client";

import { useState, useLayoutEffect } from "react";
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
import { Settings, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_CONFIG } from "@/lib/constants";



export function GlobalCalculator() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [config, setConfig] = useState(DEFAULT_CONFIG);

  // 2. UPDATE LOGIC LOAD (Agar data lama otomatis dapat update affiliator)
  useLayoutEffect(() => {
    if (open) {
      const saved = localStorage.getItem("calc_settings");
      let newConfig = DEFAULT_CONFIG;
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Gabungkan Default dengan Saved (Supaya key 'affiliator' masuk otomatis)
          newConfig = { ...DEFAULT_CONFIG, ...parsed };
        } catch (e) {
          console.error("Gagal load config", e);
          newConfig = DEFAULT_CONFIG;
        }
      }
      
      setConfig(newConfig);
    }
  }, [open]);

  const handleReset = () => {
    if (confirm("Kembalikan semua pengaturan rumus ke awal?")) {
      setConfig(DEFAULT_CONFIG);
      toast.info(
        "Pengaturan dikembalikan ke default. Jangan lupa klik Simpan!",
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setConfig({ ...config, [e.target.id]: isNaN(val) ? 0 : val });
  };

  const handleCheckbox = (checked: boolean) => {
    setConfig({ ...config, isPreorder: checked });
  };

  const handleSave = () => {
    setLoading(true);
    localStorage.setItem("calc_settings", JSON.stringify(config));
    window.dispatchEvent(new Event("calc-settings-changed"));

    setTimeout(() => {
      setLoading(false);
      setOpen(false);
      toast.success("Rumus berhasil diperbarui!");
    }, 500);
  };

  // 3. UPDATE RUMUS TOTAL (Tambah config.affiliator)
  const totalPersen =
    config.admin +
    config.promo +
    config.ongkir +
    config.live +
    config.affiliator +
    (config.isPreorder ? config.preorderFee : 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 shadow-sm"
        >
          <Settings className="h-4 w-4" /> Setting Rumus
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pengaturan Rumus Harga</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* BAGIAN 1: BIAYA RUPIAH */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">
              Komponen Rupiah (Rp)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="profit" className="text-green-600 font-bold">
                  Target Profit
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    Rp
                  </span>
                  <Input
                    id="profit"
                    type="number"
                    className="pl-8"
                    value={config.profit}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="packing">Biaya Packing</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    Rp
                  </span>
                  <Input
                    id="packing"
                    type="number"
                    className="pl-8"
                    value={config.packing}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fixed">Biaya Tetap Lain</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    Rp
                  </span>
                  <Input
                    id="fixed"
                    type="number"
                    className="pl-8"
                    value={config.fixed}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: POTONGAN PERSEN (%) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">
              Potongan Admin Marketplace (%)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="admin">Admin Fee</Label>
                <div className="relative">
                  <Input
                    id="admin"
                    type="number"
                    step="0.01"
                    className="pr-8"
                    value={config.admin}
                    onChange={handleChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="promo">Promo/Diskon</Label>
                <div className="relative">
                  <Input
                    id="promo"
                    type="number"
                    step="0.01"
                    className="pr-8"
                    value={config.promo}
                    onChange={handleChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ongkir">Gratis Ongkir</Label>
                <div className="relative">
                  <Input
                    id="ongkir"
                    type="number"
                    step="0.01"
                    className="pr-8"
                    value={config.ongkir}
                    onChange={handleChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="live">Biaya Live</Label>
                <div className="relative">
                  <Input
                    id="live"
                    type="number"
                    step="0.01"
                    className="pr-8"
                    value={config.live}
                    onChange={handleChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>

              {/* 4. INPUT AFFILIATOR BARU */}
              <div className="space-y-1">
                <Label
                  htmlFor="affiliator"
                  className="text-purple-600 font-bold"
                >
                  Komisi Affiliator
                </Label>
                <div className="relative">
                  <Input
                    id="affiliator"
                    type="number"
                    step="0.01"
                    className="pr-8"
                    value={config.affiliator}
                    onChange={handleChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 3: PRE-ORDER */}
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox
                id="isPreorder"
                checked={config.isPreorder}
                onCheckedChange={(c) => handleCheckbox(c as boolean)}
              />
              <label
                htmlFor="isPreorder"
                className="text-sm font-medium cursor-pointer text-slate-700"
              >
                Aktifkan Biaya Pre-Order?
              </label>
            </div>

            {config.isPreorder && (
              <div className="grid gap-2 animate-in slide-in-from-top-1">
                <Label
                  htmlFor="preorderFee"
                  className="text-orange-600 font-bold text-xs"
                >
                  Biaya Layanan PO (%)
                </Label>
                <div className="relative">
                  <Input
                    id="preorderFee"
                    type="number"
                    step="0.01"
                    className="pr-8 bg-white"
                    value={config.preorderFee}
                    onChange={handleChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    %
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RINGKASAN TOTAL POTONGAN */}
          <div className="text-center text-xs text-slate-500 bg-slate-50 p-2 rounded border border-dashed">
            Total Potongan Admin:{" "}
            <span className="font-bold text-red-500">
              {totalPersen.toFixed(2)}%
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="destructive"
            onClick={handleReset}
            className="gap-2"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Reset Default
          </Button>

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
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Menyimpan..." : "Simpan Rumus"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
