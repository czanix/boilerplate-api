/**
 * Structured logger — eventos, não dados.
 *
 * NUNCA logue PII (email, CPF, cartão).
 * Logue o evento e IDs públicos para rastreabilidade.
 */
export const logger = {
  info(event: string, data?: Record<string, unknown>) {
    console.log(JSON.stringify({ level: 'info', event, ...data, timestamp: new Date().toISOString() }));
  },

  warn(event: string, data?: Record<string, unknown>) {
    console.warn(JSON.stringify({ level: 'warn', event, ...data, timestamp: new Date().toISOString() }));
  },

  error(event: string, error: unknown, data?: Record<string, unknown>) {
    console.error(JSON.stringify({
      level: 'error',
      event,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...data,
      timestamp: new Date().toISOString(),
    }));
  },
};
