// File ini berisi API untuk mengelola user OmniPOS.

// Import Router dari Express untuk membuat route user.
import { Router } from "express";

// Import zod untuk memvalidasi data user.
import { z } from "zod";

// Import middleware agar user wajib login menggunakan JWT.
import { authMiddleware } from "../middleware/auth";

// Import middleware untuk membatasi akses berdasarkan role.
import { roleMiddleware } from "../middleware/role";

// Import koneksi database Prisma 8.
import { db } from "../prisma/db";

// Membuat router khusus user.
const router = Router();

// Aturan data saat ADMIN mengubah user.
const updateUserSchema = z.object({
  // Nama user boleh dikirim atau tidak.
  name: z.string().min(2).optional(),

  // Role user boleh dikirim atau tidak.
  role: z.enum(["ADMIN", "STAFF"]).optional(),

  // Status aktif user boleh dikirim atau tidak.
  isActive: z.boolean().optional(),
});

// GET /api/users
// Mengambil semua user.
router.get(
  "/",

  // User harus login terlebih dahulu.
  authMiddleware,

  // Hanya ADMIN yang boleh melihat daftar user.
  roleMiddleware(["ADMIN"]),

  async (_req, res) => {
    try {
      // Mengambil seluruh user dari tabel users.
      const users = await db.orm.public.User.all();

      // Mengirim daftar user.
      return res.json({
        message: "Daftar user berhasil diambil",
        users,
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// GET /api/users/:id
// Mengambil detail satu user.
router.get(
  "/:id",

  // User harus login terlebih dahulu.
  authMiddleware,

  // Hanya ADMIN yang boleh melihat detail user.
  roleMiddleware(["ADMIN"]),

  async (req, res) => {
    try {
      // Mengambil ID user dari URL dan mengubahnya menjadi string.
      const id = String(req.params.id);

      // Mencari user berdasarkan ID.
      const user = await db.orm.public.User.first({ id });

      // Jika user tidak ditemukan.
      if (!user) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      // Mengirim detail user.
      return res.json({
        message: "Detail user berhasil diambil",
        user,
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// PUT /api/users/:id
// Mengubah data user berdasarkan ID.
router.put(
  "/:id",

  // User harus login terlebih dahulu.
  authMiddleware,

  // Hanya ADMIN yang boleh mengubah user.
  roleMiddleware(["ADMIN"]),

  async (req, res) => {
    try {
      // Mengambil ID user dari URL dan mengubahnya menjadi string.
      const id = String(req.params.id);

      // Memvalidasi data yang ingin diubah.
      const data = updateUserSchema.parse(req.body);

      // Memastikan user ada sebelum diubah.
      const existingUser = await db.orm.public.User.first({ id });

      // Jika user tidak ditemukan.
      if (!existingUser) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      // Mencegah ADMIN menonaktifkan akunnya sendiri.
      const currentUserId = String(
        (req.user as unknown as { userId: string }).userId,
      );

      // Jika ADMIN mengubah dirinya sendiri menjadi tidak aktif.
      if (id === currentUserId && data.isActive === false) {
        return res.status(400).json({
          message: "Tidak bisa menonaktifkan akun sendiri",
        });
      }

      // Mengubah user berdasarkan ID.
      const user = await db.orm.public.User.where({ id }).update({
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      });

      // Mengirim user yang sudah diperbarui.
      return res.json({
        message: "User berhasil diperbarui",
        user,
      });
    } catch (error: any) {
      // Mengirim error jika data tidak valid atau database gagal.
      return res.status(400).json({
        message: error.message,
      });
    }
  },
);

// DELETE /api/users/:id
// Menghapus user berdasarkan ID.
router.delete(
  "/:id",

  // User harus login terlebih dahulu.
  authMiddleware,

  // Hanya ADMIN yang boleh menghapus user.
  roleMiddleware(["ADMIN"]),

  async (req, res) => {
    try {
      // Mengambil ID user dari URL dan mengubahnya menjadi string.
      const id = String(req.params.id);

      // Memastikan user ada sebelum dihapus.
      const existingUser = await db.orm.public.User.first({ id });

      // Jika user tidak ditemukan.
      if (!existingUser) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      // Mengambil ID user yang sedang login.
      const currentUserId = String(
        (req.user as unknown as { userId: string }).userId,
      );

      // Mencegah ADMIN menghapus akunnya sendiri.
      if (id === currentUserId) {
        return res.status(400).json({
          message: "Tidak bisa menghapus akun sendiri",
        });
      }

      // Menghapus user berdasarkan ID.
      await db.orm.public.User.where({ id }).delete();

      // Mengirim response berhasil menghapus user.
      return res.json({
        message: "User berhasil dihapus",
      });
    } catch (error: any) {
      // Mengirim error jika query database gagal.
      return res.status(500).json({
        message: error.message,
      });
    }
  },
);

// Mengekspor router user agar bisa dipakai di src/index.ts.
export default router;
