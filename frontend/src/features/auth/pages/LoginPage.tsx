import { useState } from "react";
import type { ComponentProps } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";

import {
  ArrowRight,
  AtSign,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  LockKeyhole,
  Monitor,
  ShieldCheck,
  ShoppingBag,
  Smile,
  UserRound,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

import { loginUser } from "@/api/authApi";

type LoginSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>;

const features = [
  {
    icon: Zap,
    title: "Transaksi Cepat",
    description: "Layani pelanggan dengan proses kasir yang praktis.",
  },
  {
    icon: ClipboardList,
    title: "Pencatatan Otomatis",
    description: "Stok dan riwayat penjualan tersimpan dalam satu tempat.",
  },
  {
    icon: Smile,
    title: "Mudah Digunakan",
    description: "Antarmuka sederhana untuk kegiatan operasional toko.",
  },
];

function BrandingPanel() {
  return (
    <section className="omni-auth-panel relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col xl:p-14">
      <div className="omni-dot-pattern pointer-events-none absolute inset-0 opacity-30" />

      <header className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-lg">
            <Monitor className="size-7" />
          </div>

          <div>
            <p className="text-2xl font-bold tracking-tight">OmniPOS</p>
            <p className="text-xs text-blue-100">
              Solusi Kasir & Manajemen Toko
            </p>
          </div>
        </div>

        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-blue-100">
          POS Retail
        </span>
      </header>

      <div className="relative my-auto py-14">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-blue-50">
          <Zap className="size-4 text-cyan-300" />
          Portal Operasional Toko
        </div>

        <h1 className="max-w-xl text-4xl leading-[1.1] font-bold tracking-tight xl:text-5xl">
          Kelola Transaksi Toko dengan Lebih Mudah
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-blue-100">
          Bantu tim melayani pelanggan dengan cepat, mencatat penjualan, dan
          mengelola inventori dalam satu aplikasi.
        </p>

        <div className="mt-7 grid grid-cols-3 gap-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-white/15 bg-white/10 p-3.5"
            >
              <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-200">
                <Icon className="size-4" />
              </div>

              <h2 className="text-xs font-semibold">{title}</h2>

              <p className="mt-1.5 text-[11px] leading-relaxed text-blue-100">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <footer className="relative border-t border-white/15 pt-5 text-xs text-blue-100/70">
        © {new Date().getFullYear()} OmniPOS. Solusi operasional toko.
      </footer>
    </section>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit: LoginSubmitHandler = async (event) => {
    event.preventDefault();

    if (isLoading) return;

    setError("");
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });

      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      navigate("/products", { replace: true });
    } catch (error: unknown) {
      if (isAxiosError<{ message?: string }>(error)) {
        setError(
          error.response?.data?.message ??
            "Tidak dapat terhubung ke server. Pastikan backend aktif.",
        );
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigate = useNavigate();

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.1fr_0.9fr]">
      <BrandingPanel />

      <section className="flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-10 lg:px-8 xl:px-14">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="rounded-xl bg-primary p-2.5 text-white">
            <Monitor className="size-6" />
          </div>

          <span className="text-2xl font-bold tracking-tight">OmniPOS</span>
        </div>

        <div className="w-full max-w-md">
          <Card className="omni-surface gap-0 rounded-2xl py-0">
            <CardContent className="p-6 sm:p-9">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <UserRound className="size-3.5" />
                Portal Operasional Toko
              </div>

              <h2 className="text-2xl font-bold tracking-tight">
                Masuk ke Akun OmniPOS
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Gunakan akun ADMIN atau STAFF yang terdaftar di toko.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
                aria-busy={isLoading}
              >
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                {isSuccess && (
                  <div
                    role="status"
                    className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700"
                  >
                    <CheckCircle2 className="size-4 shrink-0" />
                    Login berhasil. Akun siap digunakan.
                  </div>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold tracking-wide text-slate-600 uppercase"
                  >
                    Email <span className="text-red-500">*</span>
                  </Label>

                  <div className="relative">
                    <AtSign className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      placeholder="nama@toko.com"
                      className="omni-input pl-10 pt-5 pb-5"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold tracking-wide text-slate-600 uppercase"
                  >
                    Password <span className="text-red-500">*</span>
                  </Label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      className="omni-input pr-12 pl-10 pt-5 pb-5"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isLoading}
                      required
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 text-emerald-500" />
                  Akses sesuai hak pengguna
                </div>

                <Button
                  type="submit"
                  className="omni-primary-button w-full pt-5 pb-5 gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses login..." : "Masuk ke OmniPOS"}
                  {!isLoading && <ArrowRight className="size-4" />}
                </Button>
              </form>

              <div className="mt-7 border-t pt-5 text-center">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Belum punya akun?{" "}
                  <span className="font-semibold text-slate-700">
                    Hubungi admin toko
                  </span>{" "}
                  untuk mendapatkan akses operasional.
                </p>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600">
                  <ShoppingBag className="size-3.5" />
                  OmniPOS · Kasir & Manajemen Toko
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-[11px] text-slate-400">
            Satu tempat untuk produk, transaksi, dan laporan toko.
          </p>
        </div>
      </section>
    </main>
  );
}
