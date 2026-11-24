import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { BarChart3, Package, TrendingUp, XCircle } from "lucide-react";
import { useNavigate } from "react-router";

import {
  getCancellations,
  getLowStockProducts,
  getSalesSummary,
  getTopProducts,
} from "@/api/reportApi";
import { clearSession, getStoredUser } from "@/utils/auth";
import type {
  CancellationsResponse,
  LowStockResponse,
  ReportPeriod,
  SalesSummary,
  TopProductsResponse,
} from "@/types/report";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const periodOptions: {
  value: ReportPeriod;
  label: string;
}[] = [
  { value: "today", label: "Hari Ini" },
  { value: "week", label: "7 Hari Terakhir" },
  { value: "month", label: "30 Hari Terakhir" },
  { value: "custom", label: "Rentang Tanggal" },
];

export default function ReportsPage() {
  const navigate = useNavigate();

  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN";

  const [period, setPeriod] = useState<ReportPeriod>("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsResponse | null>(
    null,
  );
  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null);
  const [cancellations, setCancellations] =
    useState<CancellationsResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setIsLoading(true);
      setError("");

      try {
        const summaryData = await getSalesSummary(period, from, to);
        const topProductsData = await getTopProducts(period, from, to);
        const lowStockData = await getLowStockProducts();

        let cancellationData: CancellationsResponse | null = null;

        if (isAdmin) {
          cancellationData = await getCancellations(period, from, to);
        }

        if (!active) return;

        setSummary(summaryData);
        setTopProducts(topProductsData);
        setLowStock(lowStockData);
        setCancellations(cancellationData);
      } catch (error: unknown) {
        if (!active) return;

        if (isAxiosError<{ message?: string }>(error)) {
          if (error.response?.status === 401) {
            clearSession();
            navigate("/login", { replace: true });
            return;
          }

          setError(
            error.response?.data?.message ?? "Tidak dapat mengambil laporan.",
          );
        } else {
          setError("Terjadi kesalahan saat memuat laporan.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadReports();

    return () => {
      active = false;
    };
  }, [period, from, to, isAdmin, reloadKey, navigate]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          Analitik
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          Laporan Penjualan
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Pantau omzet, produk terlaris, stok kritis, dan pembatalan.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <label htmlFor="report-period" className="text-sm font-medium">
            Periode
          </label>

          <select
            id="report-period"
            value={period}
            onChange={(event) => setPeriod(event.target.value as ReportPeriod)}
            className="h-11 w-full min-w-44 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-primary"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {period === "custom" && (
          <>
            <div className="space-y-2">
              <label htmlFor="report-from" className="text-sm font-medium">
                Dari
              </label>

              <Input
                id="report-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="rounded-xl bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="report-to" className="text-sm font-medium">
                Sampai
              </label>

              <Input
                id="report-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="rounded-xl bg-slate-50"
              />
            </div>
          </>
        )}

        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          Muat Ulang
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Memuat laporan...
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="omni-surface p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-primary">
                  <TrendingUp className="size-5" />
                </div>

                <p className="text-sm text-muted-foreground">Total Omzet</p>
              </div>

              <p className="mt-3 text-xl font-bold">
                {summary ? rupiah.format(summary.totalRevenue) : "-"}
              </p>
            </div>

            <div className="omni-surface p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <BarChart3 className="size-5" />
                </div>

                <p className="text-sm text-muted-foreground">Transaksi Lunas</p>
              </div>

              <p className="mt-3 text-xl font-bold">
                {summary?.totalOrders ?? 0}
              </p>
            </div>

            <div className="omni-surface p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                  <Package className="size-5" />
                </div>

                <p className="text-sm text-muted-foreground">Item Terjual</p>
              </div>

              <p className="mt-3 text-xl font-bold">
                {summary?.totalItemsSold ?? 0}
              </p>
            </div>

            <div className="omni-surface p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                  <BarChart3 className="size-5" />
                </div>

                <p className="text-sm text-muted-foreground">
                  Rata-rata Transaksi
                </p>
              </div>

              <p className="mt-3 text-xl font-bold">
                {summary ? rupiah.format(summary.averageOrderValue) : "-"}
              </p>
            </div>
          </div>

          <section className="omni-surface p-5">
            <h2 className="font-semibold">Produk Terlaris</h2>

            {topProducts?.topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Belum ada penjualan pada periode ini.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {topProducts?.topProducts.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {index + 1}. {product.productName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {product.quantity} unit terjual
                      </p>
                    </div>

                    <p className="font-semibold text-primary">
                      {rupiah.format(product.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="omni-surface p-5">
            <h2 className="font-semibold">Stok Kritis</h2>

            {lowStock?.products.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Tidak ada produk dengan stok rendah.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {lowStock?.products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl bg-amber-50 p-4"
                  >
                    <p className="font-medium">{product.name}</p>

                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-white text-amber-700"
                    >
                      {product.stock} unit
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </section>

          {isAdmin && (
            <section className="omni-surface p-5">
              <h2 className="flex items-center gap-2 font-semibold">
                <XCircle className="size-4 text-red-600" />
                Laporan Pembatalan
              </h2>

              {cancellations?.cancellations.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  Tidak ada transaksi yang dibatalkan pada periode ini.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {cancellations?.cancellations.map((item) => (
                    <div
                      key={item.orderId}
                      className="rounded-xl bg-red-50 p-4 text-sm"
                    >
                      <p className="font-semibold">Order {item.orderId}</p>

                      <p className="mt-1">Total: {rupiah.format(item.total)}</p>

                      {item.reason && (
                        <p className="mt-1 text-muted-foreground">
                          Alasan: {item.reason}
                        </p>
                      )}

                      {item.decidedAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Diputuskan pada{" "}
                          {new Date(item.decidedAt).toLocaleString("id-ID", {
                            timeZone: "Asia/Jakarta",
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
