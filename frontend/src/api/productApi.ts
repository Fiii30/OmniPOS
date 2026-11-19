// File ini berisi fungsi untuk memanggil API produk.

// Import konfigurasi Axios.
import api from "./axios";

// Import tipe Product.
import type { Product } from "../types/product";

// Mengambil semua produk dari backend.
export const getProducts = async () => {
  // Mengirim request GET ke /products.
  const response = await api.get("/products");

  // Mengembalikan data produk.
  return response.data.products as Product[];
};

// Menambah produk baru.
export const createProduct = async (data: {
  name: string;
  price: number;
  stock: number;
}) => {
  // Mengirim request POST ke /products.
  const response = await api.post("/products", data);

  // Mengembalikan produk yang berhasil dibuat.
  return response.data.product as Product;
};
