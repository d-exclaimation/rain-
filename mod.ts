import { router } from "https://deno.land/x/rutt@0.2.0/mod.ts";
import { today } from "./app/forecast.ts";
import { prediction } from "./app/prediction.ts";
import { json } from "./lib/cors.ts";
import { kv } from "./lib/kv.ts";

Deno.serve(
  router({
    "/": async (req) => {
      const url = new URL(req.url);

      const latitude = url.searchParams.get("latitude") ?? "-43";
      const longitude = url.searchParams.get("longitude") ?? "172";
      const timezone = url.searchParams.get("timezone") ?? "Pacific/Auckland";
      const timestamp = new Date().toLocaleDateString("en-NZ");

      const key = [
        "rain",
        `${latitude}-${longitude}`,
        timezone.toLowerCase(),
        timestamp,
      ];

      const res = await kv.get<string>(key);

      if (res.value) {
        console.log("getting", key, res.value);
        return json(req, { rain: res.value });
      }

      const forecast = await today({
        latitude,
        longitude,
        timezone,
      });
      const rain = await prediction(forecast);

      await kv.set(key, rain);

      return json(req, { rain });
    },
  })
);
