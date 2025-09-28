/**
 * Se algum campo desse falhar, a estação não está funcionando corretamente
 */

const CRITICAL_FIELDS = ["IdEstacao", "ts"];

/**
 * Para não haver bloqueio nas informações, pelo menos UM campo desse precisa está funcinando
 */

const SENSOR_FIELDS = [
  "Temperatura",
  "Umidade",
  "Pressao",
  "PluviometroH",
  "PluviometroD",
  "VelocidadeMedia",
  "UmidadeSolo",
  "Solarizacao",
];

/**
 * Especificações para cada campo baseado na documentação
 */

const FIELD_SPECS = {
  // Vou dividir um pouco o código usando comentários porque eu acho mais agradavel
  // Sensores principais
  Temperatura: { type: "float", min: -50, max: 70, unit: "°C" },
  Umidade: { type: "float", min: 0, max: 100, unit: "%" },
  PluviometroH: { type: "integer", min: 0, max: 1000, unit: "mm" },
  PluviometroD: { type: "integer", min: 0, max: 5000, unit: "mm" },
  Pressao: { type: "float", min: 800, max: 1200, unit: "hPa" },
  pontoOrvalho: { type: "float", min: -50, max: 70, unit: "°C" },
  sensacaoTermica: { type: "float", min: -50, max: 70, unit: "°C" },

  // Vento
  VelocidadeMedia: { type: "float", min: 0, max: 200, unit: "m/s" },
  VelocidadeMax: { type: "float", min: 0, max: 200, unit: "m/s" },
  DirecaoVento: { type: "integer", min: 0, max: 360, unit: "graus" },

  // Solo - profundidade padrão
  UmidadeSolo: { type: "float", min: 0, max: 100, unit: "%" },
  TemperaturaSolo: { type: "float", min: -20, max: 60, unit: "°C" },

  // Solo - profundidade 2
  UmidadeSolo_2: { type: "float", min: 0, max: 100, unit: "%" },
  TemperaturaSolo_2: { type: "float", min: -20, max: 60, unit: "°C" },

  // Solo - profundidade 3
  UmidadeSolo_3: { type: "float", min: 0, max: 100, unit: "%" },
  TemperaturaSolo_3: { type: "float", min: -20, max: 60, unit: "°C" },

  // Foliar
  UmidadeFolear: { type: "float", min: 0, max: 100, unit: "%" },
  TemperaturaFolear: { type: "float", min: -20, max: 60, unit: "°C" },

  // Radiação
  Solarizacao: { type: "integer", min: 0, max: 2000, unit: "W/m²" },

  // Qualidade do ar
  pmc10: { type: "float", min: 0, max: 1000, unit: "μg/m³" },
  pmc25: { type: "float", min: 0, max: 1000, unit: "μg/m³" },
  pmc100: { type: "float", min: 0, max: 1000, unit: "μg/m³" },

  // Sistema
  RSSI: { type: "integer", min: -120, max: 0, unit: "dBm" },
  Bateria: { type: "integer", min: 0, max: 100, unit: "%" },
  Boot: { type: "integer", min: 0, max: 999999, unit: "count" },
  VersaoSw: { type: "string" },
  VersaoPcb: { type: "string" },
  MacId: { type: "float", min: 0, max: 999999 },
  TemperaturaInterna: { type: "float", min: -40, max: 85, unit: "°C" },

  // Identificação
  IdEstacao: { type: "integer", min: 1, max: 9999999999 },
  ts: { type: "string" }, // epoch ms UTC
};

/**
 * Valida apenas os campos críticos
 * @param {Object} data - Dados recebidos
 * @returns {Object} - {isValid: boolean, error?: boolean}
 */

function validateCriticalFields(data) {
  if (!data || typeof data != "object") {
    return { isValid: false, error: "Dados devem ser um objeto JSON válido" };
  }

  for (const field of CRITICAL_FIELDS) {
    if (data[field] == undefined || data[field] == null) {
      return {
        isValid: false,
        missingField: field,
        error: `Campo crítico ausente ${field}`,
      };
    }
    return { isValid: true };
  }
}

/**
 * Verifica se pelo menos um sensor está funcionando
 * @param {Object} data - Dados recebidos
 * @returns {Object} - {isValid: boolean, error?: string, workingSensors?: array}
 */

function validateSensorAvailability(data) {
  const workingSensors = [];

  for (const field of SENSOR_FIELDS) {
    if (data[field] !== undefined || data[field] != null) {
      workingSensors.push(field);
    }
  }

  if (workingSensors.length === 0) {
    return {
      isValid: false,
      error: "Nenhum sensor está enviando dados válidos",
    };
  }

  return {
    isValid: true,
    workingSensors,
    message: `${
      workingSensors.length
    } sensores estão funcionando: ${workingSensors.join(", ")}`,
  };
}

/**
 * Valida um campo específico se ele existir
 * @param {string} fieldName - Nome do campo
 * @param {any} value - Valor do campo
 * @returns {Object} - {isValid: boolean, error?: string}
 */
