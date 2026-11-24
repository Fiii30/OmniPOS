export type ReportPeriod = "today" | "week" | "month" | "custom";

export type SalesSummary = {
  message: string;
  period: ReportPeriod;
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
};

export type TopProduct = {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
};

export type TopProductsResponse = {
  message: string;
  period: ReportPeriod;
  from: string;
  to: string;
  topProducts: TopProduct[];
};

export type LowStockResponse = {
  message: string;
  products: {
    id: string;
    name: string;
    price: number;
    stock: number;
    isActive: boolean;
  }[];
};

export type CancellationReport = {
  orderId: string;
  total: number;
  createdAt: string;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
};

export type CancellationsResponse = {
  message: string;
  period: ReportPeriod;
  from: string;
  to: string;
  cancellations: CancellationReport[];
};
