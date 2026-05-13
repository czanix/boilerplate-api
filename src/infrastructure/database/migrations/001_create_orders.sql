-- Migration 001: Create orders table
-- Padrão Czanix: BIGINT PK + UUID público + soft delete + auditoria

CREATE TABLE IF NOT EXISTS orders (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    public_id   UUID NOT NULL DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    deleted_at  TIMESTAMPTZ NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_orders_public_id UNIQUE (public_id),
    CONSTRAINT chk_orders_status CHECK (status IN ('pending', 'confirmed', 'cancelled', 'delivered'))
);

CREATE TABLE IF NOT EXISTS order_items (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id    BIGINT NOT NULL REFERENCES orders(id),
    product_id  TEXT NOT NULL,
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice filtrado: só indexa o que importa
CREATE INDEX IF NOT EXISTS ix_orders_customer_active
    ON orders (customer_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS ix_order_items_order
    ON order_items (order_id);
