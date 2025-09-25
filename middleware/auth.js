/**
 * Middleware para autenticar requisições do webhook Ciclus
 * Validação simples do x-api-key conforme documentação
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
function authenticateWebhook(req, res, next) {
  // Extrair a chave do header
  const apiKey = req.headers["x-api-key"];

  // Verificar se a chave foi enviada
  if (!apiKey) {
    return res.status(401).json({
      error: "Não autorizado",
      message: "x-api-key ausente ou inválido",
    });
  }

  // Verificar se temos uma chave configurada
  const validApiKey = process.env.API_KEY;
  if (!validApiKey) {
    console.error("⚠️ API_KEY não configurada no ambiente");
    return res.status(500).json({
      error: "Erro interno do servidor",
    });
  }

  // Comparar as chaves
  if (apiKey !== validApiKey) {
    console.log(
      `⚠️ Tentativa de acesso com chave inválida: ${apiKey.substring(0, 8)}...`
    );
    return res.status(401).json({
      error: "Não autorizado",
      message: "x-api-key ausente ou inválido",
    });
  }

  // ✅ Autenticado com sucesso
  console.log(`✅ Webhook autenticado: ${new Date().toISOString()}`);
  next();
}

/**
 * Middleware simples para log das requisições
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
function simpleLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`);
  next();
}

/**
 * Middleware para validar JSON em requisições POST
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Próximo middleware
 */
function validateJSON(req, res, next) {
  if (req.method === "POST") {
    const contentType = req.headers["content-type"];

    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        error: "Requisição inválida (erro de validação do JSON)",
        message: "Content-Type deve ser application/json",
      });
    }
  }

  next();
}

module.exports = {
  authenticateWebhook,
  simpleLogger,
  validateJSON,
};