function validateField(fieldName, value) {
  const spec = FIELD_SPECS[fieldName];
  if (!spec) {
    // Campo não reconhecido, mas não é erro crítico
    return { isValid: true, warning: `Campo não reconhecido: ${fieldName}` };
  }

  // Se o valor é null/undefined, não é erro (sensor pode ter falhado)
  if (value === null || value === undefined) {
    return { isValid: true };
  }

  // Validação de tipo
  if (spec.type === "float" || spec.type === "integer") {
    if (typeof value !== "number") {
      return {
        isValid: false,
        error: `Campo '${fieldName}' deve ser um número, recebido: ${typeof value}`,
      };
    }

    // Validação de limites
    if (spec.min !== undefined && value < spec.min) {
      return {
        isValid: false,
        error: `Campo '${fieldName}' fora dos limites: ${value} < ${spec.min} ${
          spec.unit || ""
        }`,
      };
    }
    if (spec.max !== undefined && value > spec.max) {
      return {
        isValid: false,
        error: `Campo '${fieldName}' fora dos limites: ${value} > ${spec.max} ${
          spec.unit || ""
        }`,
      };
    }
  }

  if (spec.type === "string" && typeof value !== "string") {
    return {
      isValid: false,
      error: `Campo '${fieldName}' deve ser uma string, recebido: ${typeof value}`,
    };
  }

  return { isValid: true };
}

/**
 * Valida o timestamp especificamente
 * @param {string} ts - Timestamp em formato epoch ms
 * @returns {Object} - {isValid: boolean, error?: string}
 */
function validateTimestamp(ts) {
  if (!ts) {
    return { isValid: false, error: "Timestamp (ts) é obrigatório" };
  }

  // Deve ser uma string de acordo com a documentação
  if (typeof ts !== "string") {
    return { isValid: false, error: "Timestamp (ts) deve ser uma string" };
  }

  // Converte para número para validar
  const timestamp = parseInt(ts);
  if (isNaN(timestamp)) {
    return {
      isValid: false,
      error: "Timestamp (ts) deve ser um número válido em formato epoch ms",
    };
  }

  // Verifica se está em milissegundos (epoch ms)
  if (timestamp.toString().length !== 13) {
    return {
      isValid: false,
      error:
        "Timestamp (ts) deve estar em formato epoch milissegundos (13 dígitos)",
    };
  }

  // Verifica se não é muito antigo (mais de 1 semana) ou muito futuro (mais de 1 hora)
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneHourFromNow = now + 60 * 60 * 1000;

  if (timestamp < oneWeekAgo) {
    return {
      isValid: false,
      error: `Timestamp muito antigo: ${new Date(timestamp).toISOString()}`,
    };
  }

  if (timestamp > oneHourFromNow) {
    return {
      isValid: false,
      error: `Timestamp muito futuro: ${new Date(timestamp).toISOString()}`,
    };
  }

  return { isValid: true };
}

/**
 * Função principal de validação
 * @param {Object} data - Dados recebidos do webhook
 * @returns {Object} - {isValid: boolean, error?: string, warnings?: array, report?: object}
 */
function validateWeatherData(data) {
  const warnings = [];
  const report = {
    criticalFields: "pending",
    sensorAvailability: "pending",
    fieldValidations: "pending",
    timestamp: "pending",
  };

  // 1. Campos obrigatórios
  const criticalValidation = validateCriticalFields(data);
  report.criticalFields = criticalValidation.isValid ? "passed" : "failed";
  if (!criticalValidation.isValid) {
    return { isValid: false, error: criticalValidation.error, report };
  }

  // 2. Pelo menos um sensor funcionando
  const sensorValidation = validateSensorAvailability(data);
  report.sensorAvailability = sensorValidation.isValid ? "passed" : "failed";
  if (!sensorValidation.isValid) {
    return { isValid: false, error: sensorValidation.error, report };
  }
  if (sensorValidation.message) {
    warnings.push(sensorValidation.message);
  }

  // 3. Timestamp válido
  const timestampValidation = validateTimestamp(data.ts);
  report.timestamp = timestampValidation.isValid ? "passed" : "failed";
  if (!timestampValidation.isValid) {
    return { isValid: false, error: timestampValidation.error, report };
  }

  // 4. Validar cada campo que existe
  const fieldErrors = [];
  for (const [fieldName, value] of Object.entries(data)) {
    const fieldValidation = validateField(fieldName, value);
    if (!fieldValidation.isValid) {
      fieldErrors.push(fieldValidation.error);
    }
    if (fieldValidation.warning) {
      warnings.push(fieldValidation.warning);
    }
  }

  report.fieldValidations = fieldErrors.length === 0 ? "passed" : "failed";

  // Se há erros de campo, registramos mas NÃO rejeitamos os dados
  if (fieldErrors.length > 0) {
    warnings.push(
      `Problemas em ${fieldErrors.length} campo(s): ${fieldErrors.join("; ")}`
    );
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    report,
    workingSensors: sensorValidation.workingSensors,
  };
}

/**
 * Limpa e padroniza os dados baseado nas especificações
 * @param {Object} data - Dados validados
 * @returns {Object} - Dados limpos
 */
function cleanWeatherData(data) {
  const cleaned = {};

  // Processa cada campo baseado nas especificações
  for (const [fieldName, value] of Object.entries(data)) {
    const spec = FIELD_SPECS[fieldName];

    if (!spec) {

      cleaned[fieldName] = value;
      continue;
    }

    if (value === null || value === undefined) {
      cleaned[fieldName] = null;
      continue;
    }

    // Converte baseado no tipo especificado
    if (spec.type === "float") {
      cleaned[fieldName] = Number(value);
    } else if (spec.type === "integer") {
      cleaned[fieldName] = Math.round(Number(value));
    } else if (spec.type === "string") {
      cleaned[fieldName] = String(value);
    } else {
      cleaned[fieldName] = value;
    }
  }

  // Metadados
  cleaned.apiVersion = "1.2.0";

  return cleaned;
}

// Exporta as funções
module.exports = {
  validateWeatherData,
  cleanWeatherData,
  validateCriticalFields,
  validateSensorAvailability,
  validateField,
  validateTimestamp,
  FIELD_SPECS,
  CRITICAL_FIELDS,
  SENSOR_FIELDS,
};
