// Middleware untuk membatasi endpoint berdasarkan role user.

import type { Request, Response, NextFunction } from "express";

// Fungsi menerima daftar role yang diizinkan
export function roleMiddleware(allowedRoles: Array<"ADMIN" | "STAFF">) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Jika user belum login
    if (!req.user) {
      return res.status(401).json({
        message: "Belum login",
      });
    }

    // Jika role user tidak diizinkan
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Akses ditolak",
      });
    }

    // Role sesuai, lanjut ke endpoint
    next();
  };
}
