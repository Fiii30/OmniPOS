export type Order = {
  id: string;
  userId: string;
  total: number;
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
};
