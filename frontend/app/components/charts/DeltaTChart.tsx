"use client";

import { useMemo } from "react";
import { Scatter } from "react-chartjs-2";
import { calculateDeltaT } from "@/app/utils/agronomy";
import { ChartOptions } from "chart.js"; // IMPORTAÇÃO NECESSÁRIA
import "@/app/lib/chart-setup"; 

interface Props {
  currentTemp: number;
  currentHumidity: number;
}

export default function DeltaTChart({ currentTemp, currentHumidity }: Props) {
  // Gera os dados do background apenas uma vez
  const { ideal, warning, danger } = useMemo(() => {
    const idealData = [];
    const warningData = [];
    const dangerData = [];

    for (let t = 10; t <= 40; t += 2) {
      for (let h = 0; h <= 100; h += 10) {
        const dt = calculateDeltaT(t, h);
        const point = { x: t, y: h };
        if (dt >= 2 && dt <= 8) idealData.push(point);
        else if ((dt >= 1 && dt < 2) || (dt > 8 && dt <= 10)) warningData.push(point);
        else dangerData.push(point);
      }
    }
    return { ideal: idealData, warning: warningData, danger: dangerData };
  }, []);

  const currentDelta = calculateDeltaT(currentTemp, currentHumidity);

  const data = {
    datasets: [
      {
        label: "Atual",
        data: [{ x: currentTemp, y: currentHumidity }],
        backgroundColor: "#1e293b", // Slate-800
        borderColor: "#fff",
        borderWidth: 3,
        pointRadius: 10,
        pointStyle: "crossRot",
        order: 0, // Fica por cima
      },
      {
        label: "Ideal (2-8°C)",
        data: ideal,
        backgroundColor: "rgba(16, 185, 129, 0.4)", // Emerald-500
        pointRadius: 6,
        order: 1,
      },
      {
        label: "Atenção",
        data: warning,
        backgroundColor: "rgba(245, 158, 11, 0.4)", // Amber-500
        pointRadius: 6,
        order: 2,
      },
      {
        label: "Perigo",
        data: danger,
        backgroundColor: "rgba(244, 63, 94, 0.4)", // Rose-500
        pointRadius: 6,
        order: 3,
      },
    ],
  };

  // TIPAGEM CORRETA AQUI: ChartOptions<'scatter'>
  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (ctx.datasetIndex === 0) return `Atual: ΔT ${currentDelta.toFixed(1)}°C`;
            return ctx.dataset.label || '';
          },
        },
      },
    },
    scales: {
      x: { 
        title: { display: true, text: "Temperatura (°C)" }, 
        min: 10, 
        max: 40 
      },
      y: { 
        title: { display: true, text: "Umidade (%)" }, 
        min: 0, 
        max: 100 
      },
    },
  };

  return <Scatter data={data} options={options} />;
}