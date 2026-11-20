import {
  BarChart3,
  ChevronRight,
  LogOut,
  Monitor,
  Package,
  Receipt,
  Users,
} from "lucide-react";

import { NavLink, Outlet, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { clearSession, getStoredUser } from "@/utils/auth";

const navigation = [
  {
    label: "Produk",
    to: "/products",
    icon: Package,
    adminOnly: false,
  },
  {
    label: "Kasir",
    to: "/orders",
    icon: Receipt,
    adminOnly: false,
  },
  {
    label: "Riwayat Transaksi",
    to: "/order-history",
    icon: Receipt,
    adminOnly: false,
  },
  {
    label: "Manajemen User",
    to: "/users",
    icon: Users,
    adminOnly: true,
  },
  {
    label: "Laporan",
    to: "/reports",
    icon: BarChart3,
    adminOnly: true,
  },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const menus = navigation.filter(
    (item) => !item.adminOnly || user?.role === "ADMIN",
  );

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-white lg:flex">
        <div className="flex h-24 items-center gap-3 border-b px-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-blue-200">
            <Monitor className="size-6" />
          </div>

          <div>
            <p className="text-xl font-bold tracking-tight">OmniPOS</p>
            <p className="text-xs text-muted-foreground">
              Kasir & Manajemen Toko
            </p>
          </div>
        </div>

        <div className="flex-1 px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
            Menu Utama
          </p>

          <nav className="space-y-2" aria-label="Navigasi utama">
            {menus.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")
                }
              >
                <Icon className="size-5" />
                {label}
                <ChevronRight className="ml-auto size-4 opacity-50" />
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t p-4">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-700">
              Operasional lebih rapi
            </p>

            <p className="mt-1 text-xs leading-relaxed text-blue-600/75">
              Kelola produk dan transaksi dalam satu tempat.
            </p>
          </div>

          <Button
            variant="ghost"
            className="mt-3 w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-4 border-b bg-white/95 px-5 backdrop-blur sm:px-8">
          <div>
            <p className="text-sm font-semibold">Portal Operasional</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Selamat datang kembali, {user?.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
              {user?.name.charAt(0).toUpperCase() || "U"}
            </div>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Keluar"
              onClick={handleLogout}
              className="lg:hidden"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Navigasi untuk tablet dan ponsel */}
        <nav
          aria-label="Navigasi mobile"
          className="flex gap-2 overflow-x-auto border-b bg-white px-5 py-3 lg:hidden"
        >
          {menus.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                  isActive ? "bg-blue-50 text-blue-600" : "text-slate-500",
                ].join(" ")
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto max-w-7xl p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
