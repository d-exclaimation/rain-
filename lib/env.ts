import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

export type Env = z.infer<typeof Env>;
export const Env = z.object({
  OPENAI_API_KEY: z.string(),
  FORECAST_API: z.string(),
});

export const env = Env.parse(Deno.env.toObject());
