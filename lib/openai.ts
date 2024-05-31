import OpenAI from "https://deno.land/x/openai@v4.47.1/mod.ts";
import { env } from "./env.ts";

export const client = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});
