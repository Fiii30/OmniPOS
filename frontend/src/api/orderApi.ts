import api from "./axios";
import type { PayOrderInput, PayOrderResponse } from "@/types/order";

import type {
  CreateOrderInput,
  CreateOrderResponse,
  Order,
  OrderDetailResponse,
} from "@/types/order";

export async function createOrder(data: CreateOrderInput) {
  const response = await api.post<CreateOrderResponse>("/orders", data);

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
    `/orders/${encodeURIComponent(id)}`,
  );

  return response.data;
}

export async function payOrder(id: string, data: PayOrderInput) {
  const response = await api.post<PayOrderResponse>(
    `/orders/${encodeURIComponent(id)}/pay`,
    data,
  );

  return response.data;
}
