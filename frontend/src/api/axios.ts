// File ini berisi konfigurasi Axios untuk menghubungkan frontend ke backend OmniPOS.

// Import Axios untuk melakukan request HTTP.
import axios from "axios";

// Membuat instance Axios dengan URL backend dari environment variable.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Menambahkan interceptor sebelum request dikirim.
api.interceptors.request.use((config) => {
  // Mengambil token JWT yang disimpan di localStorage.
  const token = localStorage.getItem("token");

  // Jika token ada, tambahkan ke header Authorization.
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Melanjutkan request.
  return config;
});

// Mengekspor instance Axios agar bisa dipakai di seluruh halaman.
export default api;