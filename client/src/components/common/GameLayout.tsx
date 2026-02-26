import React from "react";
import AutocompleteSearch from "./AutocompleteSearch";
import GuessLimitSelector from "./GuessLimitSelector";
import GameOverModal from "./GameOverModal";
import { GameState, GameActions } from "../../hooks/useGame";
import { SearchResult } from "../../types";

interface GameLayoutProps {
  /** Mode title shown on both start screen and in-game header */
  title: string;
  /** Description shown on the start screen */
  description: string;
  /** Autocomplete placeholder text */
  placeholder: string;
  /** Game state from useGame hook */
  game: GameState & GameActions;
  /** Optional game mode for search filtering (e.g. "crafting") */
  searchMode?: string;
  /** The main game content (grid, texture crop, sound player, attribute table, etc.) */
  children: React.ReactNode;
}

/**
 * Shared layout for all game modes.
 *
 * Handles start screen (guess limit + start button), in-game header
 * (guesses remaining + give up), autocomplete input, past guesses,
 * and game over modal.
 */
export default function GameLayout({
  title,
  description,
  placeholder,
  game,
  searchMode,
  children,
}: GameLayoutProps) {
  const {
    sessionId,
    guessLimit,
    guessesRemaining,
    pastGuesses,
    gameOver,
    won,
    answer,
    error,
    setGuessLimit,
    start,
    guess,
    giveUp,
    playAgain,
  } = game;

  // Pre-game start screen
  if (!sessionId) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <h2 className="font-minecraft text-xl text-mc-gold">{title}</h2>
        <p className="text-mc-gray text-sm max-w-md text-center">
          {description}
        </p>
        <GuessLimitSelector value={guessLimit} onChange={setGuessLimit} />
        <button onClick={start} className="mc-btn-primary">
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between w-full px-4">
        <h2 className="font-minecraft text-sm text-mc-gold">{title}</h2>
        <div className="flex gap-4 items-center">
          {guessesRemaining !== null && (
            <span className="font-minecraft text-xs text-mc-gray">
              Left: <span className="text-mc-gold">{guessesRemaining}</span>
            </span>
          )}
          {!gameOver && (
            <button onClick={giveUp} className="mc-btn text-xs py-1 px-3">
              Give Up
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-mc-red text-xs">{error}</p>}

      {/* Mode-specific content */}
      {children}

      {/* Past guesses (for non-classic modes) */}
      {pastGuesses.length > 0 && (
        <div className="text-xs text-mc-gray">
          <span className="font-minecraft">Guesses: </span>
          {pastGuesses.map((g, i) => (
            <span key={i} className="text-mc-red mx-1">
              {g}
            </span>
          ))}
        </div>
      )}

      {/* Guess input */}
      {!gameOver && (
        <AutocompleteSearch
          onSelect={guess}
          placeholder={placeholder}
          mode={searchMode}
        />
      )}

      {/* Game over modal */}
      {gameOver && answer && (
        <GameOverModal answer={answer} won={won} onPlayAgain={playAgain} />
      )}
    </div>
  );
}
