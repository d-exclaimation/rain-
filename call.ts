import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

export type CallOutput<Output extends z.ZodTypeAny | undefined> =
  Output extends z.ZodTypeAny ? z.infer<Output> : unknown;

export type CallOptions<Input, Output extends z.ZodTypeAny | undefined> = {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  params?: Record<string, string>;
  headers?: Record<string, string>;
  input?: Input;
  output?: Output;
};

export const call = async <
  Input = undefined,
  Output extends z.ZodTypeAny | undefined = undefined
>(
  baseUrl: string,
  opts: CallOptions<Input, Output>
): Promise<CallOutput<Output>> => {
  const url = new URL(baseUrl);

  if (opts.params) {
    for (const [key, value] of Object.entries(opts.params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: opts.method,
    headers: opts.headers,
    body: opts.input ? JSON.stringify(opts.input) : undefined,
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  const raw = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!opts.output) {
    return raw;
  }

  const maybeOutput = await opts.output.safeParseAsync(raw);
  if (!maybeOutput.success) {
    throw maybeOutput.error;
  }
  return maybeOutput.data;
};
