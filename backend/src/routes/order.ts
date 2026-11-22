// File ini berisi API untuk membuat dan melihat transaksi OmniPOS.

import { Router } from "express";
import { z } from "zod";

import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { db } from "../prisma/db";

const router = Router();

// Aturan untuk satu produk yang dibeli.
const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

// Aturan untuk membuat transaksi.
const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
});

const payOrderSchema = z.object({
  amountPaid: z.number().int().positive(),
});

// POST /api/orders
// Membuat transaksi baru.
router.post(
  "/",
  authMiddleware,
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

      const userId = String((req.user as unknown as { userId: string }).userId);

      // Menggabungkan produk yang sama menjadi satu item.
      // Contoh: produk A dibeli 1 lalu 2 menjadi satu item sebanyak 3.
      const quantityByProductId = new Map<string, number>();

      for (const item of data.items) {
        const productId = String(item.productId);
        const currentQuantity = quantityByProductId.get(productId) ?? 0;

        quantityByProductId.set(productId, currentQuantity + item.quantity);
      }

      // Menjalankan beberapa query sebagai satu transaction.
      const order = await db.transaction(async (tx) => {
        let total = 0;

        const orderItems: {
          productId: string;
          productName: string;
          price: number;
          quantity: number;
          subtotal: number;
          stockAfterPurchase: number;
        }[] = [];

        // Memeriksa dan menghitung setiap produk yang dibeli.
        for (const [productId, quantity] of quantityByProductId) {
          // Membaca dan mengunci baris produk sampai transaction selesai.
          const productPlan = tx.sql.public.products
            .select("id", "name", "price", "stock", "isActive")
            .where((f, fns) => fns.eq(f.id, productId))
            .forUpdate()
            .build();

          const [product] = await tx.query(productPlan);

          if (!product) {
            throw new Error(`Produk dengan ID ${productId} tidak ditemukan`);
          }

          if (!product.isActive) {
            throw new Error(`Produk ${product.name} tidak aktif`);
          }

          if (product.stock < quantity) {
            throw new Error(
              `Stok produk ${product.name} tidak cukup. Stok tersedia: ${product.stock}`,
            );
          }

          const subtotal = product.price * quantity;
          total += subtotal;

          const stockAfterPurchase = product.stock - quantity;

          orderItems.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity,
            subtotal,
            stockAfterPurchase,
          });
        }

        // Membuat order baru.
        const createdOrder = await tx.orm.public.Order.create({
          userId,
          total,
        });

        // Membuat OrderItem dan mengurangi stok untuk setiap produk.
        for (const item of orderItems) {
          await tx.orm.public.OrderItem.create({
            orderId: createdOrder.id,
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          });

          // Stok sudah terkunci oleh FOR UPDATE,
          // sehingga nilai ini aman digunakan untuk update.
          await tx.orm.public.Product.where({
            id: item.productId,
          }).update({
            stock: item.stockAfterPurchase,
          });
        }

        return createdOrder;
      });

      return res.status(201).json({
        message: "Transaksi berhasil dibuat",
        order,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Data transaksi tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat membuat transaksi",
      });
    }
  },
);

// GET /api/orders
// Mengambil semua transaksi.
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  async (_req, res) => {
    try {
      const orders = await db.orm.public.Order.all();

      return res.json({
        message: "Daftar transaksi berhasil diambil",
        orders,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil transaksi",
      });
    }
  },
);

// GET /api/orders/:id
// Mengambil detail satu transaksi beserta item produknya.
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  async (req, res) => {
    try {
      const id = String(req.params.id);

      const order = await db.orm.public.Order.first({ id });

      if (!order) {
        return res.status(404).json({
          message: "Transaksi tidak ditemukan",
        });
      }

      const items = await db.orm.public.OrderItem.where({
        orderId: id,
      }).all();

      return res.json({
        message: "Detail transaksi berhasil diambil",
        order,
        items,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil detail transaksi",
      });
    }
  },
);

// POST /api/orders/:id/pay
// ADMIN dan STAFF memproses pembayaran transaksi.
router.post(
  "/:id/pay",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  async (req, res) => {
    try {
      const id = String(req.params.id);

      const data = payOrderSchema.parse(req.body);

      const order = await db.orm.public.Order.first({ id });

      if (!order) {
        return res.status(404).json({
          message: "Transaksi tidak ditemukan",
        });
      }

      if (order.paymentStatus === "PAID") {
        return res.status(400).json({
          message: "Transaksi ini sudah dibayar",
        });
      }

      if (data.amountPaid < order.total) {
        return res.status(400).json({
          message: `Uang diterima kurang. Total: ${order.total}, diterima: ${data.amountPaid}`,
        });
      }

      const changeAmount = data.amountPaid - order.total;

      const updatedOrder = await db.orm.public.Order.where({ id }).update({
        paymentStatus: "PAID",
        amountPaid: data.amountPaid,
        changeAmount,
        paidAt: new Date(),
      });

      return res.json({
        message: "Pembayaran berhasil diproses",
        order: updatedOrder,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Data pembayaran tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat memproses pembayaran",
      });
    }
  },
);

// Mengekspor router order agar bisa dipakai di src/index.ts.
export default router;
