"use client";

import { useWeather } from "@/app/hooks/useWeather";
import { calculateDeltaT, getSprayStatus } from "@/app/utils/agronomy";
import DeltaTChart from "@/app/components/charts/DeltaTChart";
import WindRose from "@/app/components/WindRose";
import { Line, Bar } from "react-chartjs-2";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format, isValid } from "date-fns"; // Importação necessária
import clsx from "clsx";

export default function AnalyticsPage() {
  const { current, history, loading } = useWeather(50);

  if (loading || !current)
    return (
      <div className="p-8 text-slate-500 font-medium">
        Carregando análises...
      </div>
    );

  const deltaT = calculateDeltaT(current.Temperatura, current.Umidade);
  const { deltaStatus, deltaMsg, windStatus, windMsg } = getSprayStatus(
    deltaT,
    current.VelocidadeMedia
  );

  const sortedHistory = [...history].reverse();

  // CORREÇÃO AQUI: Tratamento seguro das datas para os labels dos gráficos
  const labels = sortedHistory.map((h) => {
    const timestamp = Number(h.ts);
    const date = new Date(timestamp);
    return isValid(date) ? format(date, "HH:mm") : "--:--";
  });

  const tempHumData = {
    labels,
    datasets: [
      {
        label: "Temperatura (°C)",
        data: sortedHistory.map((h) => h.Temperatura),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        yAxisID: "y",
      },
      {
        label: "Umidade (%)",
        data: sortedHistory.map((h) => h.Umidade),
        borderColor: "#0ea5e9",
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const precipData = {
    labels,
    datasets: [
      {
        label: "Precipitação (mm)",
        data: sortedHistory.map((h) => h.PluviometroH),
        backgroundColor: "#3b82f6",
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-2xl font-bold text-white">
          Análises Agronômicas
        </h1>
        <p className="text-white">
          Ferramentas de tomada de decisão para pulverização e manejo.
        </p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Decisão */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            🌿 Recomendação de Pulverização
          </h2>

          {/* Status Delta T */}
          <div
            className={clsx("p-4 rounded-xl border-l-4", {
              "bg-emerald-50 border-emerald-500": deltaStatus === "ideal",
              "bg-amber-50 border-amber-500": deltaStatus === "warning",
              "bg-rose-50 border-rose-500": deltaStatus === "danger",
            })}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Delta T Atual
                </p>
                <p className="text-3xl font-bold mt-1 text-slate-900">
                  {deltaT.toFixed(1)}°C
                </p>
              </div>
              {deltaStatus === "ideal" ? (
                <CheckCircle className="text-emerald-600" />
              ) : (
                <AlertTriangle
                  className={
                    deltaStatus === "warning"
                      ? "text-amber-600"
                      : "text-rose-600"
                  }
                />
              )}
            </div>
            <p className="mt-2 text-sm font-bold text-slate-800">{deltaMsg}</p>
          </div>

          {/* Status Vento */}
          <div
            className={clsx("p-4 rounded-xl border-l-4", {
              "bg-emerald-50 border-emerald-500": windStatus === "ideal",
              "bg-amber-50 border-amber-500": windStatus === "warning",
              "bg-rose-50 border-rose-500": windStatus === "danger",
            })}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-slate-700">Vento</p>
                <p className="text-3xl font-bold mt-1 text-slate-900">
                  {current.VelocidadeMedia.toFixed(1)}{" "}
                  <span className="text-base font-normal text-slate-600">
                    km/h
                  </span>
                </p>
              </div>
              {windStatus === "ideal" ? (
                <CheckCircle className="text-emerald-600" />
              ) : (
                <XCircle className="text-rose-600" />
              )}
            </div>
            <p className="mt-2 text-sm font-bold text-slate-800">{windMsg}</p>
          </div>

          <div className="text-sm text-slate-600 mt-4 bg-slate-100 p-4 rounded-lg border border-slate-200">
            <strong>Dica:</strong> A faixa segura de Delta T é entre 2°C e 8°C.
            Pulverizar fora dessa faixa reduz a eficiência do defensivo.
          </div>
        </div>

        {/* Gráfico Visual Delta T */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">
            Carta Psicométrica (Delta T)
          </h3>
          <div className="h-80 w-full">
            <DeltaTChart
              currentTemp={current.Temperatura}
              currentHumidity={current.Umidade}
            />
          </div>
        </div>
      </section>

      {/* Gráficos Históricos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            🌡️ Temperatura & Umidade
          </h3>
          <div className="h-64">
            <Line
              data={tempHumData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    position: "left",
                    title: { display: true, text: "Temp (°C)" },
                  },
                  y1: {
                    position: "right",
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: "Umid (%)" },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            🌧️ Precipitação (Últimas horas)
          </h3>
          <div className="h-64">
            <Bar
              data={precipData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </section>

      {/* Vento Detalhado */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-full md:w-1/3">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              🧭 Direção do Vento
            </h3>
            <WindRose
              degrees={current.DirecaoVento}
              speed={current.VelocidadeMedia}
            />
          </div>
          <div className="w-full md:w-2/3 h-64">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Histórico de Rajadas
            </h3>
            <Line
              data={{
                labels,
                datasets: [
                  {
                    label: "Média (km/h)",
                    data: sortedHistory.map((h) => h.VelocidadeMedia),
                    borderColor: "#10b981",
                    tension: 0.3,
                  },
                  {
                    label: "Rajada (km/h)",
                    data: sortedHistory.map((h) => h.VelocidadeMax),
                    borderColor: "#f59e0b",
                    borderDash: [5, 5],
                    tension: 0.3,
                  },
                ],
              }}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
