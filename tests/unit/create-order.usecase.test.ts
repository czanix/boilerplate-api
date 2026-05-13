import { describe, it, expect, vi } from 'vitest';
import { CreateOrderUseCase } from '../../src/application/use-cases/create-order.usecase';
import type { OrderRepository } from '../../src/domain/repositories/order.repository';

const mockRepository: OrderRepository = {
  save: vi.fn(),
  findByPublicId: vi.fn(),
  findByCustomerId: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
};

describe('CreateOrderUseCase', () => {
  const useCase = new CreateOrderUseCase(mockRepository);

  it('should create order successfully', async () => {
    const result = await useCase.execute({
      customerId: 'customer-123',
      items: [{ productId: 'prod-1', quantity: 2, unitPrice: 29.90 }],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.customerId).toBe('customer-123');
      expect(result.value.total).toBe(59.80);
      expect(result.value.status).toBe('pending');
    }
  });

  it('should fail with empty items', async () => {
    const result = await useCase.execute({
      customerId: 'customer-123',
      items: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('pelo menos um item');
    }
  });

  it('should fail without customerId', async () => {
    const result = await useCase.execute({
      customerId: '',
      items: [{ productId: 'prod-1', quantity: 1, unitPrice: 10 }],
    });

    expect(result.ok).toBe(false);
  });
});
