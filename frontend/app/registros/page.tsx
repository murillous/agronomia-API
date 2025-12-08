"use client";

import { useState } from "react";
import { useWeather } from "@/app/hooks/useWeather";
import { downloadCSV, downloadJSON } from "@/app/utils/export";
import { FileJson, FileSpreadsheet } from "lucide-react";
import { format, isValid } from "date-fns";

export default function RecordsPage() {
  const [limit, setLimit] = useState(20);
  const { history, loading, error } = useWeather(limit);

  const handleExport = (type: "csv" | "json") => {
    // Exporta o 'history' original (dados completos)
    const filename = `ciclus-dados-${format(new Date(), "yyyy-MM-dd-HHmm")}`;
    if (type === "csv") downloadCSV(history, filename);
    else downloadJSON(history, filename);
  };

  if (error)
    return (
      <div className="p-8 text-rose-500">
        Erro ao carregar registros: {error}
      </div>
    );

  return (
    <div className="max-w-[95%] mx-auto space-y-6 pb-12">
      {" "}
      {/* Aumentei a largura da página para caber mais dados */}
      {/* Header e Controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Histórico de Registros
          </h1>
          <p className="text-slate-500 text-sm">
            Visualização detalhada de todas as variáveis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-sm text-slate-500">Mostrar:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport("csv")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors"
            >
              <FileSpreadsheet size={16} /> CSV
            </button>
            <button
              onClick={() => handleExport("json")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              <FileJson size={16} /> JSON
            </button>
          </div>
        </div>
      </div>
      {/* Tabela de Dados Completa */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            Carregando registros...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {/* Cabeçalhos Fixos */}
                  <th className="px-4 py-3 font-semibold text-slate-700 border-r border-slate-100">
                    Data / Hora
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Temp (°C)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Umid (%)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Chuva H (mm)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Chuva D (mm)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Pressão (hPa)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Vel. Méd (km/h)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Vel. Máx (km/h)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Dir. Vento (°)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Solar (W/m²)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    RSSI
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Ver. PCB
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Mac ID
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Temp. Int (°C)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    P. Orvalho (°C)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Sens. Térmica (°C)
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">
                    Estação ID
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((row) => {
                  const timestamp = Number(row.ts);
                  const dateObj = new Date(timestamp);
                  const isDateValid = isValid(dateObj);

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Data (Fixo à esquerda visualmente pelo border-r) */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 border-r border-slate-100 bg-white group-hover:bg-slate-50">
                        {isDateValid
                          ? format(dateObj, "dd/MM/yyyy HH:mm:ss")
                          : "--"}
                      </td>

                      {/* Colunas de Dados - Formatadas para 2 casas decimais */}
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {row.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {row.Temperatura?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.Umidade?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {row.PluviometroH?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-blue-800">
                        {row.PluviometroD?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.Pressao?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.VelocidadeMedia?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.VelocidadeMax?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.DirecaoVento}
                      </td>
                      <td className="px-4 py-3 text-amber-600">
                        {row.Solarizacao}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.RSSI}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.VersaoPcb}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.MacId}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.TemperaturaInterna?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.pontoOrvalho?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {row.sensacaoTermica?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.IdEstacao}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 text-xs text-slate-500 flex justify-between items-center">
          <span>{history.length} registros carregados</span>
          <span className="italic">
            Role horizontalmente para ver mais colunas →
          </span>
        </div>
      </div>
    </div>
  );
}
