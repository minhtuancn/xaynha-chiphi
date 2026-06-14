import prisma from "./prisma";

interface WeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

// Mock/Adapter interfaces
async function fetchFromOpenWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      condition: data.weather[0].main.toLowerCase(),
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
    };
  } catch { return null; }
}

async function fetchFromWeatherAPI(lat: number, lon: number): Promise<WeatherData | null> {
  const apiKey = process.env.WEATHERAPI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      condition: data.current.condition.text.toLowerCase(),
      temperature: Math.round(data.current.temp_c),
      humidity: data.current.humidity,
      windSpeed: Math.round(data.current.wind_kph),
    };
  } catch { return null; }
}

export class WeatherService {
  static async getForecast(lat: number, lon: number): Promise<WeatherData | null> {
    // 1. Try OpenWeather
    const ow = await fetchFromOpenWeather(lat, lon);
    if (ow) return ow;
    
    // 2. Fallback WeatherAPI
    const wa = await fetchFromWeatherAPI(lat, lon);
    if (wa) return wa;

    return null;
  }
}
