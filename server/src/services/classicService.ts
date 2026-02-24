import { getClassicEntities } from "../data/dataLoader";
import {
  createSession,
  getSession,
  getGuessesRemaining,
} from "./sessionService";
import { compareClassicEntities } from "../utils/compare";
import {
  ClassicEntity,
  ClassicStartResponse,
  ClassicGuessResponse,
  AnswerResponse,
} from "../types";

const ATTRIBUTES = [
  "type",
  "dimension",
  "behavior",
  "stackable",
  "renewable",
  "versionAdded",
];

function getRandomEntity(): ClassicEntity {
  const entities = getClassicEntities();
  return entities[Math.floor(Math.random() * entities.length)];
}

function findEntityById(id: string): ClassicEntity | undefined {
  return getClassicEntities().find((e) => e.id === id);
}

function findEntityByName(name: string): ClassicEntity | undefined {
  return getClassicEntities().find(
    (e) => e.name.toLowerCase() === name.toLowerCase(),
  );
}

export function startClassicGame(
  guessLimit: number | null,
): ClassicStartResponse {
  const target = getRandomEntity();
  const sessionId = createSession("classic", target.id, guessLimit);

  return {
    sessionId,
    guessLimit,
    guessesRemaining: guessLimit,
    attributes: ATTRIBUTES,
  };
}

export function guessClassic(
  sessionId: string,
  guessName: string,
): ClassicGuessResponse | { error: string } {
  const session = getSession(sessionId);
  if (!session) return { error: "Session not found" };
  if (session.solved) return { error: "Game already completed" };

  const remaining = getGuessesRemaining(session);
  if (remaining !== null && remaining <= 0)
    return { error: "No guesses remaining" };

  const guessEntity = findEntityByName(guessName);
  if (!guessEntity) return { error: "Unknown entity" };

  const target = findEntityById(session.targetId)!;
  session.guesses.push(guessEntity.id);

  const correct = guessEntity.id === target.id;
  if (correct) session.solved = true;

  const feedback = compareClassicEntities(guessEntity, target);
  const guessesRemaining = getGuessesRemaining(session);

  return {
    correct,
    guessesRemaining,
    feedback,
  };
}

export function getClassicAnswer(
  sessionId: string,
): AnswerResponse | { error: string } {
  const session = getSession(sessionId);
  if (!session) return { error: "Session not found" };

  const target = findEntityById(session.targetId);
  if (!target) return { error: "Target not found" };

  session.solved = true;

  return {
    id: target.id,
    name: target.name,
    textureUrl: target.textureUrl,
    wikiUrl: target.wikiUrl,
  };
}
