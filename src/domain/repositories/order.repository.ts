import type { Order } from '../entities/order.entity';

/**
 * Repository Interface — contrato que o domínio define.
 *
 * A implementação concreta (PostgreSQL, MongoDB, etc.) fica em infrastructure/.
 * O domínio não sabe e não precisa saber qual banco está por trás.
 */
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findByPublicId(publicId: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  update(order: Order): Promise<void>;
  softDelete(publicId: string): Promise<void>;
}
