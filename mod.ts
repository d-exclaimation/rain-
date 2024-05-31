import { router } from "https://deno.land/x/rutt@0.2.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { call } from "./call.ts";
import { json } from "./cors.ts";
import { client } from "./openai.ts";

const DirtyForecast = z.object({
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

type Forecast = z.infer<typeof Forecast>;
const Forecast = z.object({
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

const context = `Your goal is to answer the question "Will it rain today?".

Your answer should only be either "No", "Hmm...probably not", "Maybe", "Hmm...yeah probably", "Yes", "Look outside", with the order being least likely to most likely. You should be more concern giving false negative (less likely) than false positive, and therefore pick the next answer up in the likeliness scale unless it's clear "No"

The user prompts you accept is in JSON following this format 
\`\`\`ts
type Input = {
  temperature: {
    min: number,
    max: number,
  },
  precipitation: {
    sum: number,
    hours: number,
    probability: {
      min: number,
      max: number,
      mean: number
   },
  rain: number,
  showers: number.
}
\`\`\`

with this information on each fields
precipitation probability: Probability in percentages of precipitation with more than 0.1 mm. Probability is based on ensemble weather models with 0.25° (~27 km) resolution
rain: the sum of rain from large scale weather systems in millimeters
showers: the sum of showers from convective precipitation in millimeters
temperature: Air temperature at 2 meters above ground in celcius`;

Deno.serve(
  router({
    "/": async (req) => {
      const dirty = await call("https://api.open-meteo.com/v1/forecast", {
        method: "GET",
        params: {
          latitude: "-43",
          longitude: "172",
          forecast_days: "1",
          timezone: "Pacific/Auckland",
          daily:
            "temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,showers_sum,precipitation_hours,precipitation_probability_max,precipitation_probability_min,precipitation_probability_mean",
        },
        output: DirtyForecast,
      });

      const forecast = Forecast.parse({
        temperature: {
          max: dirty.daily.temperature_2m_max[0],
          min: dirty.daily.temperature_2m_min[0],
        },
        precipitation: {
          sum: dirty.daily.precipitation_sum[0],
          hours: dirty.daily.precipitation_hours[0],
          probability: {
            max: dirty.daily.precipitation_probability_max[0],
            min: dirty.daily.precipitation_probability_min[0],
            mean: dirty.daily.precipitation_probability_mean[0],
          },
        },
        rain: dirty.daily.rain_sum[0],
        showers: dirty.daily.showers_sum[0],
      });

      const { choices } = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: context },
          { role: "user", content: JSON.stringify(forecast) },
        ],
      });

      const result = choices
        .filter(({ message }) => message.role === "assistant")
        .map(({ message }) => message.content)
        .filter((content): content is string => !!content)[0];

      return json(req, { result });
    },
  })
);
