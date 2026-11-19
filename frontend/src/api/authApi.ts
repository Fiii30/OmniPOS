// File ini berisi fungsi untuk memanggil API authentication.

// Import instance Axios.
import api from "./axios";

// Import tipe response login.
import type { LoginResponse } from "../types/auth";

// Fungsi untuk login user.
export const loginUser = async (data: { email: string; password: string }) => {
  // Mengirim email dan password ke endpoint login.
  const response = await api.post<LoginResponse>("/auth/login", data);

  // Mengembalikan token dan data user.
  return response.data;
};
