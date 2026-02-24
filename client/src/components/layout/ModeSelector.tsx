import React from "react";
import { Link } from "react-router-dom";
import { GameMode } from "../../types";

const MODES: {
  mode: GameMode;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    mode: "classic",
    title: "Classic",
    description: "Guess the item, block, or mob from attribute feedback",
    icon: "⚔️",
  },
  {
    mode: "crafting",
    title: "Crafting Grid",
    description: "Identify the item from its crafting recipe",
    icon: "🔨",
  },
  {
    mode: "texture",
    title: "Texture Close-up",
    description: "Recognize the block or item from a zoomed-in texture",
    icon: "🔍",
  },
  {
    mode: "sound",
    title: "Sound",
    description: "Identify the mob, block, or item from its sound",
    icon: "🔊",
  },
];

export default function ModeSelector() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto py-8 px-4">
      {MODES.map(({ mode, title, description, icon }) => (
        <Link
          key={mode}
          to={`/${mode}`}
          className="mc-card hover:border-mc-gold transition-colors group flex flex-col items-center gap-3 py-6"
        >
          <span className="text-3xl">{icon}</span>
          <h3 className="font-minecraft text-sm text-mc-gold group-hover:text-mc-green transition-colors">
            {title}
          </h3>
          <p className="text-mc-gray text-xs text-center">{description}</p>
        </Link>
      ))}
    </div>
  );
}
