const API_URL = 'https://agronomia-api.vercel.app/api/weather/latest';
let currentLimit = 20;
const UPDATE_INTERVAL = 60000;

let recordsHistory = [];
let allData = [];

const recordsList = document.getElementById('recordsList');
const recordLimitSelect = document.getElementById('recordLimit');
const applyFilterBtn = document.getElementById('applyFilter');
const exportDataBtn = document.getElementById('exportData');

async function fetchWeatherData() {
  try {
    const response = await fetch(`${API_URL}?limit=${currentLimit}`);
    if (!response.ok) throw new Error('Erro ao buscar dados');
    
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      recordsHistory = result.data;
      allData = result;
      
      renderRecords();
      updateLastUpdateTime();
      
      saveToLocalStorage();
    } else {
      throw new Error('Nenhum dado disponível');
    }
  } catch (error) {
    console.error('Erro:', error);
    showError();
  }
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('weatherHistory', JSON.stringify(recordsHistory));
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('weatherHistory');
    if (saved) {
      recordsHistory = JSON.parse(saved);
    }
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
  }
}

function renderRecords() {
  const container = document.querySelector('.card');
  if (!container) return;
  
  container.innerHTML = '';
  
  recordsHistory.forEach((data, index) => {
    const recordElement = createRecordElement(data, index);
    container.appendChild(recordElement);
  });
  
  updateRecordCount();
}

function createRecordElement(data, index) {
  const timestamp = data.ts ? new Date(parseInt(data.ts)) : new Date(data.processedAt);
  const timeString = timestamp.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  const recordId = data.id || `rec${index}`;
  
  const div = document.createElement('div');
  div.className = 'record-item';
  div.innerHTML = `
    <div class="record-header">
      <strong class="record-time">${timeString}</strong>
      <span class="record-id">ID: ${recordId.substring(0, 12)}</span>
    </div>
    
    <div class="record-metrics">
      <!-- Principais Métricas Ambientais -->
      <div class="record-group">
        <div class="record-icon">🌡️</div>
        <div class="record-info">
          <span class="record-label">Temperatura</span>
          <span class="record-value">${data.Temperatura?.toFixed(1) || '--'}°C</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">💧</div>
        <div class="record-info">
          <span class="record-label">Umidade</span>
          <span class="record-value">${data.Umidade?.toFixed(1) || '--'}%</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🌡️</div>
        <div class="record-info">
          <span class="record-label">Temp. Interna</span>
          <span class="record-value">${data.TemperaturaInterna?.toFixed(1) || '--'}°C</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">💨</div>
        <div class="record-info">
          <span class="record-label">Ponto de Orvalho</span>
          <span class="record-value">${data.pontoOrvalho?.toFixed(1) || '--'}°C</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🌡️</div>
        <div class="record-info">
          <span class="record-label">Sensação Térmica</span>
          <span class="record-value">${data.sensacaoTermica?.toFixed(1) || '--'}°C</span>
        </div>
      </div>
      
      <!-- Pressão Atmosférica -->
      <div class="record-group">
        <div class="record-icon">📊</div>
        <div class="record-info">
          <span class="record-label">Pressão</span>
          <span class="record-value">${data.Pressao?.toFixed(1) || '--'} hPa</span>
        </div>
      </div>
      
      <!-- Vento -->
      <div class="record-group">
        <div class="record-icon">💨</div>
        <div class="record-info">
          <span class="record-label">Vel. Média do Vento</span>
          <span class="record-value">${data.VelocidadeMedia?.toFixed(1) || '--'} km/h</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🌪️</div>
        <div class="record-info">
          <span class="record-label">Vel. Máxima do Vento</span>
          <span class="record-value">${data.VelocidadeMax?.toFixed(1) || '--'} km/h</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🧭</div>
        <div class="record-info">
          <span class="record-label">Direção do Vento</span>
          <span class="record-value">${getWindDirection(data.DirecaoVento)} (${data.DirecaoVento || '--'}°)</span>
        </div>
      </div>
      
      <!-- Precipitação -->
      <div class="record-group">
        <div class="record-icon">🌧️</div>
        <div class="record-info">
          <span class="record-label">Precipitação Horária</span>
          <span class="record-value">${data.PluviometroH?.toFixed(1) || '--'} mm</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">☔</div>
        <div class="record-info">
          <span class="record-label">Precipitação Diária</span>
          <span class="record-value">${data.PluviometroD?.toFixed(1) || '--'} mm</span>
        </div>
      </div>
      
      <!-- Radiação Solar -->
      <div class="record-group">
        <div class="record-icon">☀️</div>
        <div class="record-info">
          <span class="record-label">Solarização</span>
          <span class="record-value">${data.Solarizacao || '--'} W/m²</span>
        </div>
      </div>
      
      <!-- Dados do Sistema -->
      <div class="record-group">
        <div class="record-icon">📡</div>
        <div class="record-info">
          <span class="record-label">RSSI (Sinal)</span>
          <span class="record-value">${data.RSSI || '--'} dBm</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🔋</div>
        <div class="record-info">
          <span class="record-label">Bateria</span>
          <span class="record-value">${data.Bateria || '--'}%</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🔄</div>
        <div class="record-info">
          <span class="record-label">Boot Count</span>
          <span class="record-value">${data.Boot || '--'}</span>
        </div>
      </div>
      
      <!-- Informações Técnicas -->
      <div class="record-group">
        <div class="record-icon">💾</div>
        <div class="record-info">
          <span class="record-label">Versão Software</span>
          <span class="record-value">${data.VersaoSw || '--'}</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🖥️</div>
        <div class="record-info">
          <span class="record-label">Versão PCB</span>
          <span class="record-value">${data.VersaoPcb || '--'}</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🆔</div>
        <div class="record-info">
          <span class="record-label">MAC ID</span>
          <span class="record-value">${data.MacId || '--'}</span>
        </div>
      </div>
      
      <div class="record-group">
        <div class="record-icon">🏠</div>
        <div class="record-info">
          <span class="record-label">ID Estação</span>
          <span class="record-value">${data.IdEstacao || '--'}</span>
        </div>
      </div>
    </div>
    
    <div class="record-footer">
      <span class="api-info">📡 API v${data.apiVersion || '--'}</span>
      <span class="processed-time">Processado: ${data.processedAt ? new Date(data.processedAt).toLocaleString('pt-BR') : '--'}</span>
    </div>
  `;
  
  return div;
}

