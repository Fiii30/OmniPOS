// File ini berisi API untuk mengelola produk OmniPOS.

// Import Router dari Express untuk membuat route produk.
import { Router } from "express";

// Import zod untuk memvalidasi data dari frontend/Postman.
import { z } from "zod";

// Import middleware agar user wajib login menggunakan JWT.
import { authMiddleware } from "../middleware/auth";

// Import middleware untuk membatasi akses berdasarkan role.
import { roleMiddleware } from "../middleware/role";

// Import koneksi database Prisma 8.
import { db } from "../prisma/db";

// Membuat router khusus produk.
const router = Router();

// Aturan data saat ADMIN menambah produk baru.
const createProductSchema = z.object({
  // Nama produk wajib diisi dan minimal 2 karakter.
  name: z.string().min(2),

  // Harga produk wajib angka bulat positif.
  price: z.number().int().positive(),

  // Stok produk wajib angka bulat, minimal 0.
  stock: z.number().int().min(0),
});

// Aturan data saat ADMIN mengubah produk.
const updateProductSchema = z.object({
  // Nama produk boleh dikirim atau tidak.
  name: z.string().min(2).optional(),

  // Harga produk boleh dikirim atau tidak.
  price: z.number().int().positive().optional(),

  // Stok produk boleh dikirim atau tidak.
  stock: z.number().int().min(0).optional(),

  // Status aktif produk boleh dikirim atau tidak.
  isActive: z.boolean().optional(),
});

// GET /api/products
// Mengambil semua produk.
router.get(
  "/",

  // User harus login terlebih dahulu.
  authMiddleware,

  // ADMIN dan STAFF boleh melihat produk.
  roleMiddleware(["ADMIN", "STAFF"]),

  async (_req, res) => {
    try {
      // Mengambil seluruh produk dari tabel products.
      const products = await db.orm.public.Product.all();

      // Mengirim daftar produk ke Postman/frontend.
      return res.json({
        message: "Daftar produk berhasil diambil",
        products,
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// GET /api/products/:id
// Mengambil satu produk berdasarkan ID.
router.get(
  "/:id",

  // User harus login terlebih dahulu.
  authMiddleware,

  // ADMIN dan STAFF boleh melihat detail produk.
  roleMiddleware(["ADMIN", "STAFF"]),

  async (req, res) => {
    try {
      // Mengambil ID produk dari URL, contoh: /api/products/abc123
      const id = String(req.params.id);

      // Mencari produk berdasarkan ID.
      const product = await db.orm.public.Product.first({ id });

      // Jika produk tidak ditemukan.
      if (!product) {
        return res.status(404).json({
          message: "Produk tidak ditemukan",
        });
      }

      // Mengirim detail produk.
      return res.json({
        message: "Detail produk berhasil diambil",
        product,
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// POST /api/products
// Menambah produk baru.
router.post(
  "/",

  // User harus login terlebih dahulu.
  authMiddleware,

  // Hanya ADMIN yang boleh menambah produk.
  roleMiddleware(["ADMIN"]),

  async (req, res) => {
    try {
      // Memvalidasi data produk dari request body.
      const data = createProductSchema.parse(req.body);

      // Menyimpan produk baru ke tabel products.
      const product = await db.orm.public.Product.create({
        name: data.name,
        price: data.price,
        stock: data.stock,
      });

      // Mengirim response berhasil membuat produk.
      return res.status(201).json({
        message: "Produk berhasil ditambahkan",
        product,
      });
    } catch (error: any) {
      // Mengirim error jika data tidak valid atau database gagal.
      return res.status(400).json({
        message: error.message,
      });
    }
  },
);

// PUT /api/products/:id
// Mengubah produk berdasarkan ID.
router.put(
  "/:id",

  // User harus login terlebih dahulu.
  authMiddleware,

  // Hanya ADMIN yang boleh mengubah produk.
  roleMiddleware(["ADMIN"]),

  async (req, res) => {
    try {
      // Mengambil ID produk dari URL.
      const id = String(req.params.id);

      // Memvalidasi data yang ingin diubah.
      const data = updateProductSchema.parse(req.body);

      // Memastikan produk ada sebelum diubah.
      const existingProduct = await db.orm.public.Product.first({ id });

      // Jika produk tidak ditemukan.
      if (!existingProduct) {
        return res.status(404).json({
          message: "Produk tidak ditemukan",
        });
      }

      // Mengubah produk berdasarkan ID.
      const product = await db.orm.public.Product.where({ id }).update({
        name: data.name,
        price: data.price,
        stock: data.stock,
        isActive: data.isActive,
      });

      // Mengirim produk yang sudah diperbarui.
      return res.json({
        message: "Produk berhasil diperbarui",
        product,
      });
    } catch (error: any) {
      // Mengirim error jika data tidak valid atau database gagal.
      return res.status(400).json({
        message: error.message,
      });
    }
  },
);

// DELETE /api/products/:id
// Menghapus produk berdasarkan ID.
router.delete(
  "/:id",

  // User harus login terlebih dahulu.
  authMiddleware,

  // Hanya ADMIN yang boleh menghapus produk.
  roleMiddleware(["ADMIN"]),

  async (req, res) => {
    try {
      // Mengambil ID produk dari URL.
      const id = String(req.params.id);

      // Memastikan produk ada sebelum dihapus.
      const existingProduct = await db.orm.public.Product.first({ id });

      // Jika produk tidak ditemukan.
      if (!existingProduct) {
        return res.status(404).json({
          message: "Produk tidak ditemukan",
        });
      }

      // Menghapus produk berdasarkan ID.
      await db.orm.public.Product.where({ id }).delete();

      // Mengirim response berhasil menghapus produk.
      return res.json({
        message: "Produk berhasil dihapus",
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// Mengekspor router produk agar bisa dipakai di src/index.ts.
export default router;
