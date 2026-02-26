/**
 * Tests for client/src/services/api.ts
 *
 * Validates the thin HTTP wrapper: correct URL construction,
 * method / body, and error handling.
 */
import {
  searchItems,
  startClassic,
  guessClassic,
  getClassicAnswer,
  startCrafting,
  guessCrafting,
  getCraftingAnswer,
  startTexture,
  guessTexture,
  getTextureAnswer,
  startSound,
  guessSound,
  getSoundAnswer,
} from "../../client/src/services/api";

// ---------- fetch mock ----------
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

function jsonOk(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response);
}

function jsonErr(status: number, body: { error: string }) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => mockFetch.mockReset());

// ----- search -----
describe("searchItems", () => {
  it("calls /api/items/search with encoded query", async () => {
    mockFetch.mockReturnValue(jsonOk([{ id: "1", name: "Stone" }]));
    const result = await searchItems("sto ne");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/items/search?q=sto%20ne",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual([{ id: "1", name: "Stone" }]);
  });

  it("appends mode parameter when provided", async () => {
    mockFetch.mockReturnValue(jsonOk([{ id: "2", name: "Sword" }]));
    const result = await searchItems("sword", "crafting");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/items/search?q=sword&mode=crafting",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual([{ id: "2", name: "Sword" }]);
  });
});

// ----- classic -----
describe("classic API", () => {
  it("startClassic POSTs with guessLimit", async () => {
    const body = { sessionId: "s1", guessesRemaining: 10 };
    mockFetch.mockReturnValue(jsonOk(body));
    const res = await startClassic(10);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/classic/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ guessLimit: 10 }),
      }),
    );
    expect(res.sessionId).toBe("s1");
  });

  it("guessClassic POSTs sessionId and guess", async () => {
    const body = { correct: false, guessesRemaining: 9 };
    mockFetch.mockReturnValue(jsonOk(body));
    const res = await guessClassic("s1", "Dirt");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/classic/guess",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ sessionId: "s1", guess: "Dirt" }),
      }),
    );
    expect(res.correct).toBe(false);
  });

  it("getClassicAnswer fetches answer by sessionId", async () => {
    const body = { id: "1", name: "Stone", textureUrl: "", wikiUrl: "" };
    mockFetch.mockReturnValue(jsonOk(body));
    const res = await getClassicAnswer("s1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/classic/answer/s1",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.name).toBe("Stone");
  });
});

// ----- crafting -----
describe("crafting API", () => {
  it("startCrafting POSTs", async () => {
    mockFetch.mockReturnValue(jsonOk({ sessionId: "c1" }));
    await startCrafting(null);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/crafting/start",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ guessLimit: null }),
      }),
    );
  });

  it("guessCrafting POSTs", async () => {
    mockFetch.mockReturnValue(jsonOk({ correct: true }));
    await guessCrafting("c1", "Sword");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/crafting/guess",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("getCraftingAnswer fetches", async () => {
    mockFetch.mockReturnValue(jsonOk({ name: "Sword" }));
    await getCraftingAnswer("c1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/crafting/answer/c1",
      expect.anything(),
    );
  });
});

// ----- texture -----
describe("texture API", () => {
  it("startTexture POSTs", async () => {
    mockFetch.mockReturnValue(jsonOk({ sessionId: "t1" }));
    await startTexture(5);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/texture/start",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("guessTexture POSTs", async () => {
    mockFetch.mockReturnValue(jsonOk({ correct: false }));
    await guessTexture("t1", "Grass");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/texture/guess",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("getTextureAnswer fetches", async () => {
    mockFetch.mockReturnValue(jsonOk({ name: "Grass" }));
    await getTextureAnswer("t1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/texture/answer/t1",
      expect.anything(),
    );
  });
});

// ----- sound -----
describe("sound API", () => {
  it("startSound POSTs", async () => {
    mockFetch.mockReturnValue(jsonOk({ sessionId: "snd1" }));
    await startSound(null);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/sound/start",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("guessSound POSTs", async () => {
    mockFetch.mockReturnValue(jsonOk({ correct: false }));
    await guessSound("snd1", "Creeper");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/sound/guess",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("getSoundAnswer fetches", async () => {
    mockFetch.mockReturnValue(jsonOk({ name: "Creeper" }));
    await getSoundAnswer("snd1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/sound/answer/snd1",
      expect.anything(),
    );
  });
});

// ----- error handling -----
describe("error handling", () => {
  it("throws an error with message from JSON body", async () => {
    mockFetch.mockReturnValue(jsonErr(400, { error: "Bad guess" }));
    await expect(guessClassic("s1", "x")).rejects.toThrow("Bad guess");
  });

  it("throws generic message when JSON body has no error field", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response),
    );
    await expect(startClassic(null)).rejects.toThrow("Request failed");
  });

  it("throws generic message when response body is not JSON", async () => {
    mockFetch.mockReturnValue(
      Promise.resolve({
        ok: false,
        json: () => Promise.reject(new Error("parse")),
      } as Response),
    );
    await expect(startClassic(null)).rejects.toThrow("Request failed");
  });
});
