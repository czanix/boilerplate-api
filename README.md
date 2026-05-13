# Czanix Boilerplate — API Node.js / TypeScript

> Clean Architecture, Result Pattern e OWASP. Padrões validados em 15 anos de produção. Clone e comece a codar.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![CI](https://github.com/czanix/boilerplate-api/actions/workflows/ci.yml/badge.svg)](https://github.com/czanix/boilerplate-api/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tech Reference](https://img.shields.io/badge/Czanix-Tech%20Reference-gold)](https://czanix.com/pt/stack)

**Este é o boilerplate principal da Czanix.** Se está em dúvida sobre qual usar, comece por este.

---

## Filosofia

Este boilerplate implementa decisões reais de produção, não teoria de livro:

1. **Clean Architecture pragmática** — domínio puro, infra desacoplada, sem over-engineering
2. **Result Pattern** — exceção é para o inesperado. "Email duplicado" é fluxo de negócio
3. **BIGINT PK + UUID público** — performance de banco relacional + segurança de API
4. **OWASP Security Headers** — sem helmet, sem magic, 7 headers explícitos
5. **Injeção de dependência manual** — sem container IoC quando o grafo é simples

**O que não tem aqui:** ORM pesado (usamos pg direto), `try/catch` para fluxo de negócio, abstrações desnecessárias, `any` no TypeScript.

---

## Estrutura

```
src/
├── domain/                          # Regras de negócio PURAS — zero import externo
│   ├── entities/
│   │   └── order.entity.ts          # Factory method, invariantes, status machine
│   ├── repositories/
│   │   └── order.repository.ts      # Interface — contrato que o domínio define
│   └── result.ts                    # Result<T> — ok() ou fail()
│
├── application/                     # Casos de uso — orquestram domínio + infra
│   ├── use-cases/
│   │   ├── create-order.usecase.ts
│   │   └── cancel-order.usecase.ts
│   └── dtos/
│       └── create-order.dto.ts
│
├── infrastructure/                  # Mundo externo
│   ├── database/
│   │   ├── connection.ts            # Pool pg com health check
│   │   └── migrations/
│   │       └── 001_create_orders.sql
│   ├── repositories/
│   │   └── pg-order.repository.ts   # Implementação concreta do contrato
│   └── logger.ts                    # Structured JSON logging
│
├── presentation/                    # Camada HTTP — controllers finos
│   ├── controllers/
│   │   ├── order.controller.ts
│   │   └── health.controller.ts
│   └── middlewares/
│       ├── security-headers.middleware.ts  # OWASP — sem dependência
│       └── rate-limit.middleware.ts
│
├── app.ts                           # Wire everything — DI manual
├── server.ts                        # Entrypoint
│
tests/
└── unit/
    └── create-order.usecase.test.ts # Vitest — mock do repository
│
docs/
└── adrs/
    ├── 001-bigint-pk-uuid-public.md
    ├── 002-result-pattern-over-exceptions.md
    └── 003-clean-architecture-boundaries.md
```

---

## Início rápido

```bash
# 1. Clone
git clone https://github.com/czanix/boilerplate-api.git meu-projeto
cd meu-projeto

# 2. Infraestrutura (PostgreSQL + Redis)
docker compose up -d

# 3. Dependências
npm install

# 4. Ambiente
cp .env.example .env

# 5. Dev server (hot reload)
npm run dev
```

---

## Result Pattern

```typescript
// domain/result.ts
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Uso no use case
async execute(input: CreateOrderInput): Promise<Result<OrderOutput>> {
  if (!input.items.length) {
    return fail('Pedido deve ter pelo menos um item');  // negócio — não é exceção
  }

  const order = Order.create({ customerId: input.customerId, items: input.items });
  await this.orderRepository.save(order);

  return ok({
    publicId: order.publicId,
    status: order.status,
    total: order.total,
  });
}

// Controller — tratamento explícito
router.post('/', async (req, res) => {
  const result = await createOrderUseCase.execute(req.body);

  if (!result.ok) {
    res.status(422).json({ error: result.error });
    return;
  }

  res.status(201).json(result.value);
});
```

**Por que não try/catch?** O compilador não avisa se você esqueceu o `catch`. Com Result, o tipo FORÇA o tratamento de ambos os caminhos.

---

## Domain Entity — regras no domínio, não no controller

```typescript
export class Order {
  // Factory method — valida invariantes na criação
  static create(props): Order {
    if (!props.items.length) throw new Error('Order must have at least one item');
    if (props.items.some(i => i.quantity <= 0)) throw new Error('Quantity must be positive');
    return new Order(props);
  }

  // Status machine — regras de transição no domínio
  cancel(): void {
    if (this._status === 'delivered') throw new Error('Cannot cancel delivered order');
    this._status = 'cancelled';
  }

  get total(): number {
    return this.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  }
}
```

---

## Database — BIGINT PK + UUID

```sql
CREATE TABLE orders (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id   UUID NOT NULL DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    deleted_at  TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_orders_public_id UNIQUE (public_id)
);

-- Índice filtrado: só indexa registros ativos
CREATE INDEX ix_orders_customer_active
    ON orders (customer_id, created_at DESC)
    WHERE deleted_at IS NULL;
```

[ADR completo: por que BIGINT + UUID →](docs/adrs/001-bigint-pk-uuid-public.md)

---

## Testes

```bash
npm run test               # Vitest
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

```typescript
describe('CreateOrderUseCase', () => {
  it('should fail with empty items', async () => {
    const result = await useCase.execute({
      customerId: 'customer-123',
      items: [],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('pelo menos um item');
  });
});
```

---

## Docker

```bash
# Development
docker compose up -d

# Production build (20MB image)
docker build -t czanix-api .
docker run -p 3000:3000 czanix-api
```

---

## Architecture Decision Records (ADRs)

Decisões arquiteturais documentadas com contexto, motivo e trade-offs:

- [ADR-001: BIGINT PK + UUID público](docs/adrs/001-bigint-pk-uuid-public.md)
- [ADR-002: Result Pattern vs Exceptions](docs/adrs/002-result-pattern-over-exceptions.md)
- [ADR-003: Clean Architecture com limites pragmáticos](docs/adrs/003-clean-architecture-boundaries.md)

---

## Quando NÃO usar este boilerplate

- **Protótipo descartável (< 3 meses):** Use Express puro com `app.post()` direto
- **API com 2-3 endpoints:** Clean Architecture é overkill
- **Equipe sem experiência em TypeScript:** O overhead de tipagem não compensa
- **Precisa de SSR/real-time:** Use Next.js ou Fastify com WebSockets

Saber quando não usar uma tecnologia é o que separa engenheiro sênior de entusiasta.

---

## Referência técnica

- [Backend & Arquitetura](https://czanix.com/pt/stack/backend)
- [Catálogo de Trade-offs](https://czanix.com/pt/stack/tradeoffs)
- [Tech Radar](https://czanix.com/pt/stack/tech-radar)
- [Todos os Boilerplates](https://czanix.com/pt/open-source)

---

## Licença

MIT — use, adapte, melhore. Se ajudou, [deixa uma estrela](https://github.com/czanix/boilerplate-api) ⭐

---

<div align="center">
<sub>Desenvolvido e mantido por <a href="https://czanix.com">Cesar Zanis</a> — Czanix</sub>
</div>
