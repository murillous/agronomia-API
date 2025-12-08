export function calculateDeltaT(temp: number, humidity: number): number {
  const T = temp;
  const RH = humidity;

  // Fórmula de Magnus-Tetens para pressão de vapor
  const e = (RH / 100) * 6.112 * Math.exp((17.67 * T) / (T + 243.5));
  const Tw = (243.5 * Math.log(e / 6.112)) / (17.67 - Math.log(e / 6.112));

  return T - Tw;
}

export function getSprayStatus(deltaT: number, windSpeed: number) {
  let deltaStatus: "ideal" | "warning" | "danger" = "danger";
  let deltaMsg = "";

  if (deltaT >= 2 && deltaT <= 8) {
    deltaStatus = "ideal";
    deltaMsg = "Ideal para pulverização";
  } else if ((deltaT >= 1 && deltaT < 2) || (deltaT > 8 && deltaT <= 10)) {
    deltaStatus = "warning";
    deltaMsg = deltaT < 2 ? "Risco de escorrimento" : "Atenção à evaporação";
  } else {
    deltaStatus = "danger";
    deltaMsg = deltaT < 1 ? "Delta T muito baixo" : "Evaporação extrema";
  }

  let windStatus: "ideal" | "warning" | "danger" = "danger";
  let windMsg = "";

  if (windSpeed >= 3 && windSpeed <= 12) {
    windStatus = "ideal";
    windMsg = "Vento favorável";
  } else if (windSpeed < 3) {
    windStatus = "warning";
    windMsg = "Risco de inversão térmica";
  } else {
    windStatus = "danger";
    windMsg = "Risco de deriva";
  }

  return { deltaStatus, deltaMsg, windStatus, windMsg };
}
