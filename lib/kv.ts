/// <reference lib="deno.unstable" />

import { env } from "./env.ts";

export const kv = await Deno.openKv(env.DENO_KV_URL);
