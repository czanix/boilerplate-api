import type { OrderRepository } from '../../domain/repositories/order.repository';
import { ok, fail, type Result } from '../../domain/result';

export class CancelOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(publicId: string): Promise<Result<void>> {
    const order = await this.orderRepository.findByPublicId(publicId);

    if (!order) {
      return fail('Pedido não encontrado');
    }

    try {
      order.cancel();
    } catch (e) {
      return fail((e as Error).message);
    }

    await this.orderRepository.update(order);
    return ok(undefined);
  }
}
