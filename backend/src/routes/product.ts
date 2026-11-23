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

// Aturan untuk restock atau koreksi stok.
const stockFlowSchema = z.object({
  type: z.enum(["IN", "ADJUSTMENT"]),
  quantity: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  note: z.string().optional(),
});

// GET /api/products
// Mengambil semua produk.
// GET /api/products
// Mengambil daftar produk, dengan opsi pencarian dan filter stok rendah.
router.get(
  "/",

  // User harus login terlebih dahulu.
  authMiddleware,

  // ADMIN dan STAFF boleh melihat produk.
  roleMiddleware(["ADMIN", "STAFF"]),

  async (req, res) => {
    try {
      // Mengambil seluruh produk dari tabel products.
      const products = await db.orm.public.Product.all();

      // Mengambil kata pencarian dari query URL.
      const search = req.query.search;

      // Mengambil opsi filter stok rendah dari query URL.
      const lowStock = req.query.lowStock;

      // Menyimpan hasil produk setelah difilter.
      let filteredProducts = products;

      // Jika ada parameter search.
      if (search) {
        // Mengubah nilai query menjadi string dan huruf kecil.
        const keyword = String(search).toLowerCase();

        // Menyaring produk yang namanya mengandung kata pencarian.
        filteredProducts = filteredProducts.filter((product) =>
          product.name.toLowerCase().includes(keyword),
        );
      }

      // Jika ada parameter lowStock=true.
      if (lowStock === "true") {
        // Menyaring produk dengan stok 5 atau kurang.
        filteredProducts = filteredProducts.filter(
          (product) => product.stock <= 5,
        );
      }

      // Mengirim daftar produk hasil filter.
      return res.json({
        message: "Daftar produk berhasil diambil",
        total: filteredProducts.length,
        products: filteredProducts,
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

// POST /api/products/:id/stock
// Hanya ADMIN yang dapat restock atau menyesuaikan stok.
router.post(
  "/:id/stock",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const data = stockFlowSchema.parse(req.body);

      const user = req as { user?: { userId?: string } };

      if (!user.user?.userId) {
        return res.status(401).json({
          message: "User tidak ditemukan pada token",
        });
      }

      const userId = String(user.user.userId);

      const flow = await db.transaction(async (tx) => {
        const productPlan = tx.sql.public.products
          .select("id", "name", "stock")
          .where((f, fns) => fns.eq(f.id, id))
          .forUpdate()
          .build();

        const [product] = await tx.query(productPlan);

        if (!product) {
          throw new Error("Produk tidak ditemukan");
        }

        let quantity = 0;
        let stockAfter = product.stock;

        if (data.type === "IN") {
          if (!data.quantity) {
            throw new Error("Jumlah stok wajib diisi untuk restock");
          }

          quantity = data.quantity;
          stockAfter = product.stock + quantity;
        } else {
          if (data.stock === undefined) {
            throw new Error("Stok baru wajib diisi untuk penyesuaian stok");
          }

          quantity = Math.abs(data.stock - product.stock);
          stockAfter = data.stock;
        }

        await tx.orm.public.Product.where({
          id,
        }).update({
          stock: stockAfter,
        });

        return await tx.orm.public.StockFlow.create({
          productId: id,
          type: data.type,
          quantity,
          stockBefore: product.stock,
          stockAfter,
          changedById: userId,
          note: data.note ?? null,
        });
      });

      return res.status(201).json({
        message: "Perubahan stok berhasil dicatat",
        stockFlow: flow,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Data stok tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mencatat perubahan stok",
      });
    }
  },
);
// Mengekspor router produk agar bisa dipakai di src/index.ts.
export default router;
