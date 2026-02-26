import { getRecipes, getIngredientIcons, getItems } from "../data/dataLoader";
import {
  createSession,
  getSession,
  getGuessesRemaining,
} from "./sessionService";
import {
  CraftingRecipe,
  CraftingSession,
  CraftingStartResponse,
  CraftingGuessResponse,
  AnswerResponse,
} from "../types";

function getRandomRecipe(): CraftingRecipe {
  const recipes = getRecipes();
  return recipes[Math.floor(Math.random() * recipes.length)];
}

function findRecipeById(itemId: string): CraftingRecipe | undefined {
  return getRecipes().find((r) => r.itemId === itemId);
}

function findRecipeByName(name: string): CraftingRecipe | undefined {
  return getRecipes().find((r) => r.name.toLowerCase() === name.toLowerCase());
}

function buildVisibleGrid(
  recipe: CraftingRecipe,
  revealedSlots: number[],
): (string | null)[][] {
  const grid: (string | null)[][] = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];

  for (const slotIndex of revealedSlots) {
    const row = Math.floor(slotIndex / 3);
    const col = slotIndex % 3;
    grid[row][col] = recipe.grid[row][col]; // could be an ingredient or null (empty)
  }

  return grid;
}

function getNextSlotToReveal(
  recipe: CraftingRecipe,
  revealedSlots: number[],
): number | null {
  // Prefer revealing slots that have ingredients first
  const allSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const hidden = allSlots.filter((s) => !revealedSlots.includes(s));

  if (hidden.length === 0) return null;

  // Prioritize slots with ingredients
  const withIngredients = hidden.filter((s) => {
    const row = Math.floor(s / 3);
    const col = s % 3;
    return recipe.grid[row][col] !== null;
  });

  const pool = withIngredients.length > 0 ? withIngredients : hidden;
  return pool[Math.floor(Math.random() * pool.length)];
}

function collectVisibleIcons(
  grid: (string | null)[][],
): Record<string, string> {
  const icons = getIngredientIcons();
  const result: Record<string, string> = {};
  for (const row of grid) {
    for (const cell of row) {
      if (cell && !result[cell] && icons[cell]) {
        result[cell] = icons[cell];
      }
    }
  }
  return result;
}

export function startCraftingGame(
  guessLimit: number | null,
): CraftingStartResponse {
  const recipe = getRandomRecipe();
  const sessionId = createSession("crafting", recipe.itemId, guessLimit, {
    revealedSlots: [],
  } as Partial<CraftingSession>);

  const grid = buildVisibleGrid(recipe, []);

  return {
    sessionId,
    guessLimit,
    guessesRemaining: guessLimit,
    grid,
    revealedSlots: [],
    ingredientIcons: collectVisibleIcons(grid),
  };
}

export function guessCrafting(
  sessionId: string,
  guessName: string,
): CraftingGuessResponse | { error: string } {
  const session = getSession(sessionId) as CraftingSession | undefined;
  if (!session) return { error: "Session not found" };
  if (session.solved) return { error: "Game already completed" };

  const remaining = getGuessesRemaining(session);
  if (remaining !== null && remaining <= 0)
    return { error: "No guesses remaining" };

  const recipe = findRecipeById(session.targetId);
  if (!recipe) return { error: "Recipe not found" };

  const guessRecipe = findRecipeByName(guessName);
  session.guesses.push(guessName);

  const correct = guessRecipe?.itemId === recipe.itemId;
  if (correct) {
    session.solved = true;
    // Reveal all slots
    session.revealedSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  } else {
    // Reveal one more slot
    const nextSlot = getNextSlotToReveal(recipe, session.revealedSlots || []);
    if (nextSlot !== null) {
      if (!session.revealedSlots) session.revealedSlots = [];
      session.revealedSlots.push(nextSlot);
    }
  }

  return {
    correct,
    guessesRemaining: getGuessesRemaining(session),
    grid: buildVisibleGrid(recipe, session.revealedSlots || []),
    revealedSlots: session.revealedSlots || [],
    ingredientIcons: collectVisibleIcons(
      buildVisibleGrid(recipe, session.revealedSlots || []),
    ),
  };
}

export function getCraftingAnswer(
  sessionId: string,
): AnswerResponse | { error: string } {
  const session = getSession(sessionId);
  if (!session) return { error: "Session not found" };

  const recipe = findRecipeById(session.targetId);
  if (!recipe) return { error: "Recipe not found" };

  session.solved = true;

  const item = getItems().find((i) => i.id === recipe.itemId);

  return {
    id: recipe.itemId,
    name: recipe.name,
    textureUrl: item?.textureUrl ?? `/textures/${recipe.itemId}.png`,
    wikiUrl: item?.wikiUrl ?? `https://minecraft.wiki/w/${recipe.name.replace(/ /g, "_")}`,
  };
}
