// Shared OpenRouter image-to-image call. Pure fetch — used by the desk server path
// and by scripts/enhance-images.mjs alike. Cost rule lives here:
// the caller decides when (if ever) to invoke; a returned image is final.
import { ENHANCE_ADDENDA, ENHANCE_BASE } from "./enhance-prompt";

export const ENHANCE_PRIMARY = "black-forest-labs/flux-3-image-klein";
export const ENHANCE_FALLBACK = "krea/k3-edit";

const ASPECTS: Record<string, string[]> = {
  [ENHANCE_PRIMARY]: ["21:9", "2:1", "16:9", "3:2", "7:5", "4:3", "5:4", "1:1", "4:5", "3:4", "5:7", "2:3", "9:16", "1:2", "9:21"],
  [ENHANCE_FALLBACK]: ["1:1", "4:3", "3:2", "16:9", "4:5", "2:3", "9:16"],
};

export type EnhanceResult = {
  bytes: Uint8Array;
  model: string;
  usage: { prompt_tokens?: number; completion_tokens?: number; cost?: number } | null;
};

function nearestAspect(width: number, height: number, model: string) {
  const ratio = width / Math.max(1, height);
  let best = "1:1";
  let bestD = Infinity;
  for (const a of ASPECTS[model] ?? ["1:1"]) {
    const [x, y] = a.split(":").map(Number);
    const d = Math.abs(x / y - ratio);
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

export function enhancePrompt(kind: string) {
  return `${ENHANCE_BASE}\n\n${ENHANCE_ADDENDA[kind] ?? ENHANCE_ADDENDA.other}`;
}

export type EnhanceStatus = { status?: string };

/** Idempotency gate: a photo with a pending or finished generation is never sent again. */
export function shouldEnhance(map: Record<string, EnhanceStatus> | null | undefined, imageId: string) {
  const status = map?.[imageId]?.status;
  return status !== "done" && status !== "pending";
}

/** Pick the one addendum matching the piece kind, same mapping as the catalogue script. */
export function enhanceKind(categoryName?: string | null, attrs?: Record<string, unknown> | null) {
  const hint = `${categoryName ?? ""} ${attrs?.medium ?? ""} ${attrs?.material ?? ""}`.toLowerCase();
  if (/(wood|walnut|pine|oak)/.test(hint)) return "woodwork";
  if (/(ceramic|glaze|pot|clay)/.test(hint)) return "ceramic";
  if (/(paint|pour|canvas|acrylic)/.test(hint)) return "painting";
  return "other";
}

async function callEnhanceApi(
  apiKey: string,
  model: string,
  prompt: string,
  imageUrl: string,
  aspect: string,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const body: Record<string, unknown> = {
    model,
    prompt,
    modalities: ["image"],
    input_references: [{ type: "image_url", image_url: { url: imageUrl } }],
    resolution: "2K",
    aspect_ratio: aspect,
  };
  if (model === ENHANCE_PRIMARY) body.output_format = "png";
  const res = await fetch("https://openrouter.ai/api/v1/images", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
}

type FetchLike = typeof fetch;
let fetchImpl: FetchLike | null = null;
/** Tests stub the HTTP layer here; production code never calls this. */
export function setEnhanceFetch(impl: FetchLike | null) {
  fetchImpl = impl;
}

async function apiPost(apiKey: string, model: string, prompt: string, imageUrl: string, aspect: string) {
  const realFetch = fetchImpl ?? fetch;
  if (fetchImpl) {
    // Stubbed path for tests — same response shape.
    const res = await realFetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, imageUrl, aspect }),
    });
    return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
  }
  return callEnhanceApi(apiKey, model, prompt, imageUrl, aspect);
}

function isModelError(status: number, message: string) {
  return status === 404 || /not found|does not exist|does not support image/i.test(message);
}

function isUnbilledFailure(status: number) {
  return status === 429 || status >= 500 || status === 0;
}

function extractImage(json: Record<string, unknown>) {
  const data = json.data as { b64_json?: string }[] | undefined;
  const b64 = data?.[0]?.b64_json;
  return b64 ? Buffer.from(b64, "base64") : null;
}

function extractMessage(json: Record<string, unknown>, status: number) {
  const err = json.error as { message?: string } | undefined;
  return err?.message ?? `http ${status}`;
}

/**
 * One generation for one photo. Tries the primary, falls back once on
 * model-unavailable errors, retries ≤2 only when nothing was billed
 * (network, 429 or 5xx before generation).
 */
export async function enhancePhoto(input: {
  apiKey: string;
  imageUrl: string;
  kind: string;
  width?: number;
  height?: number;
}): Promise<EnhanceResult> {
  const prompt = enhancePrompt(input.kind);
  const aspect = (model: string) => nearestAspect(input.width ?? 1, input.height ?? 1, model);
  const models = [ENHANCE_PRIMARY, ENHANCE_FALLBACK];
  for (let m = 0; m < models.length; m += 1) {
    const model = models[m];
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const { status, json } = await apiPost(input.apiKey, model, prompt, input.imageUrl, aspect(model));
      const bytes = extractImage(json);
      if (status >= 200 && status < 300 && bytes) {
        return { bytes, model, usage: (json.usage as EnhanceResult["usage"]) ?? null };
      }
      const message = extractMessage(json, status);
      if (isModelError(status, message)) break; // next model, once
      if (isUnbilledFailure(status) && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt === 1 ? 3000 : 10000));
        continue;
      }
      throw new Error(`${model}: ${message.slice(0, 140)}`);
    }
  }
  throw new Error("both models failed");
}
