require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Importa nossas funções personalizadas
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
  dataAggregation,
  getCollectionStatus,
} = require("../middleware/aggregation");
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
 * Rota de saúde da API desenvolvida pela Thera Academic Software House
 * GET /api/health
 */
app.get("/api/health", async (req, res) => {
  try {
    // Testa conexão com Firebase
    const firebaseOk = await testConnection();

    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "API Meteorológica UEMA - Estação Ciclus",
      version: "1.3.0",
      desenvolvedor: "Thera Academic Software House - UEMA",
      responsavel: "Sérgio Murilo Castelhano",
      proposito:
        "Democratização de dados meteorológicos para pesquisa acadêmica",
      firebase: firebaseOk ? "connected" : "error",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime
        ? `${Math.floor(process.uptime() / 60)} minutos`
        : "N/A",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: "Problemas na saúde da API",
      service: "API Meteorológica UEMA - Estação Ciclus",
      desenvolvedor: "Thera Academic Software House",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Rota raiz - Informações da API desenvolvida pela Thera Academic Software House
 * GET /
 */
app.get("/", (req, res) => {
  res.json({
    message: "API Meteorológica UEMA - Estação Ciclus",
    description:
      "Democratizando o acesso a dados meteorológicos para pesquisa e educação",
    desenvolvedor: {
      organizacao: "Thera Academic Software House",
      curso: "Engenharia da Computação - UEMA",
      responsavel: "Sérgio Murilo Castelhano",
    },
    solicitante: "Coordenação de Engenharia Agronômica - UEMA",
    proposito:
      "Disponibilizar dados da estação Ciclus sem necessidade de login na plataforma proprietária",
    version: "1.3.0",
    endpoints: {
      health: "GET /api/health",
      webhook: "POST /api/webhook/weather (requer x-api-key)",
      latest: "GET /api/weather/latest",
      period: "GET /api/weather/period?start=TIMESTAMP&end=TIMESTAMP",
    },
    documentacao: "https://github.com/murillous/agronomia-API",
    suporte: "Coordenação de Engenharia Agronômica - UEMA",
  });
});

/**
 * Status da janela de coleta (útil para debug)
 * GET /api/collection/status
 */
app.get("/api/collection/status", (req, res) => {
  const status = getCollectionStatus();

  res.json({
    success: true,
    collectionWindow: status,
    description: status.isActive
      ? "Janela de coleta ativa - agregando dados"
      : "Aguardando próxima requisição para iniciar janela",
    nextProcessingIn:
      status.remainingTime > 0
        ? `${Math.ceil(status.remainingTime / 1000)} segundos`
        : "N/A",
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
 * Agregação: Coleta dados por 1 minuto e calcula médias
 */
app.post(
  "/api/webhook/weather",
  validateJSON,
  authenticateWebhook,
  dataAggregation(async (aggregatedData) => {
    // Callback que será chamado após 1 minuto de coleta

    // ETAPA 1: Validação dos dados agregados
    const validation = validateWeatherData(aggregatedData);

    if (!validation.isValid) {
      console.warn("⚠️ Dados agregados inválidos:", validation.error);
      throw new Error(`Validação falhou: ${validation.error}`);
    }

    // Log de warnings se houver
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn(
        "⚠️ Avisos na validação dos dados agregados:",
        validation.warnings
      );
    }

    // ETAPA 2: Limpeza e padronização dos dados
    const cleanedData = cleanWeatherData(aggregatedData);

    console.log("🧹 Dados agregados limpos e padronizados");
    console.log(
      `📊 Dados baseados em ${aggregatedData.aggregation.packetsCollected} pacotes`
    );

    // ETAPA 3: Salvar no Firestore
    const result = await saveWeatherData(cleanedData);

    console.log("✅ Dados agregados salvos com sucesso no Firestore");

    return result;
  })
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
