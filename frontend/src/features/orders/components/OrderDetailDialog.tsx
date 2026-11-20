import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";

import { getOrderDetail } from "@/api/orderApi";
import { clearSession } from "@/utils/auth";
import type { OrderDetailResponse } from "@/types/order";

import { Button } from "@/components/ui/button";

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

type Props = {
  orderId: string;
  onClose: () => void;
};

export default function OrderDetailDialog({ orderId, onClose }: Props) {
  const navigate = useNavigate();

  const [detail, setDetail] = useState<OrderDetailResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

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
        ) : detail ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="text-xs text-muted-foreground">
                Waktu Transaksi · WIB
              </p>

              <p className="mt-1 font-medium">
                {dateFormatter.format(new Date(detail.order.createdAt))}
              </p>
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
                {rupiah.format(detail.order.total)}
              </span>
            </div>
          </div>
        ) : null}

        <Button variant="outline" className="mt-2 rounded-xl" onClick={onClose}>
          Tutup
        </Button>
      </DialogContent>
    </Dialog>
  );
}
