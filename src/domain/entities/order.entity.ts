import { randomUUID } from 'node:crypto';

/**
 * Order Entity — regras de negócio puras, zero dependência externa.
 *
 * Esta classe não conhece banco, HTTP, nem framework.
 * Testável em isolamento completo.
 */
export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderProps {
  id?: number;
  publicId?: string;
  customerId: string;
  items: OrderItem[];
  status?: OrderStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled' | 'delivered';

export class Order {
  readonly id?: number;
  readonly publicId: string;
  readonly customerId: string;
  readonly items: OrderItem[];
  private _status: OrderStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  private constructor(props: OrderProps) {
    this.id = props.id;
    this.publicId = props.publicId ?? randomUUID();
    this.customerId = props.customerId;
    this.items = props.items;
    this._status = props.status ?? 'pending';
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.deletedAt = props.deletedAt ?? null;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get total(): number {
    return this.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Factory method — valida invariantes na criação.
   */
  static create(props: Omit<OrderProps, 'id' | 'publicId' | 'status'>): Order {
    if (!props.items.length) {
      throw new Error('Order must have at least one item');
    }

    if (props.items.some((item) => item.quantity <= 0)) {
      throw new Error('Item quantity must be positive');
    }

    if (props.items.some((item) => item.unitPrice < 0)) {
      throw new Error('Item price cannot be negative');
    }

    return new Order(props);
  }

  /**
   * Reconstitui do banco — sem validação (dado já passou por create).
   */
  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  confirm(): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot confirm order with status: ${this._status}`);
    }
    this._status = 'confirmed';
  }

  cancel(): void {
    if (this._status === 'delivered') {
      throw new Error('Cannot cancel delivered order');
    }
    if (this._status === 'cancelled') {
      throw new Error('Order already cancelled');
    }
    this._status = 'cancelled';
  }
}
