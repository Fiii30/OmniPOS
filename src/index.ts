// File utama untuk menjalankan server backend OmniPOS.

// Membaca file .env
import "dotenv/config";

// Import Express
import express from "express";

// Import CORS
import cors from "cors";

// Import route authentication
import authRoute from "./routes/auth";
import productRoute from "./routes/product";

// Import middleware login dan role
import { authMiddleware } from "./middleware/auth";
import { roleMiddleware } from "./middleware/role";

// Import koneksi database Prisma 8
import { db } from "./prisma/db";
import productRoutes from "./routes/product";
import orderRoutes from "./routes/order";

// Membuat aplikasi Express
const app = express();

// Mengizinkan frontend React mengakses backend
app.use(cors());

// Mengizinkan backend membaca JSON request body
app.use(express.json());

// Memasang route register dan login
app.use("/api/auth", authRoute);
app.use("/api/products", productRoute);
app.use("/api/orders", orderRoutes);

// Endpoint khusus ADMIN
app.get(
  "/api/admin/dashboard",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (_req, res) => {
    // Mengambil semua user untuk menghitung total
    const users = await db.orm.public.User.all();

    // Mengirim data dashboard admin
    res.json({
      message: "Dashboard admin",
      totalUsers: users.length,
    });
  },
);

// Endpoint untuk ADMIN dan STAFF
app.get(
  "/api/staff/dashboard",
  authMiddleware,
  roleMiddleware(["ADMIN", "STAFF"]),
  (_req, res) => {
    // Mengirim response dashboard staff
    res.json({
      message: "Dashboard staff",
    });
  },
);

// Mengambil port dari .env
const PORT = process.env.PORT || 5000;

// Menjalankan server
app.listen(PORT, () => {
  console.log(`OmniPOS backend berjalan di http://localhost:${PORT}`);
});
