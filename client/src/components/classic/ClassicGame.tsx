import React, { useState } from "react";
import AutocompleteSearch from "../common/AutocompleteSearch";
import GuessLimitSelector from "../common/GuessLimitSelector";
import GameOverModal from "../common/GameOverModal";
import AttributeRow, { ATTRIBUTE_LABELS } from "./AttributeRow";
import {
  startClassic,
  guessClassic,
  getClassicAnswer,
} from "../../services/api";
import {
  ClassicGuessFeedback,
  AnswerResponse,
  SearchResult,
} from "../../types";

export default function ClassicGame() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [guessLimit, setGuessLimit] = useState<number | null>(null);
  const [guessesRemaining, setGuessesRemaining] = useState<number | null>(null);
  const [guesses, setGuesses] = useState<ClassicGuessFeedback[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);
  const [error, setError] = useState("");

  async function handleStart() {
    try {
      const res = await startClassic(guessLimit);
      setSessionId(res.sessionId);
      setGuessesRemaining(res.guessesRemaining);
      setGuesses([]);
      setGameOver(false);
      setWon(false);
      setAnswer(null);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleGuess(item: SearchResult) {
    if (!sessionId || gameOver) return;
    try {
      const res = await guessClassic(sessionId, item.name);
      setGuesses((prev) => [...prev, res.feedback]);
      setGuessesRemaining(res.guessesRemaining);

      if (res.correct) {
        setWon(true);
        setGameOver(true);
        const ans = await getClassicAnswer(sessionId);
        setAnswer(ans);
      } else if (res.guessesRemaining !== null && res.guessesRemaining <= 0) {
        setGameOver(true);
        const ans = await getClassicAnswer(sessionId);
        setAnswer(ans);
      }
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleGiveUp() {
    if (!sessionId) return;
    setGameOver(true);
    const ans = await getClassicAnswer(sessionId);
    setAnswer(ans);
  }

  function handlePlayAgain() {
    setSessionId(null);
    setGuesses([]);
    setGameOver(false);
    setWon(false);
    setAnswer(null);
  }

  // Pre-game: show start screen
  if (!sessionId) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <h2 className="font-minecraft text-xl text-mc-gold">Classic Mode</h2>
        <p className="text-mc-gray text-sm max-w-md text-center">
          Guess the Minecraft item, block, or mob! After each guess you'll see
          which attributes match.
        </p>
        <GuessLimitSelector value={guessLimit} onChange={setGuessLimit} />
        <button onClick={handleStart} className="mc-btn-primary">
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between w-full px-4">
        <h2 className="font-minecraft text-sm text-mc-gold">Classic Mode</h2>
        <div className="flex gap-4 items-center">
          {guessesRemaining !== null && (
            <span className="font-minecraft text-xs text-mc-gray">
              Guesses left:{" "}
              <span className="text-mc-gold">{guessesRemaining}</span>
            </span>
          )}
          {!gameOver && (
            <button onClick={handleGiveUp} className="mc-btn text-xs py-1 px-3">
              Give Up
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-mc-red text-xs">{error}</p>}

      {/* Guess history table */}
      {guesses.length > 0 && (
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-xs text-mc-gray font-minecraft">
                <th className="px-3 py-2 text-left">Name</th>
                {ATTRIBUTE_LABELS.map(({ key, label }) => (
                  <th key={key} className="px-3 py-2">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guesses.map((fb, i) => (
                <AttributeRow key={i} feedback={fb} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guess input */}
      {!gameOver && (
        <AutocompleteSearch
          onSelect={handleGuess}
          placeholder="Search for an item, block, or mob..."
        />
      )}

      {/* Game over modal */}
      {gameOver && answer && (
        <GameOverModal
          answer={answer}
          won={won}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
