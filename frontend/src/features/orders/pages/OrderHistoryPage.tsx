import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { ChevronLeft, ChevronRight, Eye, RotateCwClock } from "lucide-react";
import { useNavigate } from "react-router";

import { getOrders } from "@/api/orderApi";
import { clearSession } from "@/utils/auth";
import type { Order, OrderPagination } from "@/types/order";

import OrderDetailDialog from "../components/OrderDetailDialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: {
    label: "Belum Bayar",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  PAID: {
    label: "Sudah Bayar",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  CANCEL_REQUESTED: {
    label: "Ajukan Cancel",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<OrderPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getOrders(pagination.page, pagination.limit);

        if (!active) return;

        setOrders(data.orders);
        setPagination(data.pagination);
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
              "Tidak dapat mengambil riwayat transaksi.",
          );
        } else {
          setError("Terjadi kesalahan saat memuat riwayat transaksi.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, [pagination.page, pagination.limit, reloadKey, navigate]);

  function goToPage(page: number) {
    if (page < 1 || page > pagination.totalPages) return;

    setPagination((current) => ({
      ...current,
      page,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          Transaksi
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Riwayat Transaksi
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Lihat seluruh transaksi beserta status pembayarannya.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <section className="omni-surface overflow-hidden">
        <div className="flex items-center gap-3 border-b p-5">
          <div className="rounded-xl bg-blue-50 p-3 text-primary">
            <RotateCwClock className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">Daftar Transaksi</h2>

            <p className="text-xs text-muted-foreground">
              {isLoading
                ? "Memuat data..."
                : `${pagination.total} transaksi ditemukan`}
            </p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="pl-5">ID Transaksi</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  Memuat transaksi...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  Belum ada transaksi.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const status =
                  statusConfig[order.status] ?? statusConfig.PENDING;

                return (
                  <TableRow key={order.id}>
                    <TableCell className="py-4 pl-5">
                      <p className="font-medium">#{order.id.slice(0, 8)}</p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.id}
                      </p>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-semibold">
                      {rupiah.format(order.total)}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="pr-5 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-lg"
                        onClick={() => setDetailOrderId(order.id)}
                      >
                        <Eye className="size-3.5" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-3 border-t p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {pagination.page} dari {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => goToPage(pagination.page - 1)}
            >
              <ChevronLeft className="size-4" />
              Sebelumnya
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-lg"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() => goToPage(pagination.page + 1)}
            >
              Selanjutnya
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      {detailOrderId && (
        <OrderDetailDialog
          key={detailOrderId}
          orderId={detailOrderId}
          onClose={() => setDetailOrderId(null)}
          onUpdated={() => setReloadKey((value) => value + 1)}
        />
      )}
    </div>
  );
}
