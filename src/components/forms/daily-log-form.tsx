"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dailyLogSchema, type DailyLogFormData } from "@/schemas/daily-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/forms/date-picker";
import { PhotoUpload } from "@/components/photo-upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface WeatherAutoData {
  temperature: number;
  condition: string;
}

const WEATHER_CONDITIONS = [
  { value: "SUN", label: "Nắng" },
  { value: "RAIN", label: "Mưa" },
  { value: "CLOUDY", label: "Nhiều mây" },
  { value: "STORM", label: "Bão" },
  { value: "OVERCAST", label: "U ám" },
] as const;

interface DailyLogFormProps {
  projects: Project[];
  defaultValues?: Partial<DailyLogFormData>;
  onSubmit: (data: DailyLogFormData, photos?: File[]) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  showPhotoUpload?: boolean;
}

export function DailyLogForm({
  projects,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Lưu",
  showPhotoUpload = true,
}: DailyLogFormProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherSource, setWeatherSource] = useState<"AUTO" | "MANUAL">(
    "AUTO"
  );

  const form = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      projectId: defaultValues?.projectId ?? "",
      date: defaultValues?.date ?? new Date(),
      timeOfDay: defaultValues?.timeOfDay ?? "MORNING",
      weatherCondition: defaultValues?.weatherCondition,
      temperature: defaultValues?.temperature ?? undefined,
      weatherSource: defaultValues?.weatherSource ?? undefined,
      workerCount: defaultValues?.workerCount ?? 0,
      notes: defaultValues?.notes ?? "",
      issues: defaultValues?.issues ?? "",
    },
  });

  const selectedProjectId = form.watch("projectId");

  useEffect(() => {
    if (!selectedProjectId) return;

    const project = projects.find((p) => p.id === selectedProjectId);
    if (!project?.latitude || !project?.longitude) return;

    setWeatherLoading(true);
    fetch(
      `/api/weather?lat=${project.latitude}&lng=${project.longitude}`
    )
      .then((res) => res.json())
      .then((data: WeatherAutoData) => {
        if (data.temperature != null) {
          form.setValue("temperature", data.temperature);
        }
        if (data.condition) {
          const conditionMap: Record<string, string> = {
            sunny: "SUN",
            rainy: "RAIN",
            cloudy: "CLOUDY",
            stormy: "STORM",
            windy: "OVERCAST",
            overcast: "OVERCAST",
          };
          const mapped = conditionMap[data.condition.toLowerCase()] ?? "CLOUDY";
          form.setValue(
            "weatherCondition",
            mapped as "SUN" | "RAIN" | "CLOUDY" | "STORM" | "OVERCAST"
          );
        }
        setWeatherSource("AUTO");
        form.setValue("weatherSource", "AUTO");
      })
      .catch(() => {
        setWeatherSource("MANUAL");
        form.setValue("weatherSource", "MANUAL");
      })
      .finally(() => setWeatherLoading(false));
  }, [selectedProjectId, projects, form]);

  const handleWeatherConditionChange = (
    val: "SUN" | "RAIN" | "CLOUDY" | "STORM" | "OVERCAST"
  ) => {
    form.setValue("weatherCondition", val);
    setWeatherSource("MANUAL");
    form.setValue("weatherSource", "MANUAL");
  };

  const handleSubmit = (data: DailyLogFormData) => {
    onSubmit(data, photos);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dự án *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn dự án" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timeOfDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thời gian</FormLabel>
                <FormControl>
                  <div className="flex gap-4">
                    {(["MORNING", "AFTERNOON"] as const).map((val) => (
                      <label
                        key={val}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          className="accent-primary"
                          checked={field.value === val}
                          onChange={() => field.onChange(val)}
                        />
                        <span>
                          {val === "MORNING" ? "Buổi sáng" : "Buổi chiều"}
                        </span>
                      </label>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="workerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số công nhân</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Thời tiết</h3>
            {weatherLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <Badge
              variant={weatherSource === "AUTO" ? "default" : "secondary"}
            >
              {weatherSource === "AUTO" ? "Tự động" : "Thủ công"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="weatherCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Điều kiện</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-3">
                      {WEATHER_CONDITIONS.map((wc) => (
                        <label
                          key={wc.value}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <input
                            type="radio"
                            className="accent-primary"
                            checked={field.value === wc.value}
                            onChange={() =>
                              handleWeatherConditionChange(wc.value)
                            }
                          />
                          <span className="text-sm">{wc.label}</span>
                        </label>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhiệt độ (°C)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Ghi chú về tiến độ thi công trong ngày"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="issues"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vấn đề phát sinh</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Các vấn đề phát sinh trong ngày"
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showPhotoUpload && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Ảnh</h3>
            <PhotoUpload onPhotosChange={setPhotos} maxPhotos={10} />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang lưu..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
