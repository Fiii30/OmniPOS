import api from "./axios";
import type { PaginatedOrdersResponse } from "@/types/order";

import type {
  CreateOrderInput,
  CreateOrderResponse,
  OrderDetailResponse,
  CancelOrderInput,
  CancelOrderResponse,
  CancelDecisionInput,
  PayOrderInput,
  PayOrderResponse,
} from "@/types/order";

export async function createOrder(data: CreateOrderInput) {
  const response = await api.post<CreateOrderResponse>("/orders", data);

  return response.data;
}

export async function getOrders(page = 1, limit = 10) {
  const response = await api.get<PaginatedOrdersResponse>(
    `/orders?page=${page}&limit=${limit}`,
  );

  return response.data;
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
