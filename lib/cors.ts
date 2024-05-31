const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173"];

export function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  if (
    !origin ||
    ALLOWED_ORIGINS.findIndex((allowed) => allowed.startsWith(origin)) === -1
  ) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, X-Authorization",
  };
}

export function json(req: Request, body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      ...cors(req),
      ...(init?.headers ?? {}),
    },
  });
}
