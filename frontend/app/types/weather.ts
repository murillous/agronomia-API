// src/types/weather.ts

export interface WeatherData {
  id: string;
  ts: number; // Timestamp
  Temperatura: number;
  Umidade: number;
  Pressao: number;
  pontoOrvalho: number;
  sensacaoTermica: number;
  VelocidadeMedia: number;
  VelocidadeMax: number;
  DirecaoVento: number;
  PluviometroH: number;
  PluviometroD: number;
  Solarizacao: number;
  Bateria: number;
  RSSI: number;
  TemperaturaInterna: number;
  Boot: number;
  VersaoSw: string;
  VersaoPcb: string;
  MacId: string;
  IdEstacao: string;
}

export interface ApiResponse {
  success: boolean;
  data: WeatherData[];
  count: number;
}
