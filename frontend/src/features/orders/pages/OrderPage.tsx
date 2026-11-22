import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";

import {
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { getProducts } from "@/api/productApi";
import { createOrder } from "@/api/orderApi";

import { clearSession } from "@/utils/auth";
import type { Product } from "@/types/product";
import type { Order } from "@/types/order";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaymentDialog from "../components/PaymentDialog";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type CartItem = {
  product: Product;
  quantity: number;
};

export default function OrdersPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

  // Mencegah pemanggilan submit berulang pada komponen ini.
  const submitLock = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data = await getProducts();

        if (active) {
          setProducts(data);
        }
      } catch (error: unknown) {
        if (!active) return;

        if (isAxiosError<{ message?: string }>(error)) {
          if (error.response?.status === 401) {
            clearSession();
            navigate("/login", { replace: true });
            return;
          }

          setLoadError(
            error.response?.data?.message ??
              "Gagal memuat produk. Pastikan backend aktif.",
          );
        } else {
          setLoadError("Terjadi kesalahan saat memuat produk.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [navigate, reloadKey]);

  const keyword = search.trim().toLowerCase();

  const visibleProducts = products.filter(
    (product) =>
      product.isActive && product.name.toLowerCase().includes(keyword),
  );

  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);

  const estimatedTotal = cart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  function addToCart(product: Product) {
    if (submitLock.current || product.stock <= 0) return;

    setSubmitError("");
    setLastOrder(null);

    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) return current;

        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  }

  function changeQuantity(productId: string, delta: number) {
    if (submitLock.current) return;

    setSubmitError("");

    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) return item;

          return {
            ...item,
            quantity: Math.min(
              item.product.stock,
              Math.max(0, item.quantity + delta),
            ),
          };
        })
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(productId: string) {
    if (submitLock.current) return;

    setSubmitError("");

    setCart((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  }

  async function handleSubmit() {
    if (submitLock.current || cart.length === 0 || isLoading || loadError) {
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    setSubmitError("");
    setLastOrder(null);

    try {
      const response = await createOrder({
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      });

      setLastOrder(response.order);
      setPaymentOrder(response.order);
      setCart([]);

      // Mengambil stok terbaru setelah transaksi berhasil.
      setReloadKey((value) => value + 1);
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        if (error.response?.status === 401) {
          clearSession();
          navigate("/login", { replace: true });
          return;
        }

        setSubmitError(
          error.response?.data?.message ??
            "Status transaksi belum dapat dipastikan. Periksa daftar transaksi sebelum mencoba lagi.",
        );
      } else {
        setSubmitError(
          "Status transaksi belum dapat dipastikan. Periksa daftar transaksi sebelum mencoba lagi.",
        );
      }
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            Operasional Kasir
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Transaksi Baru
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Pilih produk, periksa keranjang, lalu simpan transaksi.
          </p>
        </div>

        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => navigate("/order-history")}
          disabled={isSubmitting || cart.length > 0}
        >
          Riwayat Transaksi
        </Button>
      </div>

      {lastOrder && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <p className="font-semibold">Transaksi berhasil disimpan</p>

          <p className="mt-1 break-all">ID: {lastOrder.id}</p>

          <p className="mt-1">
            Total dari server: {rupiah.format(lastOrder.total)}
          </p>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Katalog produk */}
        <section className="omni-surface overflow-hidden">
          <div className="space-y-4 border-b p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-primary">
                <Package className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold">Pilih Produk</h2>

                <p className="text-xs text-muted-foreground">
                  Hanya produk aktif yang ditampilkan
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                aria-label="Cari produk untuk transaksi"
                placeholder="Cari nama produk..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="rounded-xl bg-slate-50 pl-10"
              />
            </div>
          </div>

          {loadError ? (
            <div className="space-y-3 p-5">
              <p
                role="alert"
                className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {loadError}
              </p>

              <Button
                variant="outline"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                Coba Lagi
              </Button>
            </div>
          ) : isLoading ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Memuat produk...
            </p>
          ) : visibleProducts.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Tidak ada produk yang tersedia atau cocok.
            </p>
          ) : (
            <div className="grid gap-3 p-5 sm:grid-cols-2 2xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const cartQuantity =
                  cart.find((item) => item.product.id === product.id)
                    ?.quantity ?? 0;

                const remaining = Math.max(0, product.stock - cartQuantity);

                return (
                  <article
                    key={product.id}
                    className="flex flex-col rounded-xl border bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                      <Package className="size-5" />
                    </div>

                    <h3 className="font-semibold">{product.name}</h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Stok: {product.stock}
                    </p>

                    <p className="mt-3 font-bold text-primary">
                      {rupiah.format(product.price)}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 gap-2 rounded-lg border-blue-100 text-blue-600 hover:bg-blue-50"
                      disabled={remaining === 0 || isSubmitting}
                      onClick={() => addToCart(product)}
                    >
                      <Plus className="size-4" />

                      {product.stock === 0
                        ? "Stok Habis"
                        : remaining === 0
                          ? "Batas Stok"
                          : "Tambah"}
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Keranjang */}
        <aside className="omni-surface overflow-hidden xl:sticky xl:top-24">
          <div className="flex items-center gap-3 border-b p-5">
            <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
              <ShoppingCart className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">Keranjang</h2>

              <p className="text-xs text-muted-foreground">
                {cart.length} jenis · {totalQuantity} unit
              </p>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <ShoppingCart className="mx-auto size-9 text-slate-300" />

              <p className="mt-3 text-sm text-muted-foreground">
                Keranjang masih kosong.
              </p>
            </div>
          ) : (
            <div className="max-h-420px  divide-y overflow-y-auto px-5">
              {cart.map((item) => (
                <div key={item.product.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {item.product.name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {rupiah.format(item.product.price)} / unit
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Hapus ${item.product.name} dari keranjang`}
                      disabled={isSubmitting}
                      onClick={() => removeItem(item.product.id)}
                      className="size-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-lg"
                        disabled={isSubmitting}
                        aria-label={`Kurangi ${item.product.name}`}
                        onClick={() => changeQuantity(item.product.id, -1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>

                      <span className="min-w-6 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-8 rounded-lg"
                        disabled={
                          isSubmitting || item.quantity >= item.product.stock
                        }
                        aria-label={`Tambah ${item.product.name}`}
                        onClick={() => changeQuantity(item.product.id, 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>

                    <p className="text-sm font-semibold">
                      {rupiah.format(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4 border-t bg-slate-50/60 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                Estimasi Total
              </span>

              <span className="text-xl font-bold text-primary">
                {rupiah.format(estimatedTotal)}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Harga dan ketersediaan stok akan diperiksa kembali oleh server
              saat transaksi disimpan.
            </p>

            {submitError && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {submitError}
              </p>
            )}

            <Button
              type="button"
              className="omni-primary-button w-full gap-2"
              disabled={
                cart.length === 0 ||
                isSubmitting ||
                isLoading ||
                Boolean(loadError)
              }
              onClick={() => void handleSubmit()}
            >
              <ShoppingCart className="size-4" />

              {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
            </Button>

            {paymentOrder && (
              <PaymentDialog
                key={paymentOrder.id}
                order={paymentOrder}
                onClose={() => setPaymentOrder(null)}
                onPaid={(paidOrder) => {
                  setLastOrder(paidOrder);
                  setPaymentOrder(null);
                }}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
