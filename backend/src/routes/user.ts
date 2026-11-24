// File ini berisi API untuk mengelola user OmniPOS.

import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";

import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import { db } from "../prisma/db";

const router = Router();

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// Aturan data saat ADMIN menambah user baru.
const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
});

// Aturan data saat ADMIN mengubah user.
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "STAFF"]).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users
// Hanya ADMIN yang dapat melihat daftar user.
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (_req, res) => {
    try {
      const users = await db.orm.public.User.all();

      return res.json({
        message: "Daftar user berhasil diambil",
        users: users.map(toSafeUser),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil daftar user",
      });
    }
  },
);

// GET /api/users/:id
// Hanya ADMIN yang dapat melihat detail user.
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const id = String(req.params.id);

      const user = await db.orm.public.User.first({ id });

      if (!user) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      return res.json({
        message: "Detail user berhasil diambil",
        user: toSafeUser(user),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.status(500).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat mengambil detail user",
      });
    }
  },
);

// POST /api/users
// Hanya ADMIN yang dapat menambah user baru.
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const data = createUserSchema.parse(req.body);

      const existingUser = await db.orm.public.User.where({
        email: data.email,
      }).first();

      if (existingUser) {
        return res.status(400).json({
          message: "Email sudah terdaftar",
        });
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await db.orm.public.User.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role ?? "STAFF",
      });

      return res.status(201).json({
        message: "User berhasil ditambahkan",
        user: toSafeUser(user),
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Data user tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat menambah user",
      });
    }
  },
);

// PUT /api/users/:id
// Hanya ADMIN yang dapat mengubah user.
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const data = updateUserSchema.parse(req.body);

      const currentUserId = String(
        (req.user as unknown as { userId: string }).userId,
      );

      const existingUser = await db.orm.public.User.first({ id });

      if (!existingUser) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      if (id === currentUserId) {
        if (data.role && data.role !== existingUser.role) {
          return res.status(400).json({
            message: "Tidak bisa mengubah role akun sendiri",
          });
        }

        if (data.isActive === false) {
          return res.status(400).json({
            message: "Tidak bisa menonaktifkan akun sendiri",
          });
        }
      }

      if (data.email && data.email !== existingUser.email) {
        const emailOwner = await db.orm.public.User.where({
          email: data.email,
        }).first();

        if (emailOwner && emailOwner.id !== id) {
          return res.status(400).json({
            message: "Email sudah digunakan oleh user lain",
          });
        }
      }

      let hashedPassword: string | undefined;

      if (data.password) {
        hashedPassword = await bcrypt.hash(data.password, 10);
      }

      const user = await db.orm.public.User.where({ id }).update({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        isActive: data.isActive,
      });

      if (!user) {
        return res.status(404).json({
          message: "User tidak ditemukan",
        });
      }

      return res.json({
        message: "User berhasil diperbarui",
        user: toSafeUser(user),
      });
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Data user tidak valid",
          details: error.issues,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Terjadi kesalahan saat memperbarui user",
      });
    }
  },
);

export default router;