function getWindDirection(degrees) {
  if (degrees === null || degrees === undefined) return '--';
  
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const index = Math.round(((degrees % 360) / 45)) % 8;
  return directions[index];
}

function updateLastUpdateTime() {
  const timeDisplay = document.getElementById('lastUpdate');
  if (timeDisplay) {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('pt-BR');
  }
}

function updateRecordCount() {
  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    subtitle.textContent = `${recordsHistory.length} registros carregados · Estação ID: ${recordsHistory[0]?.IdEstacao || '123'}`;
  }
}

function showError() {
  const container = document.querySelector('.card');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: rgba(255, 255, 255, 0.7);">
        <p style="font-size: 1.2rem; margin-bottom: 1rem;">❌ Erro ao carregar dados</p>
        <p>Tentando carregar dados salvos...</p>
      </div>
    `;
  }
  
  loadFromLocalStorage();
  if (recordsHistory.length > 0) {
    renderRecords();
  }
}

function applyFilter() {
  const selectedLimit = parseInt(recordLimitSelect.value);
  if (selectedLimit !== currentLimit) {
    currentLimit = selectedLimit;
    fetchWeatherData();
  }
}

function exportData() {
  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `weather-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

if (applyFilterBtn) {
  applyFilterBtn.addEventListener('click', applyFilter);
}

if (exportDataBtn) {
  exportDataBtn.addEventListener('click', exportData);
}

if (recordLimitSelect) {
  recordLimitSelect.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFilter();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  fetchWeatherData();
  
  setInterval(fetchWeatherData, UPDATE_INTERVAL);
});
