"use client";

import { useWeather } from "@/app/hooks/useWeather";
import MetricCard from "@/app/components/MetricCard";
import { 
  Wind, 
  Droplets, 
  Thermometer, 
  Gauge, 
  CloudRain, 
  Sun, 
  Wifi, 
  Battery, 
} from "lucide-react";
import { format, isValid } from "date-fns"; // Importe isValid para segurança extra
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { current, loading, error } = useWeather();

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Carregando dados da estação...</div>;
  if (error || !current) return <div className="text-rose-500">Erro: {error}</div>;

  const timestamp = Number(current.ts);
  const dateObj = new Date(timestamp);
  
  const formattedDate = isValid(dateObj)
    ? format(dateObj, "d 'de' MMMM, HH:mm", { locale: ptBR }) 
    : "--";

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Painel de Monitoramento</h2>
          <p className="text-white">Última atualização: {formattedDate}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Online
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Principal - Temperatura */}
        <div className="lg:col-span-2 bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1 text-emerald-400">
              <Thermometer size={20} />
              <p className="font-medium text-slate-300">Temperatura Ambiente</p>
            </div>
            <h1 className="text-6xl font-bold tracking-tight">{current.Temperatura.toFixed(1)}°C</h1>
            <p className="mt-2 text-slate-400">Sensação: {current.sensacaoTermica.toFixed(1)}°C</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-8 relative z-10 border-t border-white/10 pt-6">
            {/* Umidade */}
            <div>
              <div className="flex items-center gap-2 mb-1 text-sky-400">
                <Droplets size={16} />
                <p className="text-slate-400 text-sm">Umidade</p>
              </div>
              <p className="text-2xl font-semibold">{current.Umidade.toFixed(0)}%</p>
            </div>

            {/* Ponto de Orvalho */}
            <div>
              <div className="flex items-center gap-2 mb-1 text-amber-400">
                <Thermometer size={16} />
                <p className="text-slate-400 text-sm">Ponto Orvalho</p>
              </div>
              <p className="text-2xl font-semibold">{current.pontoOrvalho.toFixed(1)}°</p>
            </div>

            {/* Pressão */}
            <div>
              <div className="flex items-center gap-2 mb-1 text-violet-400">
                <Gauge size={16} />
                <p className="text-slate-400 text-sm">Pressão</p>
              </div>
              <p className="text-2xl font-semibold">{current.Pressao.toFixed(0)} <span className="text-sm text-slate-400 font-normal">hPa</span></p>
            </div>
          </div>
          
          {/* Decorative Circle */}
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Info Card - Precipitação */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                  <CloudRain size={24} />
                </div>
                Precipitação
            </h3>
            <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                    <span className="text-slate-500 font-medium">Horária</span>
                    <span className="text-3xl font-bold text-slate-800">{current.PluviometroH.toFixed(1)} <span className="text-sm font-normal text-slate-400">mm</span></span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-slate-500 font-medium">Acumulado Dia</span>
                    <span className="text-3xl font-bold text-slate-800">{current.PluviometroD.toFixed(1)} <span className="text-sm font-normal text-slate-400">mm</span></span>
                </div>
            </div>
        </div>
      </div>

      {/* Grid de Detalhes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={Wind} label="Vento Médio" value={current.VelocidadeMedia.toFixed(1)} unit="km/h" color="blue" />
        <MetricCard icon={Wind} label="Rajada Máx" value={current.VelocidadeMax.toFixed(1)} unit="km/h" color="indigo" />
        <MetricCard icon={Sun} label="Radiação" value={current.Solarizacao} unit="W/m²" color="amber" />
        <MetricCard icon={Battery} label="Bateria" value={current.Bateria} unit="%" color={current.Bateria < 20 ? "rose" : "emerald"} />
      </div>

      {/* Status Sistema */}
      <div className="bg-slate-100 rounded-xl p-4 flex flex-wrap gap-6 text-sm text-slate-500 border border-slate-200">
         <span className="flex items-center gap-2"><Wifi size={16} className="text-slate-400"/> Sinal: <strong className="text-slate-700">{current.RSSI} dBm</strong></span>
         <span className="flex items-center gap-2"><Gauge size={16} className="text-slate-400"/> Boot Count: <strong className="text-slate-700">{current.Boot}</strong></span>
         <span className="ml-auto">ID Estação: <strong className="font-mono text-slate-700">{current.MacId}</strong></span>
      </div>
    </div>
  );
}