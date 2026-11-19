import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Package, Pencil, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router";

import { getProducts } from "@/api/productApi";
import { clearSession, getStoredUser } from "@/utils/auth";

import type { Product } from "@/types/product";

import ProductFormDialog from "../components/ProductFormDialog";

import { Badge } from "@/components/ui/badge";
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

export default function ProductsPage() {
  const navigate = useNavigate();

  const user = getStoredUser();
  const isAdmin = user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Mengubah nilai ini akan memicu pengambilan ulang produk.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getProducts();

        if (active) setProducts(data);
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
              "Tidak dapat mengambil produk. Periksa koneksi backend.",
          );
        } else {
          setError("Terjadi kesalahan saat memuat produk.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [navigate, reloadKey]);

  function openCreateForm() {
    setSelectedProduct(null);
    setSuccess("");
    setIsFormOpen(true);
  }

  function openEditForm(product: Product) {
    setSelectedProduct(product);
    setSuccess("");
    setIsFormOpen(true);
  }

  function handleSaved() {
    setSuccess(
      selectedProduct
        ? "Produk berhasil diperbarui."
        : "Produk berhasil ditambahkan.",
    );

    setIsFormOpen(false);
    setSelectedProduct(null);
    setReloadKey((value) => value + 1);
  }

  const keyword = search.trim().toLowerCase();

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(keyword),
  );

  const columnCount = isAdmin ? 5 : 4;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-primary uppercase">
            Inventori Toko
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Daftar Produk
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Kelola harga, stok, dan informasi produk toko.
          </p>
        </div>

        {isAdmin && (
          <Button
            className="omni-primary-button gap-2"
            onClick={openCreateForm}
          >
            <Plus className="size-4" />
            Tambah Produk
          </Button>
        )}
      </div>

      {success && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {success}
        </p>
      )}

      <section className="omni-surface overflow-hidden">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-primary">
              <Package className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">Inventori Produk</h2>

              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? "Memuat data..."
                  : `${products.length} produk terdaftar`}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              aria-label="Cari nama produk"
              placeholder="Cari nama produk..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="rounded-xl bg-slate-50 pl-10"
            />
          </div>
        </div>

        {error ? (
          <div className="m-5 space-y-3">
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
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
                <TableHead className="pl-5">Nama Produk</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Status</TableHead>

                {isAdmin && (
                  <TableHead className="pr-5 text-right">Aksi</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Memuat produk...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {keyword
                      ? "Tidak ada produk yang cocok."
                      : "Belum ada produk terdaftar."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="py-4 pl-5 font-medium">
                      {product.name}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {rupiah.format(product.price)}
                    </TableCell>

                    <TableCell>
                      <span
                        className={
                          product.stock <= 5
                            ? "font-medium text-amber-600"
                            : "text-slate-600"
                        }
                      >
                        {product.stock} unit
                      </span>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          product.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-500"
                        }
                      >
                        {product.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>

                    {isAdmin && (
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(product)}
                          aria-label={`Edit ${product.name}`}
                          className="gap-2 rounded-lg border-blue-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </section>

      {isAdmin && isFormOpen && (
        <ProductFormDialog
          product={selectedProduct}
          onClose={() => setIsFormOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
