import type { User } from "@/types/auth";

// Membaca data user dengan pemeriksaan dasar.
export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem("user");

    if (!raw) return null;

    const user = JSON.parse(raw);

    if (
      typeof user?.id !== "string" ||
      typeof user?.name !== "string" ||
      typeof user?.email !== "string" ||
      !["ADMIN", "STAFF"].includes(user?.role)
    ) {
      return null;
    }

    return user as User;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
