// Tipe data produk yang dikirim dari backend.

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
