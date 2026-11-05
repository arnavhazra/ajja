import { afterEach, describe, expect, it, vi } from "vitest";
import {
  enhanceKind,
  enhancePhoto,
  enhancePrompt,
  ENHANCE_FALLBACK,
  ENHANCE_PRIMARY,
  setEnhanceFetch,
  shouldEnhance,
} from "@/lib/enhance";

const KEY = "test-key";
const B64 = Buffer.from("fake-image").toString("base64");

function okResponse(model: string, cost = 0.014) {
  return new Response(JSON.stringify({ data: [{ b64_json: B64 }], usage: { cost, prompt_tokens: 10 } }), { status: 200 });
}

function stub(handler: (calls: { model: string }[]) => Response | Promise<Response>) {
  const calls: { model: string }[] = [];
  setEnhanceFetch((async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as { model: string };
    calls.push({ model: body.model });
    return handler(calls);
  }) as typeof fetch);
  return calls;
}

afterEach(() => {
  setEnhanceFetch(null);
  vi.restoreAllMocks();
});

describe("shouldEnhance — one generation per photo", () => {
  it("allows a photo with no entry or a failed entry only", () => {
    expect(shouldEnhance({}, "a")).toBe(true);
    expect(shouldEnhance({ a: { status: "failed" } }, "a")).toBe(true);
    expect(shouldEnhance({ a: { status: "pending" } }, "a")).toBe(false);
    expect(shouldEnhance({ a: { status: "done" } }, "a")).toBe(false);
    expect(shouldEnhance(null, "a")).toBe(true);
  });
});

describe("enhancePhoto — model order, retries, fallback", () => {
  it("returns the image, model and usage on first success", async () => {
    const calls = stub(() => okResponse(ENHANCE_PRIMARY));
    const result = await enhancePhoto({ apiKey: KEY, imageUrl: "https://img", kind: "painting", width: 4, height: 5 });
    expect(result.model).toBe(ENHANCE_PRIMARY);
    expect(result.usage?.cost).toBe(0.014);
    expect(Buffer.from(result.bytes).toString()).toBe("fake-image");
    expect(calls).toHaveLength(1);
  });

  it("falls back once when the primary reports model/image-input errors", async () => {
    const calls = stub((c) =>
      c.length === 1
        ? new Response(JSON.stringify({ error: { message: "model does not support image input" } }), { status: 400 })
        : okResponse(ENHANCE_FALLBACK),
    );
    const result = await enhancePhoto({ apiKey: KEY, imageUrl: "https://img", kind: "woodwork" });
    expect(result.model).toBe(ENHANCE_FALLBACK);
    expect(calls.map((c) => c.model)).toEqual([ENHANCE_PRIMARY, ENHANCE_FALLBACK]);
  });

  it("retries unbilled failures (429) up to two retries, then succeeds", async () => {
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void) => { fn(); return 0; }) as typeof setTimeout);
    let n = 0;
    const calls = stub(() => {
      n += 1;
      return n < 3 ? new Response(JSON.stringify({ error: { message: "rate limited" } }), { status: 429 }) : okResponse(ENHANCE_PRIMARY);
    });
    const result = await enhancePhoto({ apiKey: KEY, imageUrl: "https://img", kind: "other" });
    expect(result.model).toBe(ENHANCE_PRIMARY);
    expect(calls).toHaveLength(3);
  });

  it("does not fall back to the second model on non-model errors", async () => {
    vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void) => { fn(); return 0; }) as typeof setTimeout);
    const calls = stub(() => new Response(JSON.stringify({ error: { message: "invalid request" } }), { status: 400 }));
    await expect(enhancePhoto({ apiKey: KEY, imageUrl: "https://img", kind: "other" })).rejects.toThrow(ENHANCE_PRIMARY);
    expect(calls.every((c) => c.model === ENHANCE_PRIMARY)).toBe(true);
  });

  it("throws when generation returns no image (treated as failure, marked failed upstream)", async () => {
    const calls = stub(() => new Response(JSON.stringify({ data: [] }), { status: 200 }));
    await expect(enhancePhoto({ apiKey: KEY, imageUrl: "https://img", kind: "other" })).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });
});

describe("enhancePrompt / enhanceKind", () => {
  it("appends exactly one matching addendum", () => {
    expect(enhancePrompt("painting")).toContain("flat painting or poured artwork");
    expect(enhancePrompt("woodwork")).toContain("handmade woodwork");
    expect(enhancePrompt("ceramic")).toContain("handmade ceramic");
    expect(enhancePrompt("mystery")).toContain("Preserve it exactly");
  });
  it("maps product hints to kinds", () => {
    expect(enhanceKind("Walnut tables", null)).toBe("woodwork");
    expect(enhanceKind(null, { medium: "glazed stoneware" })).toBe("ceramic");
    expect(enhanceKind("Poured paintings", null)).toBe("painting");
    expect(enhanceKind(null, null)).toBe("other");
  });
});
