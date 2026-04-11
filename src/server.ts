import express, { Request, Response, NextFunction } from "express";
import type {
  ErrorResponse,
  GenderizeResponse,
  SuccessResponse,
} from "./types";

const app = express();
const PORT = process.env.PORT || 3000;

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.options("*", (_req: Request, res: Response) => {
  res.sendStatus(204);
});

function sendError(res: Response, status: number, message: string): void {
  const body: ErrorResponse = { status: "error", message };
  res.status(status).json(body);
}

async function fetchGender(name: string): Promise<GenderizeResponse> {
  const url = `https://api.genderize.io/?name=${encodeURIComponent(name)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Upstream API returned an error");
  }

  return response.json() as Promise<GenderizeResponse>;
}

app.get("/api/classify", async (req: Request, res: Response): Promise<void> => {
  const { name } = req.query;

  // 400 — missing or empty
  if (name === undefined || name === "") {
    sendError(res, 400, "Missing or empty name parameter");
    return;
  }

  // 422 — not a plain string (e.g. array: ?name[]=john)
  if (typeof name !== "string") {
    sendError(res, 422, "name is not a string");
    return;
  }

  // 400 — blank after trim
  const trimmedName = name.trim();
  if (trimmedName === "") {
    sendError(res, 400, "Missing or empty name parameter");
    return;
  }

  // ── Call Genderize API ───────────────────────────────────────────────────
  let genderizeData: GenderizeResponse;

  try {
    genderizeData = await fetchGender(trimmedName);
  } catch {
    sendError(res, 502, "Failed to reach upstream API");
    return;
  }

  // ── Edge case: null gender or zero count ─────────────────────────────────
  if (genderizeData.gender === null || genderizeData.count === 0) {
    sendError(res, 200, "No prediction available for the provided name");
    return;
  }

  // ── Process ──────────────────────────────────────────────────────────────
  const sample_size = genderizeData.count;
  const probability = genderizeData.probability;

  // Both conditions must pass: probability >= 0.7 AND sample_size >= 100
  const is_confident: boolean = probability >= 0.7 && sample_size >= 100;

  // UTC ISO 8601 — generated fresh on every request (not hardcoded)
  const processed_at: string = new Date().toISOString();

  const body: SuccessResponse = {
    status: "success",
    data: {
      name: genderizeData.name,
      gender: genderizeData.gender,
      probability,
      sample_size,
      is_confident,
      processed_at,
    },
  };

  res.status(200).json(body);
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  sendError(res, 404, "Route not found");
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  sendError(res, 500, "Internal server error");
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
