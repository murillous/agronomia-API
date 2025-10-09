const API_URL = 'https://agronomia-api.vercel.app/api/weather/latest';
const UPDATE_INTERVAL = 60000;

async function fetchWeatherData() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Erro ao buscar dados');
    
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      const data = result.data[0];
      updateDashboard(data);
      updateLastUpdateTime();
    } else {
      throw new Error('Nenhum dado disponível');
    }
  } catch (error) {
    console.error('Erro:', error);
    showError();
  }
}

function updateDashboard(data) {
  updateElement('.temp-main', `${data.Temperatura?.toFixed(1)}°C`);
  
  const metricValues = document.querySelectorAll('.card-hero .metric-value');
  if (metricValues.length >= 4) {
    metricValues[0].textContent = `${data.Umidade?.toFixed(0)}%`;
    metricValues[1].textContent = data.Pressao?.toFixed(0) || '---';
    metricValues[2].textContent = `${data.pontoOrvalho?.toFixed(1)}°C`;
    metricValues[3].textContent = `${data.sensacaoTermica?.toFixed(1)}°C`;
  }
  
  const windSections = document.querySelectorAll('.cards-row:nth-of-type(1) .card:nth-of-type(1) .metric-value-sm');
  if (windSections.length >= 3) {
    windSections[0].textContent = `${data.VelocidadeMedia?.toFixed(1)} m/s`;
    windSections[1].textContent = `${data.VelocidadeMax?.toFixed(1)} m/s`;
    windSections[2].textContent = `${data.DirecaoVento}°`;
  }
  
  const rainSections = document.querySelectorAll('.cards-row:nth-of-type(1) .card:nth-of-type(2) .metric-value-sm');
  if (rainSections.length >= 2) {
    rainSections[0].textContent = `${data.PluviometroH || 0} mm`;
    rainSections[1].textContent = `${data.PluviometroD || 0} mm`;
  }
  
  const solarSection = document.querySelector('.cards-row:nth-of-type(2) .card:nth-of-type(1) .metric-value-sm');
  if (solarSection && data.Solarizacao !== undefined) {
    solarSection.textContent = `${data.Solarizacao} W/m²`;
  }
  
  const systemSections = document.querySelectorAll('.cards-row:nth-of-type(2) .card:nth-of-type(2) .metric-value-sm');
  if (systemSections.length >= 4) {
    if (data.Bateria !== undefined) {
      systemSections[0].textContent = `${data.Bateria}%`;
      systemSections[0].className = data.Bateria > 50 ? 'metric-value-sm status-good' : 'metric-value-sm';
    }
    if (data.RSSI !== undefined) systemSections[1].textContent = `${data.RSSI} dBm`;
    if (data.TemperaturaInterna !== undefined) systemSections[2].textContent = `${data.TemperaturaInterna}°C`;
    if (data.Boot !== undefined) systemSections[3].textContent = data.Boot;
  }
  
  const systemInfo = document.querySelector('.system-info');
  if (systemInfo) {
    const spans = systemInfo.querySelectorAll('span');
    if (spans[0] && data.VersaoSw) {
      spans[0].innerHTML = `<strong>Versão SW:</strong> ${data.VersaoSw}`;
    }
    if (spans[1] && data.VersaoPcb) {
      spans[1].innerHTML = `<strong>Versão PCB:</strong> ${data.VersaoPcb}`;
    }
    if (spans[2] && data.MacId) {
      spans[2].innerHTML = `<strong>MAC ID:</strong> ${data.MacId}`;
    }
  }
}

function updateElement(selector, value) {
  const element = document.querySelector(selector);
  if (element && value !== undefined && value !== null) {
    element.textContent = value;
  }
}

function updateLastUpdateTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    subtitle.textContent = `Estação ID: 123 · Atualizado às ${timeString}`;
    subtitle.style.color = '';
  }
}

function showError() {
  const subtitle = document.querySelector('.subtitle');
  if (subtitle) {
    subtitle.textContent = 'Erro ao carregar dados · Tentando novamente...';
    subtitle.style.color = '#ff3b30';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchWeatherData();
  setInterval(fetchWeatherData, UPDATE_INTERVAL);
});
