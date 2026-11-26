import { Printer, X } from "lucide-react";

import type { OrderDetailResponse } from "@/types/order";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
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

type Props = {
  detail: OrderDetailResponse;
  onClose: () => void;
};

export default function ReceiptPreviewDialog({ detail, onClose }: Props) {
  const order = detail.order;

  const subtotal = detail.items.reduce(
    (total, item) => total + item.subtotal,
    0,
  );

  const tax = order.total - subtotal;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader className="print-hide">
          <DialogTitle>Preview Struk</DialogTitle>
        </DialogHeader>

        <div className="print-area rounded-xl border bg-white p-5 font-mono text-sm text-black">
          <div className="text-center">
            <h2 className="text-lg font-bold">OmniPOS</h2>

            <p className="text-xs">Struk Transaksi</p>
          </div>

          <div className="mt-4 space-y-1">
            <p className="break-all">No: {order.id}</p>

            <p>
              Tanggal: {dateFormatter.format(new Date(order.createdAt))} WIB
            </p>

            <p>Status: {statusLabels[order.status]}</p>
          </div>

          <div className="my-4 border-t border-dashed border-black" />

          <div className="space-y-3">
            {detail.items.length === 0 ? (
              <p>Detail item tidak tersedia.</p>
            ) : (
              detail.items.map((item) => (
                <div key={item.id}>
                  <p className="font-semibold">{item.productName}</p>

                  <div className="flex justify-between">
                    <span>
                      {item.quantity} × {rupiah.format(item.price)}
                    </span>

                    <span>{rupiah.format(item.subtotal)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="my-4 border-t border-dashed border-black" />

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{rupiah.format(subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>PPN 11%</span>
              <span>{rupiah.format(tax)}</span>
            </div>

            <div className="flex justify-between border-t border-black pt-2 text-base font-bold">
              <span>Total</span>
              <span>{rupiah.format(order.total)}</span>
            </div>
          </div>

          {detail.payments.length > 0 && (
            <div className="mt-4 space-y-1">
              <div className="border-t border-dashed border-black pt-3">
                <p className="font-semibold">Pembayaran</p>
              </div>

              {detail.payments.map((payment) => (
                <div key={payment.id}>
                  <div className="flex justify-between">
                    <span>
                      {payment.method === "CASH"
                        ? "Cash"
                        : payment.method === "QRIS"
                          ? "QRIS"
                          : "Transfer Bank"}
                    </span>

                    <span>{rupiah.format(payment.amount)}</span>
                  </div>

                  {payment.changeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Kembalian</span>
                      <span>{rupiah.format(payment.changeAmount)}</span>
                    </div>
                  )}

                  {payment.referenceCode && (
                    <p className="break-all">Ref: {payment.referenceCode}</p>
                  )}

                  {payment.paidAt && (
                    <p>
                      Dibayar: {dateFormatter.format(new Date(payment.paidAt))}{" "}
                      WIB
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-xs">
            Terima kasih telah berbelanja
          </p>
        </div>

        <div className="print-hide flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 rounded-xl"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 rounded-xl"
            onClick={onClose}
          >
            <X className="size-4" />
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
