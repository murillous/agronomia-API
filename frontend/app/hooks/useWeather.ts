// src/hooks/useWeather.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiResponse, WeatherData } from "@/app/types/weather";

const API_URL = "https://agronomia-api.vercel.app/api/weather/latest";

export function useWeather(limit = 1) {
  const [data, setData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}?limit=${limit}`);
      if (!res.ok) throw new Error("Falha ao buscar dados");

      const json: ApiResponse = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setError(null);
      }
    } catch (err) {
      setError("Erro ao conectar com a estação");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData(); 

    const interval = setInterval(fetchData, 60000); 

    return () => clearInterval(interval); 
  }, [fetchData]); 
  return {
    current: data[0] || null,
    history: data,
    loading,
    error,
    refetch: fetchData,
  };
}
