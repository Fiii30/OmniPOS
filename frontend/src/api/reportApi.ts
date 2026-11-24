import api from "./axios";

import type {
  CancellationsResponse,
  LowStockResponse,
  ReportPeriod,
  SalesSummary,
  TopProductsResponse,
} from "@/types/report";

function buildPeriodQuery(period: ReportPeriod, from?: string, to?: string) {
  const params = new URLSearchParams();
  params.set("period", period);

  if (period === "custom") {
    if (from) params.set("from", from);
    if (to) params.set("to", to);
  }

  return params.toString();
}

export async function getSalesSummary(
  period: ReportPeriod,
  from?: string,
  to?: string,
) {
  const query = buildPeriodQuery(period, from, to);

  const response = await api.get<SalesSummary>(`/reports/summary?${query}`);

  return response.data;
}

export async function getTopProducts(
  period: ReportPeriod,
  from?: string,
  to?: string,
) {
  const query = buildPeriodQuery(period, from, to);

  const response = await api.get<TopProductsResponse>(
    `/reports/top-products?${query}`,
  );

  return response.data;
}

export async function getLowStockProducts() {
  const response = await api.get<LowStockResponse>("/reports/low-stock");

  return response.data;
}

export async function getCancellations(
  period: ReportPeriod,
  from?: string,
  to?: string,
) {
  const query = buildPeriodQuery(period, from, to);

  const response = await api.get<CancellationsResponse>(
    `/reports/cancellations?${query}`,
  );

  return response.data;
}
