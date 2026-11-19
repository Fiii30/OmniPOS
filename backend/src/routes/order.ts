// File ini berisi API untuk membuat dan melihat transaksi OmniPOS.

// Import Router dari Express untuk membuat route order.
import { Router } from "express";

// Import zod untuk memvalidasi data transaksi.
import { z } from "zod";

// Import middleware agar user wajib login menggunakan JWT.
import { authMiddleware } from "../middleware/auth";

// Import middleware untuk membatasi akses berdasarkan role.
import { roleMiddleware } from "../middleware/role";

// Import koneksi database Prisma 8.
import { db } from "../prisma/db";

// Membuat router khusus order.
const router = Router();

// Aturan untuk satu produk yang dibeli.
const orderItemSchema = z.object({
  // ID produk yang ingin dibeli.
  productId: z.string().min(1),

  // Jumlah produk yang dibeli, minimal 1.
  quantity: z.number().int().positive(),
});

// Aturan untuk membuat transaksi.
const createOrderSchema = z.object({
  // items harus berupa array berisi minimal 1 produk.
  items: z.array(orderItemSchema).min(1),
});

// POST /api/orders
// Membuat transaksi baru.
router.post(
  "/",

  // User harus login terlebih dahulu.
  authMiddleware,

  // ADMIN dan STAFF boleh membuat transaksi.
  roleMiddleware(["ADMIN", "STAFF"]),

  async (req, res) => {
    try {
      // Memvalidasi data transaksi dari request body.
      const data = createOrderSchema.parse(req.body);

      // Mengambil ID user yang sedang login dari token JWT.
      if (!req.user) {
        return res.status(401).json({
          message: "User tidak ditemukan pada token",
        });
      }
      // Mengambil ID user dari custom claim JWT.
      const userId = String((req.user as unknown as { userId: string }).userId);

      // Menjalankan beberapa query sebagai satu transaction.
      const order = await db.transaction(async (tx) => {
        // Menyimpan total harga transaksi.
        let total = 0;

        // Menyimpan data item yang akan dimasukkan ke OrderItem.
        const orderItems: {
          productId: string;
          productName: string;
          price: number;
          quantity: number;
          subtotal: number;

          // Menyimpan stok produk sebelum dikurangi.
          currentStock: number;
        }[] = [];

        // Memeriksa dan menghitung setiap produk yang dibeli.
        for (const item of data.items) {
          // Mengubah ID produk menjadi string.
          const productId = String(item.productId);

          // Mencari produk berdasarkan ID.
          const product = await tx.orm.public.Product.first({ id: productId });

          // Jika produk tidak ditemukan, transaction dibatalkan.
          if (!product) {
            throw new Error(`Produk dengan ID ${productId} tidak ditemukan`);
          }

          // Jika produk tidak aktif, transaction dibatalkan.
          if (!product.isActive) {
            throw new Error(`Produk ${product.name} tidak aktif`);
          }

          // Jika stok tidak cukup, transaction dibatalkan.
          if (product.stock < item.quantity) {
            throw new Error(`Stok produk ${product.name} tidak cukup`);
          }

          // Menghitung subtotal untuk produk ini.
          const subtotal = product.price * item.quantity;

          // Menambahkan subtotal ke total transaksi.
          total += subtotal;

          // Menyimpan data item sementara sebelum dibuat.
          orderItems.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: item.quantity,
            subtotal,

            // Menyimpan stok produk sebelum dikurangi.
            currentStock: product.stock,
          });
        }

        // Membuat order baru.
        const createdOrder = await tx.orm.public.Order.create({
          userId,
          total,
        });

        // Membuat OrderItem dan mengurangi stok untuk setiap produk.
        for (const item of orderItems) {
          // Membuat detail item transaksi.
          await tx.orm.public.OrderItem.create({
            orderId: createdOrder.id,
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          });

          // Mengurangi stok produk sesuai jumlah yang dibeli.
          await tx.orm.public.Product.where({ id: item.productId }).update({
            stock: item.currentStock - item.quantity,
          });
        }

        // Mengembalikan order yang sudah dibuat.
        return createdOrder;
      });

      // Mengirim response berhasil membuat transaksi.
      return res.status(201).json({
        message: "Transaksi berhasil dibuat",
        order,
      });
    } catch (error: any) {
      // Mengirim error jika data tidak valid, stok kurang, atau database gagal.
      return res.status(400).json({
        message: error.message,
      });
    }
  },
);

// GET /api/orders
// Mengambil semua transaksi.
router.get(
  "/",

  // User harus login terlebih dahulu.
  authMiddleware,

  // ADMIN dan STAFF boleh melihat transaksi.
  roleMiddleware(["ADMIN", "STAFF"]),

  async (_req, res) => {
    try {
      // Mengambil semua order dari tabel orders.
      const orders = await db.orm.public.Order.all();

      // Mengirim daftar transaksi.
      return res.json({
        message: "Daftar transaksi berhasil diambil",
        orders,
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// GET /api/orders/:id
// Mengambil detail satu transaksi beserta item produknya.
router.get(
  "/:id",

  // User harus login terlebih dahulu.
  authMiddleware,

  // ADMIN dan STAFF boleh melihat detail transaksi.
  roleMiddleware(["ADMIN", "STAFF"]),

  async (req, res) => {
    try {
      // Mengambil ID order dari URL dan mengubahnya menjadi string.
      const id = String(req.params.id);

      // Mencari order berdasarkan ID.
      const order = await db.orm.public.Order.first({ id });

      // Jika transaksi tidak ditemukan.
      if (!order) {
        return res.status(404).json({
          message: "Transaksi tidak ditemukan",
        });
      }

      // Mengambil semua item milik order ini.
      const items = await db.orm.public.OrderItem.where({ orderId: id }).all();

      // Mengirim detail transaksi beserta itemnya.
      return res.json({
        message: "Detail transaksi berhasil diambil",
        order,
        items,
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// Mengekspor router order agar bisa dipakai di src/index.ts.
export default router;
