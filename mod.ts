import { router } from "https://deno.land/x/rutt@0.2.0/mod.ts";
import { today } from "./app/forecast.ts";
import { prediction } from "./app/prediction.ts";
import { json } from "./lib/cors.ts";

Deno.serve(
  router({
    "/": async (req) => {
      const forecast = await today();
      const rain = await prediction(forecast);

      return json(req, { rain });
    },
  })
);
