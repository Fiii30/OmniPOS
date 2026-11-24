import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import LoginPage from "@/features/auth/pages/LoginPage";
import ProductsPage from "@/features/products/pages/ProductsPage";
import OrdersPage from "@/features/orders/pages/OrderPage";
import OrderHistoryPage from "@/features/orders/pages/OrderHistoryPage";
import UsersPage from "@/features/users/pages/UsersPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";

import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";

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

            <Route path="/users" element={<UsersPage />} />

            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
