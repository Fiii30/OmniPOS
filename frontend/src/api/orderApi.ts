import api from "./axios";

import type {
  CreateOrderInput,
  CreateOrderResponse,
  Order,
  OrderDetailResponse,
} from "@/types/order";

export async function createOrder(data: CreateOrderInput) {
  const response = await api.post<CreateOrderResponse>(
    "/orders",
    data
  );

  return response.data;
}

export async function getOrders() {
  const response = await api.get<{
    message: string;
    orders: Order[];
  }>("/orders");

  return response.data.orders;
}

export async function getOrderDetail(id: string) {
  const response = await api.get<OrderDetailResponse>(
    `/orders/${encodeURIComponent(id)}`
  );

  return response.data;
}