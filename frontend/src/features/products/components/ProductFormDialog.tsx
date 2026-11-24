import { useState } from "react";
import type { ComponentProps } from "react";
import { isAxiosError } from "axios";

import { createProduct, updateProduct } from "@/api/productApi";

import type { Product } from "@/types/product";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
};

type SubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

export default function ProductFormDialog({
  product,
  onClose,
  onSaved,
}: Props) {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");

  // Angka disimpan sebagai string selama user mengetik.
  const [price, setPrice] = useState(product ? String(product.price) : "");

  const [stock, setStock] = useState(product ? String(product.stock) : "0");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit: SubmitHandler = async (event) => {
    event.preventDefault();

    if (isSaving) return;

    setError("");

    const isEditing = Boolean(product);

    const cleanName = name.trim();
    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (cleanName.length < 2) {
      setError("Nama produk minimal 2 karakter.");
      return;
    }

    if (
      price.trim() === "" ||
      !Number.isSafeInteger(numericPrice) ||
      numericPrice <= 0 ||
      numericPrice > 2147483647
    ) {
      setError("Harga harus angka bulat dari 1 sampai 2.147.483.647.");
      return;
    }

    // Validasi stok hanya untuk produk baru.
    if (!isEditing) {
      if (
        stock.trim() === "" ||
        !Number.isSafeInteger(numericStock) ||
        numericStock < 0 ||
        numericStock > 2147483647
      ) {
        setError("Stok harus angka bulat dari 0 sampai 2.147.483.647.");
        return;
      }
    }

    setIsSaving(true);

    try {
      if (product) {
        // Saat edit, stok tidak boleh diubah langsung.
        await updateProduct(product.id, {
          name: cleanName,
          price: numericPrice,
          stock:0
        });
      } else {
        await createProduct({
          name: cleanName,
          price: numericPrice,
          stock: numericStock,
        });
      }
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        setError(
          error.response?.data?.message ??
            "Gagal menyimpan produk. Periksa koneksi backend.",
        );
      } else {
        setError("Terjadi kesalahan saat menyimpan produk.");
      }

      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    onSaved();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] p-7 overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "Edit Produk" : "Tambah Produk"}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Perbarui nama, atau harga"
              : "Masukkan informasi produk baru untuk inventori toko."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="mt-2 space-y-5"
          aria-busy={isSaving}
        >
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="product-name">Nama Produk</Label>

            <Input
              id="product-name"
              placeholder="Contoh: Kopi Susu Gula Aren"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="omni-input"
              minLength={2}
              disabled={isSaving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-price">Harga Jual (Rp)</Label>

            <Input
              id="product-price"
              type="number"
              inputMode="numeric"
              placeholder="18000"
              min={1}
              max={2147483647}
              step={1}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="omni-input"
              disabled={isSaving}
              required
            />

            <p className="text-xs text-muted-foreground">
              Masukkan angka tanpa titik atau pemisah ribuan.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-stock">Stok</Label>

            <Input
              id="product-stock"
              type="number"
              min={0}
              step={1}
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              className="rounded-xl bg-slate-50 disabled:opacity-60"
              disabled={isEditing}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Stok hanya dapat diubah melalui Restock atau Koreksi Stok.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="h-12 rounded-xl"
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="omni-primary-button"
            >
              {isSaving
                ? "Menyimpan..."
                : isEditing
                  ? "Simpan Perubahan"
                  : "Tambah Produk"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
