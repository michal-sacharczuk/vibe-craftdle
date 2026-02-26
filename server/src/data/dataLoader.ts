import * as fs from "fs";
import * as path from "path";
import {
  ItemOrBlock,
  Mob,
  Biome,
  CraftingRecipe,
  SoundEntry,
  ClassicEntity,
} from "../types";

const DATA_DIR = path.join(__dirname, "../../data");

function loadJson<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T[];
}

let items: ItemOrBlock[] = [];
let mobs: Mob[] = [];
let biomes: Biome[] = [];
let recipes: CraftingRecipe[] = [];
let sounds: SoundEntry[] = [];
let classicEntities: ClassicEntity[] = [];
let ingredientIcons: Record<string, string> = {};

/**
 * Returns true if textureUrl is present and non-empty.
 */
function hasValidTexture(url: string | undefined): boolean {
  return !!url && url.trim().length > 0;
}

export function loadAllData(): void {
  const rawItems = loadJson<ItemOrBlock>("items.json");
  const rawMobs = loadJson<Mob>("mobs.json");
  biomes = loadJson<Biome>("biomes.json");
  const rawRecipes = loadJson<CraftingRecipe>("recipes.json");
  const rawSounds = loadJson<SoundEntry>("sounds.json");

  // Load ingredient icon mapping
  const iconsPath = path.join(DATA_DIR, "ingredientIcons.json");
  if (fs.existsSync(iconsPath)) {
    ingredientIcons = JSON.parse(fs.readFileSync(iconsPath, "utf-8"));
  }

  // Filter out items/mobs with missing textures
  items = rawItems.filter((i) => hasValidTexture(i.textureUrl));
  mobs = rawMobs.filter((m) => hasValidTexture(m.textureUrl));

  // Keep only sounds whose mob has a valid texture and the sound file is present
  const validMobIds = new Set(mobs.map((m) => m.id));
  sounds = rawSounds.filter((s) => s.soundFile && validMobIds.has(s.entityId));

  // Keep only recipes whose item has a valid texture
  const validItemIds = new Set(items.map((i) => i.id));
  recipes = rawRecipes.filter((r) => validItemIds.has(r.itemId));

  const excludedItems = rawItems.length - items.length;
  const excludedMobs = rawMobs.length - mobs.length;
  const excludedRecipes = rawRecipes.length - recipes.length;
  const excludedSounds = rawSounds.length - sounds.length;
  if (excludedItems || excludedMobs || excludedRecipes || excludedSounds) {
    console.log(
      `[dataLoader] Excluded incomplete data: ${excludedItems} items, ${excludedMobs} mobs, ${excludedRecipes} recipes, ${excludedSounds} sounds`,
    );
  }

  // Build classic entity pool (items + mobs merged)
  classicEntities = [
    ...items.map((item) => ({
      ...item,
      behavior: "N/A" as const,
    })),
    ...mobs.map((mob) => ({
      id: mob.id,
      name: mob.name,
      type: mob.type as ClassicEntity["type"],
      dimension: mob.dimension,
      behavior: mob.behavior,
      stackable: mob.stackable,
      renewable: mob.renewable,
      versionAdded: mob.versionAdded,
      textureUrl: mob.textureUrl,
      wikiUrl: mob.wikiUrl,
    })),
  ];
}

export function getItems(): ItemOrBlock[] {
  return items;
}

export function getMobs(): Mob[] {
  return mobs;
}

export function getBiomes(): Biome[] {
  return biomes;
}

export function getRecipes(): CraftingRecipe[] {
  return recipes;
}

export function getSounds(): SoundEntry[] {
  return sounds;
}

export function getClassicEntities(): ClassicEntity[] {
  return classicEntities;
}

export function getIngredientIcons(): Record<string, string> {
  return ingredientIcons;
}

type SearchHit = { id: string; name: string; textureUrl: string; type: string };

export function searchEntities(query: string, limit = 10): SearchHit[] {
  const q = query.toLowerCase();
  const results: SearchHit[] = [];

  for (const entity of classicEntities) {
    if (entity.name.toLowerCase().includes(q)) {
      results.push({
        id: entity.id,
        name: entity.name,
        textureUrl: entity.textureUrl,
        type: entity.type,
      });
    }
    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Search only items that have a crafting recipe.
 * Used by the crafting game mode dropdown.
 */
export function searchCraftableItems(query: string, limit = 10): SearchHit[] {
  const q = query.toLowerCase();
  const craftableIds = new Set(recipes.map((r) => r.itemId));
  const results: SearchHit[] = [];

  for (const item of items) {
    if (craftableIds.has(item.id) && item.name.toLowerCase().includes(q)) {
      results.push({
        id: item.id,
        name: item.name,
        textureUrl: item.textureUrl,
        type: item.type,
      });
    }
    if (results.length >= limit) break;
  }

  return results;
}
