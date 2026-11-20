import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import LoginPage from "@/features/auth/pages/LoginPage";
import ProductsPage from "@/features/products/pages/ProductsPage";
import OrdersPage from "@/features/orders/pages/OrderPage";
import OrderHistoryPage from "@/features/orders/pages/OrderHistoryPage";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

function ComingSoon({ title }: { title: string }) {
  return (
    <section className="omni-surface p-6">
      <h1 className="text-2xl font-bold">{title}</h1>

      <p className="mt-2 text-sm text-muted-foreground">
        Halaman ini akan kita sambungkan pada tahap berikutnya.
      </p>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/products" replace />} />

            <Route path="/products" element={<ProductsPage />} />

            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/order-history" element={<OrderHistoryPage />} />

            <Route
              path="/users"
              element={<ComingSoon title="Manajemen User" />}
            />

            <Route
              path="/reports"
              element={<ComingSoon title="Laporan Penjualan" />}
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
