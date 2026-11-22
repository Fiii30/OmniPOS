import { useState } from "react";
import { isAxiosError } from "axios";
import { Banknote, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";

import { payOrder } from "@/api/orderApi";
import { clearSession } from "@/utils/auth";
import type { Order } from "@/types/order";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type Props = {
  order: Order;
  onClose: () => void;
  onPaid: (paidOrder: Order) => void;
};

export default function PaymentDialog({
  order,
  onClose,
  onPaid,
}: Props) {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const amountPaid = Number(amount);

  const isValidAmount =
    amount !== "" &&
    Number.isFinite(amountPaid) &&
    amountPaid > 0;

  const changeAmount = isValidAmount
    ? amountPaid - order.total
    : 0;

  const isEnough = isValidAmount && amountPaid >= order.total;

  async function handlePay() {
    if (!isValidAmount || !isEnough || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await payOrder(order.id, {
        amountPaid,
      });

      onPaid(response.order);
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setError(
          error.response?.data?.message ??
            "Gagal memproses pembayaran."
        );
      } else {
        setError("Terjadi kesalahan saat memproses pembayaran.");
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
            <Banknote className="size-5 text-primary" />
            Pembayaran
          </DialogTitle>

          <DialogDescription>
            Masukkan uang yang diterima dari pelanggan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground">
              Total Transaksi
            </p>

            <p className="mt-1 text-xl font-bold text-primary">
              {rupiah.format(order.total)}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="amount-paid"
              className="text-sm font-medium"
            >
              Uang Diterima
            </label>

            <Input
              id="amount-paid"
              type="number"
              min={0}
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              className="rounded-xl bg-slate-50"
            />
          </div>

          <div
            className={`rounded-xl p-4 text-sm ${
              isEnough
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-50 text-muted-foreground"
            }`}
          >
            <p className="font-medium">
              {isEnough ? "Kembalian" : "Status Uang"}
            </p>

            <p className="mt-1 font-bold">
              {isEnough
                ? rupiah.format(changeAmount)
                : isValidAmount
                  ? "Uang diterima masih kurang"
                  : "Masukkan jumlah uang"}
            </p>
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
              variant="outline"
              className="flex-1 rounded-xl"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Batal
            </Button>

            <Button
              className="omni-primary-button flex-1 gap-2"
              disabled={!isEnough || isSubmitting}
              onClick={() => void handlePay()}
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Memproses..." : "Konfirmasi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}