import React from "react";

interface CraftingGridProps {
  grid: (string | null)[][];
  revealedSlots: number[];
  ingredientIcons?: Record<string, string>;
}

export default function CraftingGrid({
  grid,
  revealedSlots,
  ingredientIcons = {},
}: CraftingGridProps) {
  return (
    <div className="grid grid-cols-3 gap-1 w-48 h-48 sm:w-56 sm:h-56 bg-mc-dark border-2 border-mc-stone p-2">
      {grid.flat().map((cell, index) => {
        const isRevealed = revealedSlots.includes(index);
        const iconUrl = cell ? ingredientIcons[cell] : undefined;

        return (
          <div
            key={index}
            className={`flex items-center justify-center border border-mc-stone ${
              isRevealed
                ? cell
                  ? "bg-mc-wood"
                  : "bg-mc-dark"
                : "bg-mc-obsidian"
            }`}
          >
            {isRevealed ? (
              cell ? (
                iconUrl ? (
                  <img
                    src={iconUrl}
                    alt={cell.replace(/_/g, " ")}
                    title={cell.replace(/_/g, " ")}
                    className="w-full h-full object-contain p-0.5"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <span className="text-center text-[8px] leading-tight break-all font-minecraft text-mc-dark">
                    {cell.replace(/_/g, " ")}
                  </span>
                )
              ) : (
                <span className="text-mc-gray">—</span>
              )
            ) : (
              <span className="text-lg text-mc-gold font-minecraft">?</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
