"use client";

import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Import Sonner

export function CsvUploader({
  onUploadSuccess,
}: {
  onUploadSuccess: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as string[][];
        if (!rows || rows.length < 2) {
          toast.error("File CSV kosong!");
          setUploading(false);
          return;
        }

        const dataRows = rows.slice(1);
        const uniqueMap = new Map();

        dataRows.forEach((row) => {
          let columns = row;
          if (
            row.length === 1 &&
            typeof row[0] === "string" &&
            row[0].includes(";")
          ) {
            columns = row[0].split(";");
          }
          if (columns.length < 5) return;

          const nama = columns[0]?.trim();
          const jenis = columns[1]?.trim();
          const tipe = columns[3]?.trim()?.toLowerCase() || "";

          const hargaRaw = String(columns[4]).replace(/[^0-9]/g, "");
          const harga = parseInt(hargaRaw) || 0;

          if (!nama) return;

          const uniqueKey = nama.toUpperCase();

          if (!uniqueMap.has(uniqueKey)) {
            let fixKategori = "JILBAB";
            if (tipe.includes("fashion")) {
              fixKategori = "FASHION";
            } else if (tipe.includes("hijab")) {
              fixKategori = "JILBAB";
            }

            uniqueMap.set(uniqueKey, {
              nama_produk: nama,
              jenis: jenis,
              kategori: fixKategori,
              warna: "All Colors",
              harga_agen: 0,
              harga_distributor: 0,
              harga_distributor_qf: 0,
              stok: 0,
            });
          }

          const entry = uniqueMap.get(uniqueKey);

          if (tipe.includes("db") && tipe.includes("qf")) {
            entry.harga_distributor_qf = harga;
          } else if (tipe.includes("agen") && tipe.includes("qf")) {
            entry.harga_distributor = harga;
          } else if (
            (tipe.includes("distributor") || tipe.includes("db")) &&
            !tipe.includes("qf")
          ) {
            entry.harga_distributor = harga;
          } else if (tipe.includes("agen") && !tipe.includes("qf")) {
            entry.harga_agen = harga;
          }

          if (!entry.jenis && jenis) entry.jenis = jenis;
          if (tipe.includes("fashion")) entry.kategori = "FASHION";
        });

        const productsToInsert = Array.from(uniqueMap.values());

        const { error } = await supabase
          .from("products")
          .insert(productsToInsert);

        setUploading(false);

        if (error) {
          toast.error("Error: " + error.message);
        } else {
          toast.success(
            `Sukses! ${productsToInsert.length} produk berhasil diupload.`,
          );
          onUploadSuccess();
        }
      },
    });
  };

  return (
    <div className="flex items-center">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
      />
      <label htmlFor="csv-upload">
        <Button
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
          asChild
          disabled={uploading}
        >
          <span>{uploading ? "Sortir Kategori..." : "Upload CSV"}</span>
        </Button>
      </label>
    </div>
  );
}
