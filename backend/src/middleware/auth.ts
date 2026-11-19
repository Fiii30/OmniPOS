// Middleware untuk memeriksa apakah user sudah login menggunakan JWT.

import type { Request, Response, NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt";

// Menambahkan properti user ke request Express
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Middleware autentikasi
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Mengambil header Authorization
  const header = req.headers.authorization;

  // Header harus berformat: Bearer <token>
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Token tidak ada atau format salah",
    });
  }

  // Mengambil token setelah kata "Bearer "
  const token = header.split(" ")[1];

  try {
    // Memverifikasi token
    const payload = verifyToken(token);

    // Menyimpan data user ke request
    req.user = payload;

    // Melanjutkan ke endpoint berikutnya
    next();
  } catch {
    // Token tidak valid atau sudah kadaluarsa
    return res.status(401).json({
      message: "Token tidak valid",
    });
  }
}
