import { useState } from "react";
import { isAxiosError } from "axios";
import { Boxes, Save } from "lucide-react";
import { useNavigate } from "react-router";

import { addStockFlow } from "@/api/productApi";
import { clearSession } from "@/utils/auth";
import type { Product } from "@/types/product";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function StockFlowDialog({ product, onClose, onSaved }: Props) {
  const navigate = useNavigate();

  const [type, setType] = useState<"IN" | "ADJUSTMENT">("IN");
  const [quantity, setQuantity] = useState("");
  const [stock, setStock] = useState(String(product.stock));
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const quantityValue = Number(quantity);
  const stockValue = Number(stock);

  const isValid =
    type === "IN"
      ? quantity !== "" && Number.isFinite(quantityValue) && quantityValue > 0
      : stock !== "" && Number.isFinite(stockValue) && stockValue >= 0;

  async function handleSubmit() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      await addStockFlow(product.id, {
        type,
        quantity: type === "IN" ? quantityValue : undefined,
        stock: type === "ADJUSTMENT" ? stockValue : undefined,
        note: note.trim() || undefined,
      });

      onSaved();
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setError(
          error.response?.data?.message ?? "Gagal menyimpan perubahan stok.",
        );
      } else {
        setError("Terjadi kesalahan saat menyimpan perubahan stok.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="size-5 text-primary" />
            Kelola Stok
          </DialogTitle>

          <DialogDescription>
            Restock akan menambah stok. Koreksi stok akan mengatur jumlah stok
            menjadi nilai baru.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">Produk</p>

            <p className="mt-1 font-semibold">{product.name}</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Stok saat ini: {product.stock} unit
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="stock-flow-type" className="text-sm font-medium">
              Jenis Perubahan
            </label>

            <select
              id="stock-flow-type"
              value={type}
              onChange={(event) =>
                setType(event.target.value as "IN" | "ADJUSTMENT")
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary"
            >
              <option value="IN">Restock</option>
              <option value="ADJUSTMENT">Koreksi Stok</option>
            </select>
          </div>

          {type === "IN" ? (
            <div className="space-y-2">
              <label htmlFor="stock-quantity" className="text-sm font-medium">
                Jumlah Restock
              </label>

              <Input
                id="stock-quantity"
                type="number"
                min={1}
                placeholder="Contoh: 10"
                value={quantity}
                onChange={(event) => {
                  setQuantity(event.target.value);
                  setError("");
                }}
                className="rounded-xl bg-slate-50"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="stock-value" className="text-sm font-medium">
                Stok Baru
              </label>

              <Input
                id="stock-value"
                type="number"
                min={0}
                value={stock}
                onChange={(event) => {
                  setStock(event.target.value);
                  setError("");
                }}
                className="rounded-xl bg-slate-50"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="stock-note" className="text-sm font-medium">
              Catatan
            </label>

            <Input
              id="stock-note"
              placeholder="Contoh: Restock dari supplier"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="rounded-xl bg-slate-50"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Batal
            </Button>

            <Button
              type="button"
              className="omni-primary-button flex-1 gap-2"
              disabled={!isValid || isSubmitting}
              onClick={() => void handleSubmit()}
            >
              <Save className="size-4" />
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
