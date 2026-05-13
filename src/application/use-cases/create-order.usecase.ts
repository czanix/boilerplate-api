import { Order } from '../../domain/entities/order.entity';
import type { OrderRepository } from '../../domain/repositories/order.repository';
import { ok, fail, type Result } from '../../domain/result';
import type { CreateOrderInput, OrderOutput } from '../dtos/create-order.dto';

export class CreateOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(input: CreateOrderInput): Promise<Result<OrderOutput>> {
    if (!input.items.length) {
      return fail('Pedido deve ter pelo menos um item');
    }

    if (!input.customerId) {
      return fail('Cliente obrigatório');
    }

    const order = Order.create({
      customerId: input.customerId,
      items: input.items,
    });

    await this.orderRepository.save(order);

    return ok({
      publicId: order.publicId,
      customerId: order.customerId,
      status: order.status,
      total: order.total,
      itemCount: order.itemCount,
      createdAt: order.createdAt.toISOString(),
    });
  }
}
