import { useState } from "react";
import { isAxiosError } from "axios";
import { Power } from "lucide-react";

import { setProductActive } from "@/api/productApi";
import type { Product } from "@/types/product";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
};

export default function ProductStatusDialog({
  product,
  onClose,
  onSaved,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const willActivate = !product.isActive;

  async function handleConfirm() {
    if (isSaving) return;

    setError("");
    setIsSaving(true);

    try {
      await setProductActive(product.id, willActivate);
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        setError(
          error.response?.data?.message ??
            "Gagal mengubah status. Periksa koneksi backend.",
        );
      } else {
        setError("Terjadi kesalahan saat mengubah status produk.");
      }

      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onSaved();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <div
            className={[
              "mb-3 flex size-12 items-center justify-center rounded-2xl",
              willActivate
                ? "bg-blue-50 text-blue-600"
                : "bg-amber-50 text-amber-600",
            ].join(" ")}
          >
            <Power className="size-6" />
          </div>

          <DialogTitle className="text-xl">
            {willActivate ? "Aktifkan Produk?" : "Nonaktifkan Produk?"}
          </DialogTitle>

          <DialogDescription className="leading-relaxed">
            {willActivate
              ? `Produk "${product.name}" akan dapat digunakan kembali untuk transaksi baru.`
              : `Produk "${product.name}" tidak dapat digunakan untuk transaksi baru. Data produk dan riwayat transaksi tetap tersimpan.`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3 border-t pt-5">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-xl"
            disabled={isSaving}
            onClick={onClose}
          >
            Batal
          </Button>

          <Button
            type="button"
            className={
              willActivate
                ? "omni-primary-button"
                : "h-12 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
            }
            disabled={isSaving}
            onClick={() => void handleConfirm()}
          >
            {isSaving
              ? "Memproses..."
              : willActivate
                ? "Ya, Aktifkan"
                : "Ya, Nonaktifkan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
