// File ini berisi API laporan OmniPOS.

import { Router } from "express";
import { z } from "zod";

import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { db } from "../prisma/db";

const router = Router();

const periodSchema = z.enum(["today", "week", "month", "custom"]);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

type PeriodRange = {
  start: Date;
  end: Date;
};

// Menentukan rentang waktu laporan.
function getPeriodRange(
  period: "today" | "week" | "month" | "custom",
  from?: string,
  to?: string,
): PeriodRange {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (period === "week") {
    start.setDate(start.getDate() - 6);
  }

  if (period === "month") {
    start.setDate(start.getDate() - 29);
  }

  if (period === "custom") {
    if (!from || !to) {
      throw new Error(
        "Tanggal awal dan akhir wajib diisi untuk periode custom",
      );
    }

    start.setTime(new Date(`${from}T00:00:00`).getTime());
    end.setTime(new Date(`${to}T23:59:59.999`).getTime());
  }

  return { start, end };
}

// Memfilter order yang sudah dibayar dan berada dalam periode.
function getPaidOrders(
  orders: {
    id: string;
    total: number;
    status: string;
    createdAt: Date;
  }[],
  range: PeriodRange,
) {
  return orders.filter((order) => {
    const createdAt = new Date(order.createdAt);

    return (
      order.status === "PAID" &&
      createdAt >= range.start &&
      createdAt <= range.end
    );
  });
}

// GET /api/reports/summary
// ADMIN dan STAFF dapat melihat ringkasan penjualan.
router.get(
  "/summary",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  async (req, res) => {
    try {
      const period = periodSchema.parse(req.query.period ?? "today");

      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;

      if (from) dateSchema.parse(from);
      if (to) dateSchema.parse(to);

      const range = getPeriodRange(period, from, to);

      const orders = await db.orm.public.Order.all();
      const paidOrders = getPaidOrders(orders, range);

      const paidOrderIds = paidOrders.map((order) => order.id);

      const orderItems = await db.orm.public.OrderItem.all();

      const paidItems = orderItems.filter((item) =>
        paidOrderIds.includes(item.orderId),
      );

      const totalRevenue = paidOrders.reduce(
        (total, order) => total + order.total,
        0,
      );

      const totalItemsSold = paidItems.reduce(
        (total, item) => total + item.quantity,
        0,
      );

      const averageOrderValue =
        paidOrders.length > 0
          ? Math.round(totalRevenue / paidOrders.length)
          : 0;

      return res.json({
        message: "Ringkasan penjualan berhasil diambil",
        period,
        from: range.start,
        to: range.end,
        totalRevenue,
        totalOrders: paidOrders.length,
        totalItemsSold,
        averageOrderValue,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Periode laporan tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil ringkasan penjualan",
      });
    }
  },
);

// GET /api/reports/top-products
// ADMIN dan STAFF dapat melihat produk terlaris.
router.get(
  "/top-products",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  async (req, res) => {
    try {
      const period = periodSchema.parse(req.query.period ?? "today");

      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;

      if (from) dateSchema.parse(from);
      if (to) dateSchema.parse(to);

      const range = getPeriodRange(period, from, to);

      const orders = await db.orm.public.Order.all();
      const paidOrders = getPaidOrders(orders, range);

      const paidOrderIds = paidOrders.map((order) => order.id);

      const orderItems = await db.orm.public.OrderItem.all();

      const paidItems = orderItems.filter((item) =>
        paidOrderIds.includes(item.orderId),
      );

      const productSales = new Map<
        string,
        {
          productId: string;
          productName: string;
          quantity: number;
          revenue: number;
        }
      >();

      for (const item of paidItems) {
        const current = productSales.get(item.productId) ?? {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          revenue: 0,
        };

        current.quantity += item.quantity;
        current.revenue += item.subtotal;

        productSales.set(item.productId, current);
      }

      const topProducts = Array.from(productSales.values()).sort(
        (a, b) => b.quantity - a.quantity,
      );

      return res.json({
        message: "Produk terlaris berhasil diambil",
        period,
        from: range.start,
        to: range.end,
        topProducts,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Periode laporan tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil produk terlaris",
      });
    }
  },
);

// GET /api/reports/low-stock
// ADMIN dan STAFF dapat melihat produk dengan stok rendah.
router.get(
  "/low-stock",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  async (_req, res) => {
    try {
      const products = await db.orm.public.Product.all();

      const lowStockProducts = products
        .filter((product) => product.isActive && product.stock <= 5)
        .sort((a, b) => a.stock - b.stock);

      return res.json({
        message: "Produk dengan stok rendah berhasil diambil",
        products: lowStockProducts,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil stok rendah",
      });
    }
  },
);

// GET /api/reports/cancellations
// Hanya ADMIN yang dapat melihat laporan pembatalan.
router.get(
  "/cancellations",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const period = periodSchema.parse(req.query.period ?? "today");

      const from = req.query.from ? String(req.query.from) : undefined;
      const to = req.query.to ? String(req.query.to) : undefined;

      if (from) dateSchema.parse(from);
      if (to) dateSchema.parse(to);

      const range = getPeriodRange(period, from, to);

      const orders = await db.orm.public.Order.all();

      const cancelledOrders = orders.filter((order) => {
        const createdAt = new Date(order.createdAt);

        return (
          order.status === "CANCELLED" &&
          createdAt >= range.start &&
          createdAt <= range.end
        );
      });

      const histories = await db.orm.public.OrderStatusHistory.all();

      const cancellations = cancelledOrders.map((order) => {
        const orderHistories = histories
          .filter((history) => history.orderId === order.id)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

        const cancellationHistory = orderHistories.find(
          (history) => history.newStatus === "CANCELLED",
        );

        return {
          orderId: order.id,
          total: order.total,
          createdAt: order.createdAt,
          reason: cancellationHistory?.reason ?? null,
          decidedBy: cancellationHistory?.changedById ?? null,
          decidedAt: cancellationHistory?.createdAt ?? null,
        };
      });

      return res.json({
        message: "Laporan pembatalan berhasil diambil",
        period,
        from: range.start,
        to: range.end,
        cancellations,
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Periode laporan tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil laporan pembatalan",
      });
    }
  },
);

export default router;
