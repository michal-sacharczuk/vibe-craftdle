import { ClassicEntity, AttributeFeedback } from "../types";

/**
 * Compare a single attribute of the guess against the target.
 */
function compareAttribute(
  guessVal: unknown,
  targetVal: unknown,
): AttributeFeedback {
  // Array comparison (e.g., dimension)
  if (Array.isArray(guessVal) && Array.isArray(targetVal)) {
    const match =
      guessVal.length === targetVal.length &&
      guessVal.every((v) => targetVal.includes(v));
    return { value: guessVal, match };
  }

  return {
    value: guessVal as string | boolean,
    match: guessVal === targetVal,
  };
}

/**
 * Compare a guessed entity against the target entity for Classic mode.
 * Returns feedback for each attribute column.
 */
export function compareClassicEntities(
  guess: ClassicEntity,
  target: ClassicEntity,
) {
  return {
    name: guess.name,
    textureUrl: guess.textureUrl,
    type: compareAttribute(guess.type, target.type),
    dimension: compareAttribute(guess.dimension, target.dimension),
    behavior: compareAttribute(guess.behavior, target.behavior),
    stackable: compareAttribute(guess.stackable, target.stackable),
    renewable: compareAttribute(guess.renewable, target.renewable),
    versionAdded: compareAttribute(guess.versionAdded, target.versionAdded),
  };
}
