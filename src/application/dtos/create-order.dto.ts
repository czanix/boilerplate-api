export interface CreateOrderInput {
  customerId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface OrderOutput {
  publicId: string;
  customerId: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
}
