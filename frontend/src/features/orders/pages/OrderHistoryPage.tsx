import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Eye, Plus, Receipt, Search } from "lucide-react";
import { useNavigate } from "react-router";

import { getOrders } from "@/api/orderApi";
import { clearSession } from "@/utils/auth";
import type { Order } from "@/types/order";

import OrderDetailDialog from "../components/OrderDetailDialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function OrderHistoryPage() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getOrders();

        // Salin array, kemudian urutkan dari transaksi terbaru.
        const sortedOrders = [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        if (active) setOrders(sortedOrders);
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
              "Gagal mengambil riwayat transaksi.",
          );
        } else {
          setError("Terjadi kesalahan saat memuat transaksi.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, [navigate, reloadKey]);

  const keyword = search.trim().toLowerCase();

  const filteredOrders = orders.filter((order) =>
    order.id.toLowerCase().includes(keyword),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            Riwayat Operasional
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Riwayat Transaksi
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Periksa transaksi yang tersimpan dan detail produknya.
          </p>
        </div>

        <Button
          className="omni-primary-button gap-2"
          onClick={() => navigate("/orders")}
        >
          <Plus className="size-4" />
          Transaksi Baru
        </Button>
      </div>

      <section className="omni-surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-primary">
              <Receipt className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">Transaksi Tersimpan</h2>

              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? "Memuat..."
                  : `${filteredOrders.length} transaksi ditampilkan`}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              aria-label="Cari ID transaksi"
              placeholder="Cari ID transaksi..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="rounded-xl bg-slate-50 pl-10"
            />
          </div>
        </div>

        {error ? (
          <div className="space-y-3 p-5">
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="pl-5">ID Transaksi</TableHead>
                <TableHead>Waktu · WIB</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="pr-5 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Memuat transaksi...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {keyword
                      ? "ID transaksi tidak ditemukan."
                      : "Belum ada transaksi tersimpan."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="py-4 pl-5 font-mono text-xs">
                      {order.id}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </TableCell>

                    <TableCell className="whitespace-nowrap font-semibold">
                      {rupiah.format(order.total)}
                    </TableCell>

                    <TableCell className="pr-5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 rounded-lg text-blue-600"
                        onClick={() => setSelectedOrderId(order.id)}
                      >
                        <Eye className="size-4" />
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </section>

      {selectedOrderId && (
        <OrderDetailDialog
          key={selectedOrderId}
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
