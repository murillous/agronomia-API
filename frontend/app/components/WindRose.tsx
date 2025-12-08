"use client";

import React from "react";

interface Props {
  degrees: number;
  speed: number;
}

export default function WindRose({ degrees, speed }: Props) {
  const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  const index = Math.round((degrees % 360) / 45) % 8;
  const cardinal = directions[index];

  return (
    // py-4 em vez de py-6 para ocupar menos espaço vertical
    <div className="flex flex-col items-center justify-center py-4">
      {/* Container da Bússola - Tamanho reduzido e responsivo */}
      {/* w-40 h-40 (mobile) -> md:w-48 md:h-48 (desktop) */}
      {/* border-4 em vez de border-8 */}
      <div className="relative w-40 h-40 md:w-48 md:h-48 border-4 border-slate-200 rounded-full flex items-center justify-center bg-white shadow-lg">
        {/* Círculo interno decorativo */}
        <div className="absolute inset-1 rounded-full border border-slate-100 bg-slate-50/50"></div>

        {/* Marcadores Cardeais (Principais) - Fontes reduzidas */}
        <span className="absolute top-1 font-bold text-slate-700 text-sm md:text-base">
          N
        </span>
        <span className="absolute bottom-1 font-bold text-slate-700 text-sm md:text-base">
          S
        </span>
        <span className="absolute left-2 font-bold text-slate-700 text-sm md:text-base">
          O
        </span>
        <span className="absolute right-2 font-bold text-slate-700 text-sm md:text-base">
          L
        </span>

        {/* Marcadores Colaterais (Menores) - Fontes reduzidas */}
        <span className="absolute top-[14%] right-[14%] text-[10px] md:text-xs font-semibold text-slate-400">
          NE
        </span>
        <span className="absolute bottom-[14%] right-[14%] text-[10px] md:text-xs font-semibold text-slate-400">
          SE
        </span>
        <span className="absolute bottom-[14%] left-[14%] text-[10px] md:text-xs font-semibold text-slate-400">
          SO
        </span>
        <span className="absolute top-[14%] left-[14%] text-[10px] md:text-xs font-semibold text-slate-400">
          NO
        </span>

        {/* Ticks (Traços de graus) - Levemente menores */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((rot) => (
          <div
            key={rot}
            className="absolute w-full h-full flex justify-center p-1"
            style={{ transform: `rotate(${rot}deg)` }}
          >
            <div className="w-0.5 h-2 bg-slate-300"></div>
          </div>
        ))}

        {/* Container Rotativo da Agulha */}
        <div
          className="absolute w-full h-full flex justify-center items-center transition-transform duration-700 ease-out will-change-transform z-10"
          style={{ transform: `rotate(${degrees}deg)` }}
        >
          {/* Agulha SVG responsiva: h-[75%] faz ela ocupar 75% do container */}
          <svg viewBox="0 0 40 180" className="h-[75%] w-auto drop-shadow-sm">
            {/* Parte Norte (Vermelha) */}
            <polygon points="20,0 35,90 5,90" fill="#ef4444" />
            {/* Parte Sul (Cinza Escura) */}
            <polygon points="20,180 35,90 5,90" fill="#475569" />
            {/* Linha central */}
            <line
              x1="20"
              y1="0"
              x2="20"
              y2="180"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* Pino Central (Eixo) - Reduzido */}
        <div className="absolute w-3 h-3 bg-white border-2 border-slate-300 rounded-full shadow-sm z-20"></div>
      </div>

      {/* Painel de Informações - Margem superior reduzida */}
      <div className="mt-4 text-center space-y-1">
        <div className="inline-flex items-center px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
          <span className="text-lg font-black text-slate-800 mr-2">
            {cardinal}
          </span>
          <span className="text-sm text-slate-500 font-mono">{degrees}°</span>
        </div>
        <div className="text-xs text-slate-400 pt-2 font-medium uppercase tracking-wider">
          Velocidade do Vento
        </div>
        <div className="text-2xl font-bold text-slate-800">
          {speed.toFixed(1)}{" "}
          <span className="text-sm font-normal text-slate-500">km/h</span>
        </div>
      </div>
    </div>
  );
}
