import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-mc-dark border-b-2 border-mc-stone px-4 sm:px-6 py-3 sm:py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="font-minecraft text-lg sm:text-xl text-mc-gold hover:text-mc-green transition-colors"
        >
          Craftdle
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden font-minecraft text-mc-gray hover:text-white text-lg"
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Desktop nav */}
        <nav className="hidden sm:flex gap-4">
          <Link
            to="/classic"
            className="font-minecraft text-xs text-mc-gray hover:text-white transition-colors"
          >
            Classic
          </Link>
          <Link
            to="/crafting"
            className="font-minecraft text-xs text-mc-gray hover:text-white transition-colors"
          >
            Crafting
          </Link>
          <Link
            to="/texture"
            className="font-minecraft text-xs text-mc-gray hover:text-white transition-colors"
          >
            Texture
          </Link>
          <Link
            to="/sound"
            className="font-minecraft text-xs text-mc-gray hover:text-white transition-colors"
          >
            Sound
          </Link>
        </nav>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="sm:hidden mt-3 pt-3 border-t border-mc-stone flex flex-col gap-3">
          <Link
            to="/classic"
            onClick={() => setMenuOpen(false)}
            className="font-minecraft text-xs text-mc-gray hover:text-white transition-colors"
          >
            ⚔️ Classic
          </Link>
          <Link
            to="/crafting"
            onClick={() => setMenuOpen(false)}
            className="font-minecraft text-xs text-mc-gray hover:text-white transition-colors"
          >
            🔨 Crafting
          </Link>
          <Link
            to="/texture"
            onClick={() => setMenuOpen(false)}
            className="font-minecraft text-xs text-mc-gray hover:text-white transition-colors"
          >
            🔍 Texture
          </Link>
          <Link
            to="/sound"
            onClick={() => setMenuOpen(false)}
            className="font-minecraft text-xs text-mc-gray hover:text-white transition-colors"
          >
            🔊 Sound
          </Link>
        </nav>
      )}
    </header>
  );
}
