// File ini berisi API laporan penjualan OmniPOS.

// Import Router dari Express untuk membuat route laporan.
import { Router } from "express";

// Import middleware agar user wajib login menggunakan JWT.
import { authMiddleware } from "../middleware/auth";

// Import middleware untuk membatasi akses berdasarkan role.
import { roleMiddleware } from "../middleware/role";

// Import koneksi database Prisma 8.
import { db } from "../prisma/db";

// Membuat router khusus laporan.
const router = Router();

// GET /api/reports/sales
// Mengambil laporan penjualan untuk satu tanggal.
router.get(
  "/sales",

  // User harus login terlebih dahulu.
  authMiddleware,

  // Hanya ADMIN yang boleh melihat laporan penjualan.
  roleMiddleware(["ADMIN"]),

  async (req, res) => {
    try {
      // Mengambil tanggal dari query URL.
      const requestedDate = req.query.date;

      // Jika tanggal tidak dikirim, gunakan tanggal hari ini.
      const date = requestedDate
        ? String(requestedDate)
        : new Date().toISOString().split("T")[0];

      // Memastikan format tanggal benar, contoh: 2026-11-19
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      // Jika format tanggal salah.
      if (!dateRegex.test(date)) {
        return res.status(400).json({
          message: "Format tanggal harus YYYY-MM-DD",
        });
      }

      // Mengambil semua order.
      const orders = await db.orm.public.Order.all();

      // Menyaring order yang dibuat pada tanggal yang diminta.
      const dailyOrders = orders.filter((order) => {
        // Mengubah tanggal order menjadi format YYYY-MM-DD.
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];

        // Mengembalikan true jika tanggal order sama dengan tanggal laporan.
        return orderDate === date;
      });

      // Menghitung total pendapatan dari order hari itu.
      const totalRevenue = dailyOrders.reduce(
        (total, order) => total + order.total,
        0,
      );

      // Menghitung jumlah transaksi hari itu.
      const totalOrders = dailyOrders.length;

      // Mengambil semua order item.
      const orderItems = await db.orm.public.OrderItem.all();

      // Menyaring order item yang termasuk dalam order hari itu.
      const dailyOrderIds = dailyOrders.map((order) => order.id);

      const dailyItems = orderItems.filter((item) =>
        dailyOrderIds.includes(item.orderId),
      );

      // Menghitung total produk yang terjual.
      const totalItemsSold = dailyItems.reduce(
        (total, item) => total + item.quantity,
        0,
      );

      // Menyimpan jumlah penjualan setiap produk.
      const productSales: Record<
        string,
        {
          productName: string;
          quantity: number;
          revenue: number;
        }
      > = {};

      // Menghitung penjualan setiap produk.
      for (const item of dailyItems) {
        // Jika produk belum ada di laporan, buat datanya.
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productName: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }

        // Menambahkan jumlah produk yang terjual.
        productSales[item.productId].quantity += item.quantity;

        // Menambahkan pendapatan dari produk tersebut.
        productSales[item.productId].revenue += item.subtotal;
      }

      // Mengubah objek productSales menjadi array.
      const bestSellingProducts = Object.entries(productSales)
        .map(([productId, data]) => ({
          productId,
          productName: data.productName,
          quantity: data.quantity,
          revenue: data.revenue,
        }))
        // Mengurutkan produk dari yang paling banyak terjual.
        .sort((a, b) => b.quantity - a.quantity);

      // Mengirim laporan penjualan.
      return res.json({
        message: "Laporan penjualan berhasil diambil",
        date,
        totalOrders,
        totalRevenue,
        totalItemsSold,
        bestSellingProducts,
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// Mengekspor router laporan agar bisa dipakai di src/index.ts.
export default router;
