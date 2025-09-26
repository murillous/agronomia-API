let lastRequestTime = 0;

/**
 * Middleware simples para timeout entre requisições
 * @param {number} timeoutMinutes - Tempo em minutos entre requisições (padrão: 9)
 */
export function simpleTimeout(timeoutMinutes = 9) {
  const timeoutMs = timeoutMinutes * 60 * 1000;

  return (req, res, next) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < timeoutMs && lastRequestTime > 0) {
      const remainingMinutes = Math.ceil(
        (timeoutMs - timeSinceLastRequest) / (1000 * 60)
      );

      console.log(`⏳ Timeout ativo. Aguarde ${remainingMinutes} minutos.`);

      return res.status(429).json({
        error: "Muitas requisições",
        message: `Aguarde ${remainingMinutes} minutos antes da próxima requisição`,
      });
    }

    lastRequestTime = now;
    next();
  };
}
