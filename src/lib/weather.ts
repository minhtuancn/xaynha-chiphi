import prisma from "./prisma";

interface WeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

function mapWeatherCondition(main: string): string {
  const lower = main.toLowerCase();
  if (lower.includes("clear")) return "sunny";
  if (lower.includes("cloud")) return "cloudy";
  if (lower.includes("rain") || lower.includes("drizzle")) return "rainy";
  if (lower.includes("thunder")) return "stormy";
  if (lower.includes("wind")) return "windy";
  return "cloudy";
}

export async function fetchWeatherFromAPI(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=vi`
    );
    if (!res.ok) return null;
    const data = await res.json();

    return {
      condition: mapWeatherCondition(data.weather[0].main),
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
    };
  } catch {
    return null;
  }
}

export async function getWeatherForDate(
  projectId: string,
  date: Date
): Promise<WeatherData | null> {
  const cached = await prisma.weatherRecord.findFirst({
    where: {
      projectId,
      date: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    },
  });

  if (cached) {
    return {
      condition: cached.condition,
      temperature: cached.temperature,
      humidity: cached.humidity,
      windSpeed: cached.windSpeed,
    };
  }

  const weather = await fetchWeatherFromAPI(10.8231, 106.6297);
  if (weather) {
    await prisma.weatherRecord.create({
      data: {
        projectId,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        ...weather,
        source: "AUTO",
      },
    });
    return weather;
  }

  return null;
}

export async function saveManualWeather(
  projectId: string,
  date: Date,
  data: WeatherData
): Promise<void> {
  await prisma.weatherRecord.upsert({
    where: {
      projectId_date: {
        projectId,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      },
    },
    update: {
      ...data,
      source: "MANUAL",
    },
    create: {
      projectId,
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      ...data,
      source: "MANUAL",
    },
  });
}
