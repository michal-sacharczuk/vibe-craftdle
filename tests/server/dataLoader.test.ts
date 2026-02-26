/**
 * Tests for server/src/data/dataLoader.ts
 *
 * Validates data loading, filtering, and search functions.
 */
import {
  loadAllData,
  getItems,
  getMobs,
  getRecipes,
  getSounds,
  getClassicEntities,
  searchEntities,
  searchCraftableItems,
} from "../../server/src/data/dataLoader";

beforeAll(() => {
  loadAllData();
});

describe("dataLoader", () => {
  describe("data validation", () => {
    it("loads items with valid textureUrls", () => {
      const items = getItems();
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.textureUrl).toBeTruthy();
        expect(item.textureUrl.trim().length).toBeGreaterThan(0);
      }
    });

    it("loads mobs with valid textureUrls", () => {
      const mobs = getMobs();
      expect(mobs.length).toBeGreaterThan(0);
      for (const mob of mobs) {
        expect(mob.textureUrl).toBeTruthy();
        expect(mob.textureUrl.trim().length).toBeGreaterThan(0);
      }
    });

    it("loads recipes that reference valid items", () => {
      const recipes = getRecipes();
      const itemIds = new Set(getItems().map((i) => i.id));
      expect(recipes.length).toBeGreaterThan(0);
      for (const recipe of recipes) {
        expect(itemIds.has(recipe.itemId)).toBe(true);
      }
    });

    it("loads sounds that reference valid mobs", () => {
      const sounds = getSounds();
      const mobIds = new Set(getMobs().map((m) => m.id));
      expect(sounds.length).toBeGreaterThan(0);
      for (const sound of sounds) {
        expect(sound.soundFile).toBeTruthy();
        expect(mobIds.has(sound.entityId)).toBe(true);
      }
    });
  });

  describe("searchEntities", () => {
    it("returns matching items and mobs", () => {
      const results = searchEntities("diamond", 5);
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(r.name.toLowerCase()).toContain("diamond");
      }
    });

    it("respects the limit parameter", () => {
      const results = searchEntities("a", 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("returns empty for no match", () => {
      const results = searchEntities("xyznonexistent", 10);
      expect(results).toEqual([]);
    });
  });

  describe("searchCraftableItems", () => {
    it("returns only items with crafting recipes", () => {
      const results = searchCraftableItems("sword", 10);
      const recipeItemIds = new Set(getRecipes().map((r) => r.itemId));
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        expect(recipeItemIds.has(r.id)).toBe(true);
      }
    });

    it("does not return mobs", () => {
      const results = searchCraftableItems("creeper", 10);
      expect(results).toEqual([]);
    });

    it("does not return items without recipes", () => {
      // "Trident" is an item but has no crafting recipe
      const results = searchCraftableItems("trident", 10);
      expect(results).toEqual([]);
    });

    it("respects the limit parameter", () => {
      const results = searchCraftableItems("a", 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });
});
