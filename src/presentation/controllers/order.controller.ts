import { Router, type Request, type Response } from 'express';
import type { CreateOrderUseCase } from '../../application/use-cases/create-order.usecase';
import type { CancelOrderUseCase } from '../../application/use-cases/cancel-order.usecase';

export function createOrderController(
  createOrderUseCase: CreateOrderUseCase,
  cancelOrderUseCase: CancelOrderUseCase
): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    const result = await createOrderUseCase.execute(req.body);

    if (!result.ok) {
      res.status(422).json({ error: result.error });
      return;
    }

    res.status(201).json(result.value);
  });

  router.patch('/:publicId/cancel', async (req: Request, res: Response) => {
    const result = await cancelOrderUseCase.execute(req.params.publicId);

    if (!result.ok) {
      res.status(422).json({ error: result.error });
      return;
    }

    res.status(200).json({ message: 'Pedido cancelado' });
  });

  return router;
}
