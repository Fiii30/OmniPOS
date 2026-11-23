import { useState } from "react";
import { isAxiosError } from "axios";
import { Banknote, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";

import { payOrder } from "@/api/orderApi";
import { clearSession } from "@/utils/auth";
import type { Order, PaymentMethod } from "@/types/order";

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

const paymentMethods: {
  value: PaymentMethod;
  label: string;
}[] = [
  { value: "CASH", label: "Cash" },
  { value: "QRIS", label: "QRIS" },
  { value: "TRANSFER_BANK", label: "Transfer Bank" },
];

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

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const amountPaid = Number(amount);

  const isCash = method === "CASH";

  const isValidCashAmount =
    !isCash ||
    (amount !== "" &&
      Number.isFinite(amountPaid) &&
      amountPaid >= order.total);

  const isValidReference =
    isCash || referenceCode.trim().length > 0;

  const canSubmit =
    isValidCashAmount && isValidReference && !isSubmitting;

  const changeAmount = isCash && isValidCashAmount
    ? amountPaid - order.total
    : 0;

  async function handlePay() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await payOrder(order.id, {
        method,
        amountPaid: isCash ? amountPaid : undefined,
        referenceCode: isCash ? undefined : referenceCode.trim(),
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
            Pilih metode pembayaran dan masukkan data yang diperlukan.
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
              htmlFor="payment-method"
              className="text-sm font-medium"
            >
              Metode Pembayaran
            </label>

            <select
              id="payment-method"
              value={method}
              onChange={(event) => {
                setMethod(event.target.value as PaymentMethod);
                setError("");
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary"
            >
              {paymentMethods.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {isCash ? (
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
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="reference-code"
                className="text-sm font-medium"
              >
                Kode Referensi
              </label>

              <Input
                id="reference-code"
                placeholder="Masukkan kode referensi"
                value={referenceCode}
                onChange={(event) => {
                  setReferenceCode(event.target.value);
                  setError("");
                }}
                className="rounded-xl bg-slate-50"
              />
            </div>
          )}

          <div
            className={`rounded-xl p-4 text-sm ${
              isCash && changeAmount > 0
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-50 text-muted-foreground"
            }`}
          >
            <p className="font-medium">
              {isCash ? "Kembalian" : "Status Pembayaran"}
            </p>

            <p className="mt-1 font-bold">
              {isCash
                ? changeAmount > 0
                  ? rupiah.format(changeAmount)
                  : isValidCashAmount
                    ? "Tidak ada kembalian"
                    : "Uang diterima masih kurang"
                : "Menunggu konfirmasi pembayaran"}
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
              disabled={!canSubmit}
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