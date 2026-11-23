import api from "./axios";
import type { Product } from "@/types/product";
import type { StockFlow, StockFlowInput } from "@/types/order";

export type ProductInput = {
  name: string;
  price: number;
  stock: number;
};

type ProductsResponse = {
  message: string;
  total?: number;
  products: Product[];
};

export async function getProducts() {
  const response = await api.get<ProductsResponse>("/products");

  return response.data.products;
}

export async function createProduct(data: ProductInput) {
  const response = await api.post<{
    message: string;
    product: Product;
  }>("/products", data);

  return response.data.product;
}

export async function updateProduct(id: string, data: ProductInput) {
  const response = await api.put(`/products/${id}`, data);

  return response.data;
}

export async function setProductActive(id: string, isActive: boolean) {
  const response = await api.put(`/products/${id}`, {
    isActive,
  });

  return response.data;
}

export async function addStockFlow(
  productId: string,
  data: StockFlowInput
) {
  const response = await api.post<{ message: string; stockFlow: StockFlow }>(
    `/products/${encodeURIComponent(productId)}/stock`,
    data
  );

  return response.data;
}
