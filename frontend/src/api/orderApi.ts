import api from "./axios";

import type {
  CreateOrderInput,
  CreateOrderResponse,
  Order,
  OrderDetailResponse,
  CancelOrderInput,
  CancelOrderResponse,
  CancelDecisionInput,
  PayOrderInput,
  PayOrderResponse
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

export async function requestOrderCancel(id: string, data: CancelOrderInput) {
  const response = await api.post<CancelOrderResponse>(
    `/orders/${encodeURIComponent(id)}/cancel-request`,
    data,
  );

  return response.data;
}

export async function decideOrderCancel(id: string, data: CancelDecisionInput) {
  const response = await api.post<CancelOrderResponse>(
    `/orders/${encodeURIComponent(id)}/cancel/decision`,
    data,
  );

  return response.data;
}
