// ============================================================
// Craftdle — Frontend TypeScript Types
// ============================================================

export interface SearchResult {
  id: string;
  name: string;
  textureUrl: string;
  type: string;
}

export interface AttributeFeedback {
  value: string | string[] | boolean;
  match: boolean;
}

export interface ClassicGuessFeedback {
  name: string;
  textureUrl: string;
  type: AttributeFeedback;
  dimension: AttributeFeedback;
  behavior: AttributeFeedback;
  stackable: AttributeFeedback;
  renewable: AttributeFeedback;
  versionAdded: AttributeFeedback;
}

// Classic mode
export interface ClassicStartResponse {
  sessionId: string;
  guessLimit: number | null;
  guessesRemaining: number | null;
  attributes: string[];
}

export interface ClassicGuessResponse {
  correct: boolean;
  guessesRemaining: number | null;
  feedback: ClassicGuessFeedback;
}

// Crafting mode
export interface CraftingStartResponse {
  sessionId: string;
  guessLimit: number | null;
  guessesRemaining: number | null;
  grid: (string | null)[][];
  revealedSlots: number[];
  ingredientIcons: Record<string, string>;
}

export interface CraftingGuessResponse {
  correct: boolean;
  guessesRemaining: number | null;
  grid: (string | null)[][];
  revealedSlots: number[];
  ingredientIcons: Record<string, string>;
}

// Texture mode
export interface TextureStartResponse {
  sessionId: string;
  guessLimit: number | null;
  guessesRemaining: number | null;
  cropLevel: number;
  imageData: string;
  centerX: number;
  centerY: number;
}

export interface TextureGuessResponse {
  correct: boolean;
  guessesRemaining: number | null;
  cropLevel: number;
  imageData: string;
  centerX: number;
  centerY: number;
}

// Sound mode
export interface SoundStartResponse {
  sessionId: string;
  guessLimit: number | null;
  guessesRemaining: number | null;
  soundUrl: string;
}

export interface SoundGuessResponse {
  correct: boolean;
  guessesRemaining: number | null;
}

// Answer (shared)
export interface AnswerResponse {
  id: string;
  name: string;
  textureUrl: string;
  wikiUrl: string;
}

export type GameMode = "classic" | "crafting" | "texture" | "sound";
