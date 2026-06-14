import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { WeatherService } from '@/lib/weather-service';
import { evaluateWeatherSafety } from '@/lib/ai-safety';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: { id: true, latitude: true, longitude: true },
    });

    for (const project of projects) {
      if (!project.latitude || !project.longitude) continue;

      const lat = Number(project.latitude);
      const lon = Number(project.longitude);

      const weather = await WeatherService.getForecast(lat, lon);
      if (!weather) continue;

      const safety = evaluateWeatherSafety({
        temperature: weather.temperature,
        condition: weather.condition,
        isStormWarning: weather.condition.includes('storm'),
      });

      await prisma.weatherHistory.create({
        data: {
          projectId: project.id,
          date: new Date(),
          condition: weather.condition,
          temperature: weather.temperature,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
        },
      });

      if (safety.isDanger) {
        await prisma.weatherAlert.create({
          data: {
            projectId: project.id,
            type: 'SAFETY',
            message: safety.summary,
            severity: safety.alertLevel,
          },
        });
      }
    }

    return NextResponse.json({ success: true, processed: projects.length });
  } catch (error) {
    console.error('Weather polling error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
