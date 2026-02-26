import React, { useState } from "react";
import GameLayout from "../common/GameLayout";
import CraftingGrid from "./CraftingGrid";
import {
  startCrafting,
  guessCrafting,
  getCraftingAnswer,
} from "../../services/api";
import { useGame } from "../../hooks/useGame";
import { CraftingStartResponse, CraftingGuessResponse } from "../../types";

export default function CraftingGame() {
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [revealedSlots, setRevealedSlots] = useState<number[]>([]);
  const [ingredientIcons, setIngredientIcons] = useState<
    Record<string, string>
  >({});

  const game = useGame<CraftingStartResponse, CraftingGuessResponse>({
    startApi: startCrafting,
    guessApi: guessCrafting,
    answerApi: getCraftingAnswer,
    onStartResponse: (res) => {
      setGrid(res.grid);
      setRevealedSlots(res.revealedSlots);
      setIngredientIcons(res.ingredientIcons || {});
      return {
        sessionId: res.sessionId,
        guessesRemaining: res.guessesRemaining,
      };
    },
    onGuessResponse: (res) => {
      setGrid(res.grid);
      setRevealedSlots(res.revealedSlots);
      setIngredientIcons((prev) => ({
        ...prev,
        ...(res.ingredientIcons || {}),
      }));
      return { correct: res.correct, guessesRemaining: res.guessesRemaining };
    },
  });

  return (
    <GameLayout
      title="Crafting Grid"
      description="Identify the item from its crafting recipe! One ingredient is revealed after each wrong guess."
      placeholder="Guess the crafted item..."
      game={game}
      searchMode="crafting"
    >
      <CraftingGrid
        grid={grid}
        revealedSlots={revealedSlots}
        ingredientIcons={ingredientIcons}
      />
    </GameLayout>
  );
}
