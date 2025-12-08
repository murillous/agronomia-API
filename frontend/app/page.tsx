import {
  Server,
  Activity,
  Clock,
  Shield,
  Database,
  Terminal,
} from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-medium mb-2">
            <Server size={20} />
            <span>Developer Portal</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            API Meteorológica Ciclus
          </h1>
          <p className="text-slate-500 max-w-xl">
            Acesse dados climáticos em tempo real, históricos e métricas
            calculadas diretamente da nossa estação agrícola.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-mono border border-slate-200">
            v1.2.0
          </span>
          <span className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-medium">
            <Activity size={14} /> Sistema Operacional
          </span>
        </div>
      </div>

      {/* Base URL */}
      <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 font-mono text-sm shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-emerald-400" />
          <span>
            Base URL:{" "}
            <span className="text-white">
              https://agronomia-api.vercel.app/api
            </span>
          </span>
        </div>
        <a
          href="https://github.com/murillous/agronomia-API"
          target="_blank"
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-xs uppercase tracking-wider font-semibold"
        >
          Ver no GitHub
        </a>
      </div>

      {/* Endpoints Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Endpoint: Health */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase tracking-wide">
              GET
            </span>
            <Activity
              size={18}
              className="text-slate-400 group-hover:text-emerald-500 transition-colors"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Health Check
          </h3>
          <code className="block bg-slate-50 p-2 rounded text-sm text-slate-600 font-mono mb-4 border border-slate-100">
            /health
          </code>
          <p className="text-slate-500 text-sm">
            Verifica se a API e a estação estão online e respondendo.
          </p>
        </div>

        {/* Endpoint: Latest */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase tracking-wide">
              GET
            </span>
            <Clock
              size={18}
              className="text-slate-400 group-hover:text-emerald-500 transition-colors"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Últimas Leituras
          </h3>
          <code className="block bg-slate-50 p-2 rounded text-sm text-slate-600 font-mono mb-4 border border-slate-100">
            /weather/latest
          </code>
          <p className="text-slate-500 text-sm">
            Retorna os dados mais recentes coletados pelos sensores.
          </p>
        </div>

        {/* Endpoint: Period */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-200 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold uppercase tracking-wide">
              GET
            </span>
            <Database
              size={18}
              className="text-slate-400 group-hover:text-emerald-500 transition-colors"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Histórico por Período
          </h3>
          <code className="block bg-slate-50 p-2 rounded text-sm text-slate-600 font-mono mb-4 border border-slate-100">
            /weather/period?start=...
          </code>
          <p className="text-slate-500 text-sm">
            Filtra registros baseados em timestamp inicial e final.
          </p>
        </div>

        {/* Endpoint: Webhook */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group">
          <div className="flex items-center justify-between mb-4">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase tracking-wide">
              POST
            </span>
            <Shield
              size={18}
              className="text-slate-400 group-hover:text-blue-500 transition-colors"
            />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Webhook (Protegido)
          </h3>
          <code className="block bg-slate-50 p-2 rounded text-sm text-slate-600 font-mono mb-4 border border-slate-100">
            /webhook/weather
          </code>
          <p className="text-slate-500 text-sm">
            Endpoint para a estação física enviar dados (Requer autenticação).
          </p>
        </div>
      </div>

      {/* Exemplo de Uso */}
      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Exemplo de Consumo (JavaScript)
        </h3>
        <pre className="bg-slate-900 p-4 rounded-xl overflow-x-auto text-sm text-emerald-400 font-mono shadow-inner">
          {`fetch('https://agronomia-api.vercel.app/api/weather/latest')
  .then(response => response.json())
  .then(data => {
    console.log('Temperatura:', data.Temperatura);
    console.log('Umidade:', data.Umidade);
  });`}
        </pre>
      </div>
    </div>
  );
}
