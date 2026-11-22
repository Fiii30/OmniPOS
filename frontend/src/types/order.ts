export type OrderPaymentStatus = "UNPAID" | "PAID";

export type Order = {
  id: string;
  userId: string;
  total: number;
  createdAt: string;
  updatedAt: string;

  paymentStatus: OrderPaymentStatus;
  amountPaid: number | null;
  changeAmount: number | null;
  paidAt: string | null;
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
};

export type PayOrderInput = {
  amountPaid: number;
};

export type PayOrderResponse = {
  message: string;
  order: Order;
};
