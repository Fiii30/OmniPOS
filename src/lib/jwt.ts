// File untuk membuat dan memverifikasi token JWT.

// Import library jsonwebtoken
import jwt from "jsonwebtoken";

// Mengambil secret JWT dari file .env
const JWT_SECRET = process.env.JWT_SECRET as string;

// Tipe data yang disimpan di dalam token JWT
export type JwtPayload = {
  userId: string;
  role: "ADMIN" | "STAFF";
};

// Fungsi untuk membuat token JWT setelah login berhasil
export function createToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1d",
  });
}

// Fungsi untuk memverifikasi token JWT
export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}