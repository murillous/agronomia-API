let lastRequestTime = 0;

/**
 * Middleware simples para timeout entre requisições requisições bem sucedidas
 * @param {number} timeoutMinutes - Tempo em minutos entre requisições (padrão: 9)
 */
function simpleTimeout(timeoutMinutes = 9) {
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

    const originalSend = res.send;
    res.send = (data) => {
        if(res.statusCode >= 200 && res.statusCode < 300) {
            lastRequestTime = now;
            console.log(`✅ Requisição bem-sucedida. Próxima disponível em ${timeoutMinutes} minutos.`);
        }
        return originalSend.call(res, data);
    }

    next();
  };
}

module.exports = {
  simpleTimeout,
};
