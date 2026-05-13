/**
 * Result Pattern — sem exceção para fluxo de negócio.
 *
 * Exceção é para o inesperado (banco caiu, memória cheia).
 * "Email já cadastrado" NÃO é exceção — é fluxo de negócio.
 *
 * O chamador é FORÇADO a lidar com sucesso E falha.
 */

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function fail<E = string>(error: E): Result<never, E> {
  return { ok: false, error };
}
