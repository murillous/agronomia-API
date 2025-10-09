const API_URL = 'https://agronomia-api.vercel.app/api/weather/latest';
const UPDATE_INTERVAL = 60000;

let weatherData = [];
let charts = {};

async function fetchWeatherData() {
  try {
    const response = await fetch(`${API_URL}?limit=50`);
    const result = await response.json();
    
    if (result.success && result.data) {
      weatherData = result.data;
      updateAllVisualizations();
      updateLastUpdateTime();
    }
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}

function calculateDeltaT(temp, humidity) {
  const T = temp;
  const RH = humidity;
  
  const e = (RH / 100) * 6.112 * Math.exp((17.67 * T) / (T + 243.5));
  const Tw = (243.5 * Math.log(e / 6.112)) / (17.67 - Math.log(e / 6.112));
  const deltaT = T - Tw;
  
  return deltaT;
}

function updateDeltaT() {
  if (!weatherData.length) return;
  
  const latest = weatherData[0];
  const temp = latest.Temperatura;
  const humidity = latest.Umidade;
  const windSpeed = latest.VelocidadeMedia;
  
  const deltaT = calculateDeltaT(temp, humidity);
  
  // Atualizar valores
  document.getElementById('deltaqValue').textContent = `${deltaT.toFixed(1)}°C`;
  document.getElementById('windSpeedValue').textContent = `${windSpeed.toFixed(1)} km/h`;
  
  // Recomendação Delta T
  let recommendation = '';
  let recommendationClass = '';
  
  if (deltaT >= 2 && deltaT <= 8) {
    recommendation = '✅ Condições IDEAIS para pulverização';
    recommendationClass = 'ideal';
  } else if (deltaT < 2) {
    recommendation = '⚠️ Delta T BAIXO - Risco de escorrimento';
    recommendationClass = 'warning';
  } else if (deltaT > 8 && deltaT <= 10) {
    recommendation = '⚠️ Delta T ALTO - Atenção à evaporação';
    recommendationClass = 'warning';
  } else {
    recommendation = '❌ Delta T MUITO ALTO - NÃO recomendado';
    recommendationClass = 'danger';
  }
  
  const recElement = document.getElementById('deltaqRecommendation');
  recElement.textContent = recommendation;
  recElement.className = `deltaq-recommendation ${recommendationClass}`;
  
  let windRec = '';
  let windClass = '';
  
  if (windSpeed >= 3 && windSpeed <= 12) {
    windRec = '✅ Velocidade IDEAL';
    windClass = 'ideal';
  } else if (windSpeed < 3) {
    windRec = '⚠️ Vento FRACO - Risco de inversão térmica';
    windClass = 'warning';
  } else {
    windRec = '❌ Vento FORTE - Risco de deriva';
    windClass = 'danger';
  }
  
  const windRecElement = document.getElementById('windRecommendation');
  windRecElement.textContent = windRec;
  windRecElement.className = `wind-recommendation ${windClass}`;
  
  renderDeltaTChart(temp, humidity, deltaT);
}

function renderDeltaTChart(currentTemp, currentHumidity, currentDeltaT) {
  const ctx = document.getElementById('deltaqChart');
  if (!ctx) return;
  
  if (charts.deltaT) {
    charts.deltaT.destroy();
  }
  
  const tempRange = [];
  const humidityRange = [0, 20, 40, 60, 80, 100];
  
  for (let t = 10; t <= 40; t += 2) {
    tempRange.push(t);
  }
  
  const datasets = [];
  
  const idealData = [];
  tempRange.forEach(temp => {
    humidityRange.forEach(humidity => {
      const deltaT = calculateDeltaT(temp, humidity);
      if (deltaT >= 2 && deltaT <= 8) {
        idealData.push({ x: temp, y: humidity });
      }
    });
  });
  
  const warningData = [];
  tempRange.forEach(temp => {
    humidityRange.forEach(humidity => {
      const deltaT = calculateDeltaT(temp, humidity);
      if ((deltaT >= 1 && deltaT < 2) || (deltaT > 8 && deltaT <= 10)) {
        warningData.push({ x: temp, y: humidity });
      }
    });
  });
  
  const dangerData = [];
  tempRange.forEach(temp => {
    humidityRange.forEach(humidity => {
      const deltaT = calculateDeltaT(temp, humidity);
      if (deltaT < 1 || deltaT > 10) {
        dangerData.push({ x: temp, y: humidity });
      }
    });
  });
  
  charts.deltaT = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'PERIGO (< 1°C ou > 10°C)',
          data: dangerData,
          backgroundColor: 'rgba(239, 68, 68, 0.3)',
          borderColor: 'rgba(239, 68, 68, 0.6)',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'ATENÇÃO (1-2°C ou 8-10°C)',
          data: warningData,
          backgroundColor: 'rgba(251, 191, 36, 0.3)',
          borderColor: 'rgba(251, 191, 36, 0.6)',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'IDEAL (2-8°C)',
          data: idealData,
          backgroundColor: 'rgba(34, 197, 94, 0.3)',
          borderColor: 'rgba(34, 197, 94, 0.6)',
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: 'Condição Atual',
          data: [{ x: currentTemp, y: currentHumidity }],
          backgroundColor: '#000',
          borderColor: '#fff',
          borderWidth: 3,
          pointRadius: 12,
          pointStyle: 'crossRot',
          pointHoverRadius: 15
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        intersect: true
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: '#fff',
            font: { size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        title: {
          display: true,
          text: `Delta T Atual: ${currentDeltaT.toFixed(1)}°C`,
          color: '#fff',
          font: { size: 16, weight: 'bold' },
          padding: 20
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(96, 165, 250, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              if (context[0].datasetIndex === 3) {
                return '📍 SUA ESTAÇÃO AGORA';
              }
              return 'Condições do ponto';
            },
            label: function(context) {
              const temp = context.parsed.x;
              const humidity = context.parsed.y;
              const deltaT = calculateDeltaT(temp, humidity);
              
              return [
                `Temperatura: ${temp}°C`,
                `Umidade: ${humidity}%`,
                `Delta T: ${deltaT.toFixed(1)}°C`,
                '',
                context.dataset.label
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Temperatura (°C)',
            color: '#fff',
            font: { size: 14, weight: 'bold' }
          },
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          min: 10,
          max: 40
        },
        y: {
          title: {
            display: true,
            text: 'Umidade Relativa (%)',
            color: '#fff',
            font: { size: 14, weight: 'bold' }
          },
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          min: 0,
          max: 100
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

function createGauge(canvasId, value, min, max, label, color) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }
  
  charts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [value - min, max - value],
        backgroundColor: [color, 'rgba(255, 255, 255, 0.1)'],
        borderWidth: 0,
        circumference: 270,
        rotation: 225
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

function updateGauges() {
  if (!weatherData.length) return;
  
  const latest = weatherData[0];
  
  createGauge('tempGauge', latest.Temperatura, 0, 50, 'Temperatura', '#ef4444');
  document.getElementById('tempGaugeValue').textContent = `${latest.Temperatura.toFixed(1)}°C`;
  
  createGauge('humidityGauge', latest.Umidade, 0, 100, 'Umidade', '#60a5fa');
  document.getElementById('humidityGaugeValue').textContent = `${latest.Umidade.toFixed(1)}%`;
  
  createGauge('pressureGauge', latest.Pressao, 950, 1050, 'Pressão', '#a855f7');
  document.getElementById('pressureGaugeValue').textContent = `${latest.Pressao.toFixed(1)} hPa`;
  
  createGauge('windGauge', latest.VelocidadeMedia, 0, 50, 'Vento', '#22c55e');
  document.getElementById('windGaugeValue').textContent = `${latest.VelocidadeMedia.toFixed(1)} km/h`;
}

function updateWindRose() {
  if (!weatherData.length) return;
  
  const latest = weatherData[0];
  const degrees = latest.DirecaoVento;
  const speed = latest.VelocidadeMedia;
  
  const arrow = document.getElementById('windArrow');
  if (arrow) {
    arrow.style.transform = `rotate(${degrees}deg)`;
  }
  
  const directions = [
    'N',    // 0° / 360°
    'NNE',  // 22.5°
    'NE',   // 45°
    'ENE',  // 67.5°
    'E',    // 90°
    'ESE',  // 112.5°
    'SE',   // 135°
    'SSE',  // 157.5°
    'S',    // 180°
    'SSO',  // 202.5°
    'SO',   // 225°
    'OSO',  // 247.5°
    'O',    // 270°
    'ONO',  // 292.5°
    'NO',   // 315°
    'NNO'
  ];
  
  const index = Math.round(degrees / 22.5) % 16;
  
  document.getElementById('windDirectionText').textContent = directions[index];
  document.getElementById('windSpeedText').textContent = `${speed.toFixed(1)} km/h`;
  document.getElementById('windDegreesText').textContent = `${degrees}°`;
}

function renderTempHumidityChart() {
  const ctx = document.getElementById('tempHumidityChart');
  if (!ctx) return;
  
  if (charts.tempHumidity) {
    charts.tempHumidity.destroy();
  }
  
  const labels = weatherData.slice().reverse().map((d, i) => {
    const date = new Date(parseInt(d.ts));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });
  
  const tempData = weatherData.slice().reverse().map(d => d.Temperatura);
  const humidityData = weatherData.slice().reverse().map(d => d.Umidade);
  
  charts.tempHumidity = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: tempData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          yAxisID: 'y',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#ef4444',
          pointHoverBorderWidth: 3
        },
        {
          label: 'Umidade (%)',
          data: humidityData,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          yAxisID: 'y1',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#60a5fa',
          pointHoverBorderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { 
            color: '#fff', 
            font: { size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(96, 165, 250, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return `Horário: ${context[0].label}`;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(1);
              if (context.datasetIndex === 0) {
                label += '°C';
              } else {
                label += '%';
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff', maxRotation: 45 },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Temperatura (°C)', color: '#fff' },
          ticks: { color: '#ef4444' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: { display: true, text: 'Umidade (%)', color: '#fff' },
          ticks: { color: '#60a5fa' },
          grid: { display: false }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

function renderDewPointChart() {
  const ctx = document.getElementById('dewPointChart');
  if (!ctx) return;
  
  if (charts.dewPoint) {
    charts.dewPoint.destroy();
  }
  
  const labels = weatherData.slice().reverse().map((d, i) => {
    const date = new Date(parseInt(d.ts));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });
  
  const tempData = weatherData.slice().reverse().map(d => d.Temperatura);
  const dewData = weatherData.slice().reverse().map(d => d.pontoOrvalho);
  
  charts.dewPoint = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: tempData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#ef4444',
          pointHoverBorderWidth: 3
        },
        {
          label: 'Ponto de Orvalho (°C)',
          data: dewData,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#60a5fa',
          pointHoverBorderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { 
            color: '#fff', 
            font: { size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(96, 165, 250, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return `Horário: ${context[0].label}`;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(1) + '°C';
              return label;
            },
            afterBody: function(context) {
              if (context.length === 2) {
                const diff = Math.abs(context[0].parsed.y - context[1].parsed.y);
                return [``, `Diferença: ${diff.toFixed(1)}°C`];
              }
              return [];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff', maxRotation: 45 },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          title: { display: true, text: 'Temperatura (°C)', color: '#fff' },
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

function renderPrecipitationChart() {
  const ctx = document.getElementById('precipitationChart');
  if (!ctx) return;
  
  if (charts.precipitation) {
    charts.precipitation.destroy();
  }
  
  const labels = weatherData.slice().reverse().map((d, i) => {
    const date = new Date(parseInt(d.ts));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });
  
  const precipHourData = weatherData.slice().reverse().map(d => d.PluviometroH);
  const precipDayData = weatherData.slice().reverse().map(d => d.PluviometroD);
  
  if (weatherData.length) {
    document.getElementById('precipHour').textContent = `${weatherData[0].PluviometroH.toFixed(1)} mm`;
    document.getElementById('precipDay').textContent = `${weatherData[0].PluviometroD.toFixed(1)} mm`;
    
    const uniqueDays = [...new Set(weatherData.map(d => new Date(parseInt(d.ts)).toDateString()))];
    const monthTotal = weatherData[0].PluviometroD;
    document.getElementById('precipMonth').textContent = `${monthTotal.toFixed(1)} mm`;
  }
  
  charts.precipitation = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Precipitação Horária (mm)',
          data: precipHourData,
          backgroundColor: 'rgba(96, 165, 250, 0.6)',
          borderColor: '#60a5fa',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(96, 165, 250, 0.9)',
          hoverBorderColor: '#fff',
          hoverBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { 
            color: '#fff', 
            font: { size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(96, 165, 250, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return `Horário: ${context[0].label}`;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(2) + ' mm';
              
              if (context.parsed.y === 0) {
                label += ' (Sem chuva)';
              } else if (context.parsed.y < 2.5) {
                label += ' (Chuva leve)';
              } else if (context.parsed.y < 10) {
                label += ' (Chuva moderada)';
              } else {
                label += ' (Chuva forte)';
              }
              
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff', maxRotation: 45 },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          title: { display: true, text: 'Precipitação (mm)', color: '#fff' },
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          beginAtZero: true
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

function renderPressureChart() {
  const ctx = document.getElementById('pressureChart');
  if (!ctx) return;
  
  if (charts.pressure) {
    charts.pressure.destroy();
  }
  
  const labels = weatherData.slice().reverse().map((d, i) => {
    const date = new Date(parseInt(d.ts));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });
  
  const pressureData = weatherData.slice().reverse().map(d => d.Pressao);
  
  charts.pressure = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Pressão Atmosférica (hPa)',
        data: pressureData,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 8,
        pointBackgroundColor: '#a855f7',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#a855f7',
        pointHoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { 
            color: '#fff', 
            font: { size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(168, 85, 247, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return `Horário: ${context[0].label}`;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(1) + ' hPa';
              
              // Adicionar interpretação
              const pressure = context.parsed.y;
              if (pressure < 1000) {
                label += ' (Baixa - Tempo instável)';
              } else if (pressure > 1020) {
                label += ' (Alta - Tempo estável)';
              } else {
                label += ' (Normal)';
              }
              
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff', maxRotation: 45 },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          title: { display: true, text: 'Pressão (hPa)', color: '#fff' },
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

function renderWindSpeedChart() {
  const ctx = document.getElementById('windSpeedChart');
  if (!ctx) return;
  
  if (charts.windSpeed) {
    charts.windSpeed.destroy();
  }
  
  const labels = weatherData.slice().reverse().map((d, i) => {
    const date = new Date(parseInt(d.ts));
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  });
  
  const windAvgData = weatherData.slice().reverse().map(d => d.VelocidadeMedia);
  const windMaxData = weatherData.slice().reverse().map(d => d.VelocidadeMax);
  
  charts.windSpeed = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Velocidade Média (km/h)',
          data: windAvgData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#22c55e',
          pointHoverBorderWidth: 3
        },
        {
          label: 'Velocidade Máxima (km/h)',
          data: windMaxData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#ef4444',
          pointHoverBorderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: { 
            color: '#fff', 
            font: { size: 12 },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(34, 197, 94, 0.5)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              return `Horário: ${context[0].label}`;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              label += context.parsed.y.toFixed(1) + ' km/h';
              
              return label;
            },
            afterBody: function(context) {
              if (context.length === 2) {
                const avgSpeed = context[0].parsed.y;
                let condition = '';
                
                if (avgSpeed < 3) {
                  condition = '⚠️ Vento fraco - Risco de inversão térmica';
                } else if (avgSpeed >= 3 && avgSpeed <= 12) {
                  condition = '✅ Vento ideal para pulverização';
                } else {
                  condition = '❌ Vento forte - Risco de deriva';
                }
                
                return [``, condition];
              }
              return [];
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff', maxRotation: 45 },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: {
          title: { display: true, text: 'Velocidade (km/h)', color: '#fff' },
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
          beginAtZero: true
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart'
      }
    }
  });
}

function updateAllVisualizations() {
  updateDeltaT();
  updateGauges();
  updateWindRose();
  renderTempHumidityChart();
  renderDewPointChart();
  renderPrecipitationChart();
  renderPressureChart();
  renderWindSpeedChart();
}

function updateLastUpdateTime() {
  const timeDisplay = document.getElementById('lastUpdate');
  if (timeDisplay) {
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('pt-BR');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchWeatherData();
  setInterval(fetchWeatherData, UPDATE_INTERVAL);
});
