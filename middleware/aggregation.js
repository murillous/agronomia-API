// Estado da janela de coleta
let collectionWindow = {
  isActive: false,
  startTime: null,
  data: [],
  timeout: null,
};

/**
 * Middleware para agregação de dados meteorológicos
 * Coleta dados por 1 minuto e calcula médias
 * @param {Function} saveCallback - Função para salvar dados agregados
 */
function dataAggregation(saveCallback) {
  return async (req, res, next) => {
    try {
      const receivedData = req.body;
      const now = Date.now();

      // Se não há janela ativa, inicia uma nova
      if (!collectionWindow.isActive) {
        console.log("🪟 Iniciando janela de coleta de 1 minuto");

        collectionWindow.isActive = true;
        collectionWindow.startTime = now;
        collectionWindow.data = [];

        // Configura timeout para processar dados após 1 minuto
        collectionWindow.timeout = setTimeout(async () => {
          await processCollectedData(saveCallback);
        }, 60000); // 60 segundos
      }

      // Adiciona dados à coleção
      collectionWindow.data.push({
        ...receivedData,
        collectedAt: now,
      });

      console.log(
        `📦 Dados coletados: ${collectionWindow.data.length} pacotes na janela`
      );

      // Responde imediatamente (não espera processamento)
      res.status(200).json({
        success: true,
        message: "Dados coletados para agregação",
        collectionWindow: {
          packetsCollected: collectionWindow.data.length,
          windowStarted: new Date(collectionWindow.startTime).toISOString(),
          willProcessAt: new Date(
            collectionWindow.startTime + 60000
          ).toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Erro na agregação:", error);

      // Em caso de erro, processa o que tem e limpa janela
      if (collectionWindow.isActive) {
        clearTimeout(collectionWindow.timeout);
        await processCollectedData(saveCallback);
      }

      res.status(500).json({
        error: "Erro interno do servidor",
        message: "Falha na coleta de dados",
      });
    }
  };
}

/**
 * Processa dados coletados e calcula médias
 * @param {Function} saveCallback - Função para salvar no banco
 */
async function processCollectedData(saveCallback) {
  try {
    if (!collectionWindow.data || collectionWindow.data.length === 0) {
      console.log("⚠️ Nenhum dado para processar na janela");
      resetCollectionWindow();
      return;
    }

    console.log(
      `🧮 Processando ${collectionWindow.data.length} pacotes coletados`
    );

    // Calcula dados agregados
    const aggregatedData = calculateAverages(collectionWindow.data);

    // Salva no banco de dados
    const result = await saveCallback(aggregatedData);

    console.log(`✅ Dados agregados salvos no banco: ${result.documentId}`);
    console.log(
      `📊 Resumo: ${collectionWindow.data.length} pacotes → 1 registro agregado`
    );
  } catch (error) {
    console.error("❌ Erro ao processar dados agregados:", error);
  } finally {
    resetCollectionWindow();
  }
}

/**
 * Calcula médias dos valores numéricos
 * @param {Array} dataArray - Array com os dados coletados
 * @returns {Object} - Dados agregados com médias
 */
function calculateAverages(dataArray) {
  if (dataArray.length === 0) return null;
  if (dataArray.length === 1) return dataArray[0];

  // Campos numéricos que devem ser agregados (médias)
  const numericFields = [
    "Temperatura",
    "Umidade",
    "PluviometroH",
    "PluviometroD",
    "Pressao",
    "VelocidadeMedia",
    "VelocidadeMax",
    "DirecaoVento",
    "UmidadeSolo",
    "TemperaturaSolo",
    "UmidadeSolo_2",
    "TemperaturaSolo_2",
    "UmidadeSolo_3",
    "TemperaturaSolo_3",
    "UmidadeFolear",
    "TemperaturaFolear",
    "Solarizacao",
    "pmc10",
    "pmc25",
    "pmc100",
    "RSSI",
    "Bateria",
    "Boot",
    "MacId",
    "TemperaturaInterna",
    "pontoOrvalho",
    "sensacaoTermica",
  ];

  // Campos que devem manter o valor do primeiro ou último pacote
  const staticFields = ["VersaoSw", "VersaoPcb", "IdEstacao"];

  const result = {};
  const firstPacket = dataArray[0];
  const lastPacket = dataArray[dataArray.length - 1];

  // Calcula médias para campos numéricos
  numericFields.forEach((field) => {
    const values = dataArray
      .map((item) => item[field])
      .filter((val) => val !== null && val !== undefined && !isNaN(val));

    if (values.length > 0) {
      result[field] = parseFloat(
        (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
      );
    } else {
      result[field] = firstPacket[field] || null;
    }
  });

  // Mantém valores estáticos
  staticFields.forEach((field) => {
    result[field] = firstPacket[field];
  });

  // Timestamp: usa o do primeiro pacote (início da janela)
  result.ts = firstPacket.ts;

  // Metadados da agregação
  result.aggregation = {
    packetsCollected: dataArray.length,
    collectionStarted: new Date(collectionWindow.startTime).toISOString(),
    collectionEnded: new Date().toISOString(),
    method: "average",
  };

  // Campos da API
  result.receivedAt = new Date().toISOString();
  result.apiVersion = "1.2.0";

  console.log(`📊 Médias calculadas a partir de ${dataArray.length} pacotes`);
  console.log(
    `📈 Exemplo - Temperatura: ${result.Temperatura}°C (média de ${dataArray.length} valores)`
  );

  return result;
}

/**
 * Reseta a janela de coleta
 */
function resetCollectionWindow() {
  if (collectionWindow.timeout) {
    clearTimeout(collectionWindow.timeout);
  }

  collectionWindow = {
    isActive: false,
    startTime: null,
    data: [],
    timeout: null,
  };

  console.log("🔄 Janela de coleta resetada");
}

/**
 * Função para obter status da janela (útil para debug)
 */
function getCollectionStatus() {
  return {
    isActive: collectionWindow.isActive,
    packetsCollected: collectionWindow.data ? collectionWindow.data.length : 0,
    startTime: collectionWindow.startTime
      ? new Date(collectionWindow.startTime).toISOString()
      : null,
    remainingTime: collectionWindow.startTime
      ? Math.max(0, 60000 - (Date.now() - collectionWindow.startTime))
      : 0,
  };
}

module.exports = {
  dataAggregation,
  getCollectionStatus,
  resetCollectionWindow,
};
