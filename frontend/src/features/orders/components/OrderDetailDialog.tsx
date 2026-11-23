import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { CheckCircle2, History, XCircle, Banknote } from "lucide-react";
import { useNavigate } from "react-router";

import {
  decideOrderCancel,
  getOrderDetail,
  requestOrderCancel,
} from "@/api/orderApi";
import { clearSession, getStoredUser } from "@/utils/auth";
import type { OrderDetailResponse } from "@/types/order";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaymentDialog from "./PaymentDialog";

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

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Sudah Dibayar",
  CANCEL_REQUESTED: "Menunggu Persetujuan Cancel",
  CANCELLED: "Dibatalkan",
};

const statusStyles: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCEL_REQUESTED: "border-blue-200 bg-blue-50 text-blue-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

type Props = {
  orderId: string;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function OrderDetailDialog({
  orderId,
  onClose,
  onUpdated,
}: Props) {
  const navigate = useNavigate();

  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN";

  const [detail, setDetail] = useState<OrderDetailResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [cancelReason, setCancelReason] = useState("");
  const [decisionReason, setDecisionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      setIsLoading(true);
      setError("");
      setDetail(null);

      try {
        const data = await getOrderDetail(orderId);

        if (active) setDetail(data);
      } catch (error: unknown) {
        if (!active) return;

        if (isAxiosError<{ message?: string }>(error)) {
          if (error.response?.status === 401) {
            clearSession();
            navigate("/login", { replace: true });
            return;
          }

          setError(
            error.response?.data?.message ??
              "Gagal mengambil detail transaksi.",
          );
        } else {
          setError("Terjadi kesalahan saat memuat detail.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [orderId, reloadKey, navigate]);

  async function handleCancelRequest() {
    if (cancelReason.trim().length < 3 || isSubmitting) return;

    setIsSubmitting(true);
    setActionError("");

    try {
      await requestOrderCancel(orderId, {
        reason: cancelReason.trim(),
      });

      setCancelReason("");
      setReloadKey((value) => value + 1);
      onUpdated?.();
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setActionError(
          error.response?.data?.message ??
            "Gagal mengirim pengajuan pembatalan.",
        );
      } else {
        setActionError("Terjadi kesalahan saat mengirim pengajuan pembatalan.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelDecision(action: "APPROVE" | "REJECT") {
    if (decisionReason.trim().length < 3 || isSubmitting) return;

    setIsSubmitting(true);
    setActionError("");

    try {
      await decideOrderCancel(orderId, {
        action,
        reason: decisionReason.trim(),
      });

      setDecisionReason("");
      setReloadKey((value) => value + 1);
      onUpdated?.();
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setActionError(
          error.response?.data?.message ??
            "Gagal memproses keputusan pembatalan.",
        );
      } else {
        setActionError(
          "Terjadi kesalahan saat memproses keputusan pembatalan.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const order = detail?.order;
  const canRequestCancel =
    order?.status === "PENDING" || order?.status === "PAID";

  const needsDecision = order?.status === "CANCEL_REQUESTED";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Transaksi</DialogTitle>

          <DialogDescription className="break-all">
            ID: {orderId}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Memuat detail transaksi...
          </p>
        ) : error ? (
          <div className="space-y-3">
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>

            <Button
              variant="outline"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Coba Lagi
            </Button>
          </div>
        ) : detail && order ? (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Waktu Transaksi · WIB
                  </p>

                  <p className="mt-1 font-medium">
                    {dateFormatter.format(new Date(order.createdAt))}
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                >
                  {statusLabels[order.status]}
                </span>
              </div>

              <div className="divide-y">
                {detail.items.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    Detail item tidak tersedia.
                  </p>
                ) : (
                  detail.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between gap-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {item.productName}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.quantity} × {rupiah.format(item.price)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        {rupiah.format(item.subtotal)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4">
                <span className="text-sm font-medium text-blue-700">
                  Total Transaksi
                </span>

                <span className="text-xl font-bold text-blue-700">
                  {rupiah.format(order.total)}
                </span>
              </div>
            </div>

            {detail.payments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Riwayat Pembayaran</h3>

                {detail.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-xl bg-slate-50 p-4 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">
                        {payment.method === "CASH"
                          ? "Cash"
                          : payment.method === "QRIS"
                            ? "QRIS"
                            : "Transfer Bank"}
                      </p>

                      <span className="text-xs font-semibold text-muted-foreground">
                        {payment.status}
                      </span>
                    </div>

                    <p className="mt-2">
                      Nominal: {rupiah.format(payment.amount)}
                    </p>

                    {payment.changeAmount > 0 && (
                      <p className="mt-1">
                        Kembalian: {rupiah.format(payment.changeAmount)}
                      </p>
                    )}

                    {payment.referenceCode && (
                      <p className="mt-1 break-all">
                        Referensi: {payment.referenceCode}
                      </p>
                    )}

                    {payment.paidAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(payment.paidAt))}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {detail.histories.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <History className="size-4" />
                  Riwayat Status
                </h3>

                <div className="space-y-2">
                  {detail.histories
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((history) => (
                      <div
                        key={history.id}
                        className="rounded-xl bg-slate-50 p-3 text-sm"
                      >
                        <p className="font-medium">
                          {statusLabels[history.previousStatus]} →{" "}
                          {statusLabels[history.newStatus]}
                        </p>

                        {history.reason && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {history.reason}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-muted-foreground">
                          {dateFormatter.format(new Date(history.createdAt))}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {actionError && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {actionError}
              </p>
            )}

            {order.status === "PENDING" && (
              <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="text-sm font-semibold text-emerald-800">
                  Pembayaran
                </h3>

                <p className="text-sm text-emerald-700">
                  Transaksi ini belum dibayar. Total yang harus dibayar adalah{" "}
                  {rupiah.format(order.total)}.
                </p>

                <Button
                  type="button"
                  className="omni-primary-button w-full gap-2 rounded-xl"
                  onClick={() => setIsPaymentOpen(true)}
                >
                  <Banknote className="size-4" />
                  Bayar Sekarang
                </Button>
              </div>
            )}

            {canRequestCancel && (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-800">
                  Ajukan Pembatalan
                </h3>

                <Input
                  placeholder="Tulis alasan pembatalan"
                  value={cancelReason}
                  onChange={(event) => {
                    setCancelReason(event.target.value);
                    setActionError("");
                  }}
                  className="rounded-xl bg-white"
                />

                <Button
                  type="button"
                  className="w-full gap-2 rounded-xl bg-amber-700"
                  disabled={cancelReason.trim().length < 3 || isSubmitting}
                  onClick={() => void handleCancelRequest()}
                >
                  <XCircle className="size-4" />
                  {isSubmitting ? "Mengirim..." : "Ajukan Cancel"}
                </Button>
              </div>
            )}

            {isAdmin && needsDecision && (
              <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="text-sm font-semibold text-blue-800">
                  Keputusan Pembatalan
                </h3>

                <Input
                  placeholder="Tulis alasan keputusan"
                  value={decisionReason}
                  onChange={(event) => {
                    setDecisionReason(event.target.value);
                    setActionError("");
                  }}
                  className="rounded-xl bg-white"
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 gap-2 rounded-xl"
                    disabled={decisionReason.trim().length < 3 || isSubmitting}
                    onClick={() => void handleCancelDecision("REJECT")}
                  >
                    <XCircle className="size-4" />
                    Tolak
                  </Button>

                  <Button
                    type="button"
                    className="omni-primary-button flex-1 gap-2"
                    disabled={decisionReason.trim().length < 3 || isSubmitting}
                    onClick={() => void handleCancelDecision("APPROVE")}
                  >
                    <CheckCircle2 className="size-4" />
                    Setujui
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <Button variant="outline" className="mt-2 rounded-xl" onClick={onClose}>
          Tutup
        </Button>

        {isPaymentOpen && order && (
          <PaymentDialog
            key={order.id}
            order={order}
            onClose={() => setIsPaymentOpen(false)}
            onPaid={() => {
              setIsPaymentOpen(false);
              setReloadKey((value) => value + 1);
              onUpdated?.();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
