import { Navigate, Outlet } from "react-router";

import { getStoredUser } from "@/utils/auth";

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
