"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ProgressChartProps {
  stages: { name: string; progress: number; status: string }[];
}

const statusColors: Record<string, string> = {
  COMPLETED: "#10b981",
  IN_PROGRESS: "#3b82f6",
  NOT_STARTED: "#e5e7eb",
  ON_HOLD: "#f59e0b",
};

export function ProgressChart({ stages }: ProgressChartProps) {
  const data = stages.map((s) => ({
    name: s.name,
    progress: s.progress,
    fill: statusColors[s.status] || "#e5e7eb",
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tiến độ theo giai đoạn</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Bar dataKey="progress" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
