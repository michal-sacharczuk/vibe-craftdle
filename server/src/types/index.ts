// ============================================================
// Craftdle — Shared TypeScript Types (Server)
// ============================================================

// --------------- Data Model Types ---------------

export interface ItemOrBlock {
  id: string;
  name: string;
  type: EntityType;
  dimension: Dimension[];
  stackable: boolean;
  renewable: boolean;
  versionAdded: string;
  textureUrl: string;
  wikiUrl: string;
}

export interface Mob {
  id: string;
  name: string;
  type: "Mob";
  dimension: Dimension[];
  behavior: MobBehavior;
  stackable: false;
  renewable: boolean;
  versionAdded: string;
  textureUrl: string;
  soundUrl?: string;
  wikiUrl: string;
}

export interface Biome {
  id: string;
  name: string;
  dimension: Dimension[];
  versionAdded: string;
  wikiUrl: string;
}

export interface CraftingRecipe {
  itemId: string;
  name: string;
  grid: (string | null)[][];
  shapeless: boolean;
}

export interface SoundEntry {
  id: string;
  entityId: string;
  name: string;
  soundFile: string;
  category: string;
}

// --------------- Enum-like Types ---------------

export type EntityType =
  | "Block"
  | "Item"
  | "Tool"
  | "Weapon"
  | "Armor"
  | "Food"
  | "Mob";
export type Dimension = "Overworld" | "Nether" | "End";
export type MobBehavior = "Hostile" | "Passive" | "Neutral";

// --------------- Classic Mode ---------------

export interface ClassicEntity {
  id: string;
  name: string;
  type: EntityType;
  dimension: Dimension[];
  behavior: MobBehavior | "N/A";
  stackable: boolean;
  renewable: boolean;
  versionAdded: string;
  textureUrl: string;
  wikiUrl: string;
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

// --------------- Game Session ---------------

export interface GameSession {
  id: string;
  mode: "classic" | "crafting" | "texture" | "sound";
  targetId: string;
  guessLimit: number | null; // null = unlimited
  guesses: string[];
  solved: boolean;
  createdAt: number;
}

export interface CraftingSession extends GameSession {
  mode: "crafting";
  revealedSlots: number[];
}

export interface TextureSession extends GameSession {
  mode: "texture";
  cropLevel: number; // 0 = most zoomed in, increases with wrong guesses
  centerX: number; // 0.0-1.0, crop center position
  centerY: number;
}

// --------------- API Request/Response ---------------

export interface StartGameRequest {
  guessLimit?: number | null;
}

export interface GuessRequest {
  sessionId: string;
  guess: string;
}

export interface StartGameResponse {
  sessionId: string;
  guessLimit: number | null;
  guessesRemaining: number | null;
}

export interface ClassicStartResponse extends StartGameResponse {
  attributes: string[];
}

export interface ClassicGuessResponse {
  correct: boolean;
  guessesRemaining: number | null;
  feedback: ClassicGuessFeedback;
}

export interface CraftingStartResponse extends StartGameResponse {
  grid: (string | null)[][]; // all null initially
  revealedSlots: number[];
  ingredientIcons: Record<string, string>; // ingredient id → icon URL
}

export interface CraftingGuessResponse {
  correct: boolean;
  guessesRemaining: number | null;
  grid: (string | null)[][];
  revealedSlots: number[];
  ingredientIcons: Record<string, string>;
}

export interface TextureStartResponse extends StartGameResponse {
  cropLevel: number;
  imageData: string; // URL of texture image
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

export interface SoundStartResponse extends StartGameResponse {
  soundUrl: string;
}

export interface SoundGuessResponse {
  correct: boolean;
  guessesRemaining: number | null;
}

export interface AnswerResponse {
  id: string;
  name: string;
  textureUrl: string;
  wikiUrl: string;
}

export interface SearchResult {
  id: string;
  name: string;
  textureUrl: string;
  type: string;
}
