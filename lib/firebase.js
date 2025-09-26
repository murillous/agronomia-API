const admin = require("firebase-admin");

let db;

/**
 * Inicializa a conexão com o Firebase se ainda não foi inicializada
 * Usa as credenciais das variáveis de ambiente
 */
function initializeFirebase() {
  // Verifica se o Firebase já foi inicializado
  if (admin.apps.length > 0) {
    console.log("✅ Firebase já inicializado");
    return admin.app();
  }

  try {
    // Constrói o objeto de credenciais usando as variáveis de ambiente
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE || "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com",
    };

    if (
      !serviceAccount.project_id ||
      !serviceAccount.private_key ||
      !serviceAccount.client_email
    ) {
      throw new Error(
        "Credenciais Firebase incompletas. Verifique as variáveis de ambiente."
      );
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log("🔥 Firebase inicializado com sucesso");
    console.log(`📍 Projeto: ${serviceAccount.project_id}`);

    return app;
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error.message);
    throw error;
  }
}

/**
 * Obtém a conexão com o Firestore
 * Inicializa o Firebase se necessário
 * @returns {admin.firestore.Firestore} Instância do Firestore
 */
function getFirestore() {
  if (!db) {
    initializeFirebase();
    db = admin.firestore();

    db.settings({
      timestampsInSnapshots: true, 
    });

    console.log("🗄️ Conexão com Firestore estabelecida");
  }

  return db;
}

/**
 * Testa a conexão com o Firestore
 * @returns {Promise<boolean>} true se a conexão funciona
 */
async function testConnection() {
  try {
    const firestore = getFirestore();

    const testDoc = await firestore.collection("_test").doc("connection").get();
    console.log("✅ Teste de conexão Firestore bem-sucedido");

    return true;
  } catch (error) {
    console.error("❌ Teste de conexão Firestore falhou:", error.message);
    return false;
  }
}

/**
 * Salva dados meteorológicos no Firestore
 * @param {Object} weatherData - Dados meteorológicos já validados e limpos
 * @returns {Promise<Object>} Resultado da operação
 */
async function saveWeatherData(weatherData) {
  try {
    const firestore = getFirestore();

    // Adiciona timestamp de processamento do servidor
    const dataToSave = {
      ...weatherData,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore.collection("weather_data").add(dataToSave);

    console.log(`💾 Dados salvos - Doc ID: ${docRef.id}`);

    return {
      success: true,
      documentId: docRef.id,
      timestamp: weatherData.ts,
    };
  } catch (error) {
    console.error("❌ Erro ao salvar no Firestore:", error.message);
    throw error;
  }
}

/**
 * Consulta dados meteorológicos mais recentes
 * @param {number} limit - Número máximo de registros
 * @returns {Promise<Array>} Array com os dados mais recentes
 */
async function getLatestWeatherData(limit = 20) {
  try {
    const firestore = getFirestore();

    const snapshot = await firestore
      .collection("weather_data")
      .orderBy("ts", "desc")
      .limit(parseInt(limit))
      .get();

    const data = [];
    snapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return data;
  } catch (error) {
    console.error("❌ Erro ao consultar dados mais recentes:", error.message);
    throw error;
  }
}

/**
 * Consulta dados por período de tempo
 * @param {string} startDate - Data inicial (timestamp ms)
 * @param {string} endDate - Data final (timestamp ms)
 * @param {number} limit - Limite de registros
 * @returns {Promise<Array>} Array com os dados do período
 */
async function getWeatherDataByPeriod(startDate, endDate, limit = 100) {
  try {
    const firestore = getFirestore();

    const snapshot = await firestore
      .collection("weather_data")
      .where("ts", ">=", startDate)
      .where("ts", "<=", endDate)
      .orderBy("ts", "desc")
      .limit(parseInt(limit))
      .get();

    const data = [];
    snapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return data;
  } catch (error) {
    console.error("❌ Erro ao consultar dados por período:", error.message);
    throw error;
  }
}

// Inicializa automaticamente quando o módulo é carregado
// Mas só se as variáveis de ambiente estiverem definidas
if (process.env.FIREBASE_PROJECT_ID) {
  try {
    initializeFirebase();
  } catch (error) {
    console.warn(
      "⚠️ Firebase não pôde ser inicializado automaticamente:",
      error.message
    );
  }
}

// Exporta as funções essenciais
module.exports = {
  admin,
  getFirestore,
  testConnection,
  saveWeatherData,
  getLatestWeatherData,
  getWeatherDataByPeriod,
};
