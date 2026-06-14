export const AI_SAFETY_THRESHOLDS = {
  TEMP_MAX: 38,
  TEMP_MIN: 13,
};

export interface WeatherData {
  temperature: number;
  condition: string;
  isStormWarning: boolean;
}

export function evaluateWeatherSafety(data: WeatherData): {
  isDanger: boolean;
  alertLevel: 'NORMAL' | 'WARNING' | 'DANGER';
  summary: string;
} {
  const isDanger = data.temperature >= AI_SAFETY_THRESHOLDS.TEMP_MAX || 
                   data.temperature <= AI_SAFETY_THRESHOLDS.TEMP_MIN ||
                   data.isStormWarning;

  let alertLevel: 'NORMAL' | 'WARNING' | 'DANGER' = 'NORMAL';
  if (isDanger) {
    alertLevel = 'DANGER';
  } else if (data.temperature > 35 || data.temperature < 15) {
    alertLevel = 'WARNING';
  }

  const summary = isDanger 
    ? `CẢNH BÁO: Thời tiết cực đoan (${data.temperature}°C, ${data.condition}). Khuyến nghị nghỉ làm.`
    : `Thời tiết ổn định (${data.temperature}°C).`;

  return { isDanger, alertLevel, summary };
}
