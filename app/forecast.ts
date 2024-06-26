import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { call } from "../lib/call.ts";
import { env } from "../lib/env.ts";

export const DirtyForecast = z.object({
  daily: z.object({
    time: z.string().array(),
    temperature_2m_max: z.coerce.number().array(),
    temperature_2m_min: z.coerce.number().array(),
    precipitation_sum: z.coerce.number().array(),
    rain_sum: z.coerce.number().array(),
    showers_sum: z.coerce.number().array(),
    precipitation_hours: z.coerce.number().array(),
    precipitation_probability_max: z.coerce.number().array(),
    precipitation_probability_min: z.coerce.number().array(),
    precipitation_probability_mean: z.coerce.number().array(),
  }),
});

export type Forecast = z.infer<typeof Forecast>;
export const Forecast = z.object({
  temperature: z.object({
    max: z.number(),
    min: z.number(),
  }),
  precipitation: z.object({
    sum: z.number(),
    hours: z.number(),
    probability: z.object({
      max: z.number(),
      min: z.number(),
      mean: z.number(),
    }),
  }),
  rain: z.number(),
  showers: z.number(),
});

export type TodayInput = z.infer<typeof TodayInput>;
export const TodayInput = z.object({
  latitude: z.string(),
  longitude: z.string(),
  timezone: z.string(),
});

export const today = async ({ latitude, longitude, timezone }: TodayInput) => {
  const dirty = await call(env.FORECAST_API, {
    method: "GET",
    params: {
      latitude,
      longitude,
      forecast_days: "2",
      timezone,
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,showers_sum,precipitation_hours,precipitation_probability_max,precipitation_probability_min,precipitation_probability_mean",
    },
    output: DirtyForecast,
  });

  const latest = dirty.daily.time.length - 1;

  const forecast = Forecast.parse({
    temperature: {
      max: dirty.daily.temperature_2m_max[latest],
      min: dirty.daily.temperature_2m_min[latest],
    },
    precipitation: {
      sum: dirty.daily.precipitation_sum[latest],
      hours: dirty.daily.precipitation_hours[latest],
      probability: {
        max: dirty.daily.precipitation_probability_max[latest],
        min: dirty.daily.precipitation_probability_min[latest],
        mean: dirty.daily.precipitation_probability_mean[latest],
      },
    },
    rain: dirty.daily.rain_sum[latest],
    showers: dirty.daily.showers_sum[latest],
  });

  return forecast;
};
