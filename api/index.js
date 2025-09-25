require("dotenv").config();
const express = require("express");
const cors = require("cors");

const {
  validateWeatherData,
  cleanWeatherData,
} = require("../utils/validation");
const {
  authenticateWebhook,
  simpleLogger,
  validateJSON,
} = require("../middleware/auth");
const {
  saveWeatherData,
  getLatestWeatherData,
  getWeatherDataByPeriod,
  testConnection,
} = require("../lib/firebase");

const app = express();

// ========================
// MIDDLEWARES GLOBAIS
// ========================

// CORS - Permite requisições de outros domínios
app.use(
  cors({
    origin: true, // Permite qualquer origem (pode restringir depois se necessário)
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "x-api-key"],
  })
);

// Parse do JSON nas requisições
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Log simples de todas as requisições
app.use(simpleLogger);

// ========================
// ROTAS PÚBLICAS (GET)
// ========================

/**
 * Rota de saúde da API
 * GET /api/health
 */
app.get("/api/health", async (req, res) => {
  try {
    // Testa conexão com Firebase
    const firebaseOk = await testConnection();

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "Ciclus Weather API",
      version: "1.1.0",
      firebase: firebaseOk ? "connected" : "error",
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Problemas na saúde da API",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Rota raiz - Informações básicas da API
 * GET /
 */
app.get("/", (req, res) => {
  res.json({
    message: "API Meteorológica Ciclus",
    version: "1.1.0",
    endpoints: {
      health: "GET /api/health",
      webhook: "POST /api/webhook/weather (requer x-api-key)",
      latest: "GET /api/weather/latest",
      period: "GET /api/weather/period?start=TIMESTAMP&end=TIMESTAMP",
    },
    documentation: "https://github.com/seu-usuario/ciclus-weather-api",
  });
});

/**
 * Dados meteorológicos mais recentes
 * GET /api/weather/latest?limit=20
 */
app.get("/api/weather/latest", async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Valida o limite
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        error: "Parâmetro inválido",
        message: "limit deve ser um número entre 1 e 100",
      });
    }

    const data = await getLatestWeatherData(limitNum);

    res.json({
      success: true,
      count: data.length,
      limit: limitNum,
      data: data,
    });
  } catch (error) {
    console.error("❌ Erro ao consultar dados recentes:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      message: "Falha ao consultar dados meteorológicos",
    });
  }
});

/**
 * Dados meteorológicos por período
 * GET /api/weather/period?start=1746466087000&end=1746552487000&limit=50
 */
app.get("/api/weather/period", async (req, res) => {
  try {
    const { start, end, limit = 100 } = req.query;

    // Valida parâmetros obrigatórios
    if (!start || !end) {
      return res.status(400).json({
        error: "Parâmetros obrigatórios",
        message:
          "start e end são obrigatórios (formato: timestamp em milissegundos)",
        example: "/api/weather/period?start=1746466087000&end=1746552487000",
      });
    }

    // Valida se são timestamps válidos
    const startNum = parseInt(start);
    const endNum = parseInt(end);

    if (isNaN(startNum) || isNaN(endNum)) {
      return res.status(400).json({
        error: "Timestamps inválidos",
        message: "start e end devem ser números (timestamp em milissegundos)",
      });
    }

    if (startNum >= endNum) {
      return res.status(400).json({
        error: "Período inválido",
        message: "start deve ser menor que end",
      });
    }

    // Valida limite
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      return res.status(400).json({
        error: "Limite inválido",
        message: "limit deve ser um número entre 1 e 1000",
      });
    }

    const data = await getWeatherDataByPeriod(start, end, limitNum);

    res.json({
      success: true,
      period: {
        start: new Date(startNum).toISOString(),
        end: new Date(endNum).toISOString(),
        duration: `${Math.round((endNum - startNum) / (1000 * 60 * 60))} horas`,
      },
      count: data.length,
      limit: limitNum,
      data: data,
    });
  } catch (error) {
    console.error("❌ Erro ao consultar dados por período:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      message: "Falha ao consultar dados por período",
    });
  }
});

// ========================
// ROTAS PROTEGIDAS (POST)
// ========================

/**
 * Webhook para receber dados meteorológicos da estação Ciclus
 * POST /api/webhook/weather
 * Headers: { "x-api-key": "seu-uuid-secreto", "Content-Type": "application/json" }
 * Body: { dados meteorológicos conforme documentação }
 */
app.post(
  "/api/webhook/weather",
  validateJSON,
  authenticateWebhook,
  async (req, res) => {
    try {
      const receivedData = req.body;

      console.log("📡 Dados recebidos da estação meteorológica");

      // ETAPA 1: Validação dos dados
      const validation = validateWeatherData(receivedData);

      if (!validation.isValid) {
        console.warn("⚠️ Dados inválidos recebidos:", validation.error);
        return res.status(400).json({
          error: "Dados inválidos",
          message: validation.error,
        });
      }

      // Log de warnings (sensores que podem ter falhado)
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn("⚠️ Avisos de validação:", validation.warnings);
      }

      // ETAPA 2: Limpeza e padronização dos dados
      const cleanedData = cleanWeatherData(receivedData);

      console.log("🧹 Dados limpos e padronizados");
      console.log(
        `📊 Sensores funcionando: ${
          validation.workingSensors?.join(", ") || "N/A"
        }`
      );

      // ETAPA 3: Salvar no Firestore
      const result = await saveWeatherData(cleanedData);

      // ETAPA 4: Resposta de sucesso
      res.status(200).json({
        success: true,
        message: "Dados meteorológicos recebidos e armazenados com sucesso",
        documentId: result.documentId,
        timestamp: result.timestamp,
        receivedAt: cleanedData.receivedAt,
        workingSensors: validation.workingSensors?.length || 0,
        warnings: validation.warnings || [],
      });

      console.log("✅ Dados salvos com sucesso no Firestore");
    } catch (error) {
      console.error("❌ Erro ao processar webhook:", error);

      // Retorna erro genérico (não expõe detalhes internos)
      res.status(500).json({
        error: "Erro interno do servidor",
        message: "Falha ao processar os dados meteorológicos",
      });
    }
  }
);

// ========================
// TRATAMENTO DE ERROS
// ========================

/**
 * Middleware para capturar rotas não encontradas
 */
app.use((req, res, next) => {
  res.status(404).json({
    error: "Rota não encontrada",
    message: `${req.method} ${req.originalUrl} não existe`,
    availableRoutes: [
      "GET /",
      "GET /api/health",
      "GET /api/weather/latest",
      "GET /api/weather/period",
      "POST /api/webhook/weather",
    ],
  });
});

/**
 * Middleware global de tratamento de erros
 */
app.use((error, req, res, next) => {
  console.error("💥 Erro não capturado:", error);

  res.status(500).json({
    error: "Erro interno do servidor",
    message: "Algo inesperado aconteceu",
    timestamp: new Date().toISOString(),
  });
});

// ========================
// INICIALIZAÇÃO DO SERVIDOR
// ========================

const PORT = process.env.PORT || 3000;

// Para desenvolvimento local
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📖 Documentação: http://localhost:${PORT}/`);
  });
}

// Exporta o app para a Vercel
module.exports = app;
