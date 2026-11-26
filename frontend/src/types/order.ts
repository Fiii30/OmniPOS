export type OrderStatus = "PENDING" | "PAID" | "CANCEL_REQUESTED" | "CANCELLED";

export type PaymentMethod = "QRIS" | "TRANSFER_BANK" | "CASH";

export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";

export type StockFlowType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";

export type Order = {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  items: {
    productId: string;
    quantity: number;
  }[];
};

export type CreateOrderResponse = {
  message: string;
  order: Order;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderDetailResponse = {
  message: string;
  order: Order;
  items: OrderItem[];
  payments: Payment[];
  histories: OrderStatusHistory[];
};

export type PayOrderInput = {
  method: PaymentMethod;
  amountPaid?: number;
  referenceCode?: string;
};

export type PayOrderResponse = {
  message: string;
  order: Order;
};

export type Payment = {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  changeAmount: number;
  status: PaymentStatus;
  referenceCode: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusHistory = {
  id: string;
  orderId: string;
  paymentId: string | null;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  changedById: string;
  reason: string | null;
  createdAt: string;
};

export type StockFlow = {
  id: string;
  productId: string;
  orderId: string | null;
  type: StockFlowType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  changedById: string;
  note: string | null;
  createdAt: string;
};

export type CancelOrderInput = {
  reason: string;
};

export type CancelOrderResponse = {
  message: string;
  order: Order;
};

export type CancelDecisionInput = {
  action: "APPROVE" | "REJECT";
  reason: string;
};

export type StockFlowInput = {
  type: "IN" | "ADJUSTMENT";
  quantity?: number;
  stock?: number;
  note?: string;
};

export type OrderPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedOrdersResponse = {
  message: string;
  orders: Order[];
  pagination: OrderPagination;
};
