// API untuk register dan login user OmniPOS.

// Import Router dari Express
import { Router } from "express";

// Import bcrypt untuk hash dan compare password
import bcrypt from "bcrypt";

// Import zod untuk validasi input
import { z } from "zod";

// Import koneksi database Prisma 8
import { db } from "../prisma/db";

// Import fungsi membuat token JWT
import { createToken } from "../lib/jwt";

// Membuat router authentication
const router = Router();

// Validasi data register
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    // Validasi data dari frontend
    const data = registerSchema.parse(req.body);

    // Mencari user berdasarkan email
    const existingUser = await db.orm.public.User.where({
      email: data.email,
    }).first();

    // Jika email sudah dipakai
    if (existingUser) {
      return res.status(400).json({
        message: "Email sudah terdaftar",
      });
    }

    // Mengubah password menjadi hash
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Menyimpan user baru ke tabel users
    const user = await db.orm.public.User.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,

      // Jika role tidak dikirim, otomatis STAFF
      role: data.role ?? "STAFF",
    });

    // Mengirim data user tanpa password
    return res.status(201).json({
      message: "Register berhasil",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Mengirim error validasi atau database
    return res.status(400).json({
      message: error.message,
    });
  }
});

// Validasi data login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    // Validasi data login
    const data = loginSchema.parse(req.body);

    // Mencari user berdasarkan email
    const user = await db.orm.public.User.where({
      email: data.email,
    }).first();

    // Jika user tidak ditemukan
    if (!user) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    // Membandingkan password dengan hash di database
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    // Jika password salah
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email atau password salah",
      });
    }

    // Membuat token JWT
    const token = createToken({
      userId: user.id,
      role: user.role,
    });

    // Mengirim token dan data user
    return res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    // Mengirim error validasi
    return res.status(400).json({
      message: error.message,
    });
  }
});

// Mengekspor router auth
export default router;
