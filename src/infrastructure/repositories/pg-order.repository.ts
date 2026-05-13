import type { Pool } from 'pg';
import { Order, type OrderItem } from '../../domain/entities/order.entity';
import type { OrderRepository } from '../../domain/repositories/order.repository';

export class PgOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `INSERT INTO orders (public_id, customer_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [order.publicId, order.customerId, order.status, order.createdAt, order.updatedAt]
      );

      const orderId = rows[0].id;

      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.productId, item.quantity, item.unitPrice]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findByPublicId(publicId: string): Promise<Order | null> {
    const orderResult = await this.pool.query(
      `SELECT id, public_id, customer_id, status, created_at, updated_at, deleted_at
       FROM orders
       WHERE public_id = $1 AND deleted_at IS NULL`,
      [publicId]
    );

    if (!orderResult.rows.length) return null;

    const row = orderResult.rows[0];
    const itemsResult = await this.pool.query(
      `SELECT product_id, quantity, unit_price FROM order_items WHERE order_id = $1`,
      [row.id]
    );

    return Order.fromPersistence({
      id: row.id,
      publicId: row.public_id,
      customerId: row.customer_id,
      status: row.status,
      items: itemsResult.rows.map((i) => ({
        productId: i.product_id,
        quantity: i.quantity,
        unitPrice: parseFloat(i.unit_price),
      })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const result = await this.pool.query(
      `SELECT id, public_id, customer_id, status, created_at, updated_at
       FROM orders
       WHERE customer_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [customerId]
    );

    const orders: Order[] = [];
    for (const row of result.rows) {
      const items = await this.pool.query(
        `SELECT product_id, quantity, unit_price FROM order_items WHERE order_id = $1`,
        [row.id]
      );

      orders.push(
        Order.fromPersistence({
          id: row.id,
          publicId: row.public_id,
          customerId: row.customer_id,
          status: row.status,
          items: items.rows.map((i) => ({
            productId: i.product_id,
            quantity: i.quantity,
            unitPrice: parseFloat(i.unit_price),
          })),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
      );
    }

    return orders;
  }

  async update(order: Order): Promise<void> {
    await this.pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE public_id = $2`,
      [order.status, order.publicId]
    );
  }

  async softDelete(publicId: string): Promise<void> {
    await this.pool.query(
      `UPDATE orders SET deleted_at = NOW(), updated_at = NOW() WHERE public_id = $1`,
      [publicId]
    );
  }
}
