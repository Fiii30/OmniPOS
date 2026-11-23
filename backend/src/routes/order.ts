// File ini berisi API untuk membuat, membayar, dan membatalkan transaksi OmniPOS.

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

// Aturan pembayaran transaksi.
const payOrderSchema = z.object({
  method: z.enum(["QRIS", "TRANSFER_BANK", "CASH"]),
  amountPaid: z.number().int().positive().optional(),
  referenceCode: z.string().min(1).optional(),
});

// Aturan pengajuan pembatalan transaksi.
const cancelRequestSchema = z.object({
  reason: z.string().min(3),
});

// Aturan keputusan ADMIN atas pengajuan pembatalan.
const cancelDecisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().min(3),
});

// Mengambil ID user dari token JWT.
function getUserId(req: unknown): string {
  const user = req as { user?: { userId?: string } };

  if (!user.user?.userId) {
    throw new Error("User tidak ditemukan pada token");
  }

  return String(user.user.userId);
}

// POST /api/orders
// Membuat transaksi baru dan mencatat stok yang keluar.
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  async (req, res) => {
    try {
      const data = createOrderSchema.parse(req.body);
      const userId = getUserId(req);

      // Menggabungkan produk yang sama menjadi satu item.
      const quantityByProductId = new Map<string, number>();

      for (const item of data.items) {
        const productId = String(item.productId);
        const currentQuantity = quantityByProductId.get(productId) ?? 0;

        quantityByProductId.set(productId, currentQuantity + item.quantity);
      }

      const order = await db.transaction(async (tx) => {
        let total = 0;

        const orderItems: {
          productId: string;
          productName: string;
          price: number;
          quantity: number;
          subtotal: number;
          stockBefore: number;
          stockAfterPurchase: number;
        }[] = [];

        for (const [productId, quantity] of quantityByProductId) {
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

          orderItems.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity,
            subtotal,
            stockBefore: product.stock,
            stockAfterPurchase: product.stock - quantity,
          });
        }

        const createdOrder = await tx.orm.public.Order.create({
          userId,
          total,
        });

        for (const item of orderItems) {
          await tx.orm.public.OrderItem.create({
            orderId: createdOrder.id,
            productId: item.productId,
            productName: item.productName,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
          });

          await tx.orm.public.Product.where({
            id: item.productId,
          }).update({
            stock: item.stockAfterPurchase,
          });

          // Mencatat stok yang keluar karena transaksi.
          await tx.orm.public.StockFlow.create({
            productId: item.productId,
            orderId: createdOrder.id,
            type: "OUT",
            quantity: item.quantity,
            stockBefore: item.stockBefore,
            stockAfter: item.stockAfterPurchase,
            changedById: userId,
            note: "Stok keluar karena transaksi",
          });
        }

        // Mencatat order baru pada riwayat status.
        await tx.orm.public.OrderStatusHistory.create({
          orderId: createdOrder.id,
          previousStatus: "PENDING",
          newStatus: "PENDING",
          changedById: userId,
          reason: "Transaksi dibuat",
        });

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

      const payments = await db.orm.public.Payment.where({
        orderId: id,
      }).all();

      const histories = await db.orm.public.OrderStatusHistory.where({
        orderId: id,
      }).all();

      return res.json({
        message: "Detail transaksi berhasil diambil",
        order,
        items,
        payments,
        histories,
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
      const userId = getUserId(req);

      const order = await db.orm.public.Order.first({ id });

      if (!order) {
        return res.status(404).json({
          message: "Transaksi tidak ditemukan",
        });
      }

      if (order.status !== "PENDING") {
        return res.status(400).json({
          message: "Transaksi ini tidak dapat dibayar",
        });
      }

      const existingPayments = await db.orm.public.Payment.where({
        orderId: id,
      }).all();

      const hasSuccessfulPayment = existingPayments.some(
        (payment) => payment.status === "SUCCEEDED",
      );

      if (hasSuccessfulPayment) {
        return res.status(400).json({
          message: "Transaksi ini sudah memiliki pembayaran berhasil",
        });
      }

      let amount = order.total;
      let changeAmount = 0;
      let referenceCode: string | null = null;

      if (data.method === "CASH") {
        if (!data.amountPaid) {
          return res.status(400).json({
            message: "Uang diterima wajib diisi untuk pembayaran cash",
          });
        }

        if (data.amountPaid < order.total) {
          return res.status(400).json({
            message: `Uang diterima kurang. Total: ${order.total}, diterima: ${data.amountPaid}`,
          });
        }

        amount = data.amountPaid;
        changeAmount = data.amountPaid - order.total;
      } else {
        if (!data.referenceCode) {
          return res.status(400).json({
            message: "Kode referensi wajib diisi untuk QRIS atau transfer bank",
          });
        }

        referenceCode = data.referenceCode;
      }

      const result = await db.transaction(async (tx) => {
        const payment = await tx.orm.public.Payment.create({
          orderId: id,
          method: data.method,
          amount,
          changeAmount,
          status: "SUCCEEDED",
          referenceCode,
          paidAt: new Date(),
        });

        const updatedOrder = await tx.orm.public.Order.where({
          id,
        }).update({
          status: "PAID",
        });

        await tx.orm.public.OrderStatusHistory.create({
          orderId: id,
          paymentId: payment.id,
          previousStatus: order.status,
          newStatus: "PAID",
          changedById: userId,
          reason: `Pembayaran ${data.method} berhasil`,
        });

        return {
          payment,
          order: updatedOrder,
        };
      });

      return res.json({
        message: "Pembayaran berhasil diproses",
        payment: result.payment,
        order: result.order,
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

// POST /api/orders/:id/cancel-request
// ADMIN dan STAFF mengajukan pembatalan transaksi.
router.post(
  "/:id/cancel-request",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const data = cancelRequestSchema.parse(req.body);
      const userId = getUserId(req);

      const order = await db.orm.public.Order.first({ id });

      if (!order) {
        return res.status(404).json({
          message: "Transaksi tidak ditemukan",
        });
      }

      if (order.status !== "PENDING" && order.status !== "PAID") {
        return res.status(400).json({
          message: "Transaksi ini tidak dapat diajukan untuk dibatalkan",
        });
      }

      const result = await db.transaction(async (tx) => {
        const updatedOrder = await tx.orm.public.Order.where({
          id,
        }).update({
          status: "CANCEL_REQUESTED",
        });

        await tx.orm.public.OrderStatusHistory.create({
          orderId: id,
          previousStatus: order.status,
          newStatus: "CANCEL_REQUESTED",
          changedById: userId,
          reason: data.reason,
        });

        return updatedOrder;
      });

      return res.json({
        message: "Pengajuan pembatalan berhasil dikirim",
        order: result,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Data pengajuan pembatalan tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengajukan pembatalan",
      });
    }
  },
);

// POST /api/orders/:id/cancel/decision
// Hanya ADMIN yang dapat menyetujui atau menolak pembatalan.
router.post(
  "/:id/cancel/decision",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const data = cancelDecisionSchema.parse(req.body);
      const userId = getUserId(req);

      const order = await db.orm.public.Order.first({ id });

      if (!order) {
        return res.status(404).json({
          message: "Transaksi tidak ditemukan",
        });
      }

      if (order.status !== "CANCEL_REQUESTED") {
        return res.status(400).json({
          message: "Transaksi ini tidak sedang menunggu keputusan pembatalan",
        });
      }

      if (data.action === "REJECT") {
        const histories = await db.orm.public.OrderStatusHistory.where({
          orderId: id,
        }).all();

        const cancelRequestHistory = histories
          .slice()
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .find((history) => history.newStatus === "CANCEL_REQUESTED");

        const previousStatus =
          cancelRequestHistory?.previousStatus ?? "PENDING";

        const result = await db.transaction(async (tx) => {
          const updatedOrder = await tx.orm.public.Order.where({
            id,
          }).update({
            status: previousStatus,
          });

          await tx.orm.public.OrderStatusHistory.create({
            orderId: id,
            previousStatus: "CANCEL_REQUESTED",
            newStatus: previousStatus,
            changedById: userId,
            reason: data.reason,
          });

          return updatedOrder;
        });

        return res.json({
          message: "Pengajuan pembatalan ditolak",
          order: result,
        });
      }

      const result = await db.transaction(async (tx) => {
        const items = await tx.orm.public.OrderItem.where({
          orderId: id,
        }).all();

        for (const item of items) {
          const productPlan = tx.sql.public.products
            .select("id", "name", "stock")
            .where((f, fns) => fns.eq(f.id, item.productId))
            .forUpdate()
            .build();

          const [product] = await tx.query(productPlan);

          if (!product) {
            throw new Error(
              `Produk dengan ID ${item.productId} tidak ditemukan`,
            );
          }

          const stockBefore = product.stock;
          const stockAfter = product.stock + item.quantity;

          await tx.orm.public.Product.where({
            id: item.productId,
          }).update({
            stock: stockAfter,
          });

          await tx.orm.public.StockFlow.create({
            productId: item.productId,
            orderId: id,
            type: "RETURN",
            quantity: item.quantity,
            stockBefore,
            stockAfter,
            changedById: userId,
            note: "Stok dikembalikan karena transaksi dibatalkan",
          });
        }

        const payments = await tx.orm.public.Payment.where({
          orderId: id,
        }).all();

        for (const payment of payments) {
          if (payment.status === "SUCCEEDED") {
            await tx.orm.public.Payment.where({
              id: payment.id,
            }).update({
              status: "REFUNDED",
            });
          }
        }

        const updatedOrder = await tx.orm.public.Order.where({
          id,
        }).update({
          status: "CANCELLED",
        });

        await tx.orm.public.OrderStatusHistory.create({
          orderId: id,
          previousStatus: "CANCEL_REQUESTED",
          newStatus: "CANCELLED",
          changedById: userId,
          reason: data.reason,
        });

        return updatedOrder;
      });

      return res.json({
        message: "Pembatalan transaksi disetujui",
        order: result,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Data keputusan pembatalan tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat memproses pembatalan",
      });
    }
  },
);

export default router;
