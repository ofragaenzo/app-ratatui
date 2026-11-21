import { validGoalDate } from './personalGoal';

export type Journal = { dates: string[]; points: number; weights: { date: string; kg: number }[] };
export const emptyJournal: Journal = { dates: [], points: 0, weights: [] };

export function readJournal(raw: string | null): Journal | null {
  if (raw === null) return emptyJournal;
  let value: Partial<Journal> | null;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!value || !Array.isArray(value.dates) || !Array.isArray(value.weights) ||
      typeof value.points !== 'number' || !Number.isSafeInteger(value.points) || value.points < 0) return null;
  if (!value.dates.every(date => typeof date === 'string' && validGoalDate(date))) return null;
  if (!value.weights.every(entry => entry && typeof entry.date === 'string' && validGoalDate(entry.date) &&
      Number.isFinite(entry.kg) && entry.kg > 0)) return null;
  return { dates: value.dates, points: value.points, weights: value.weights };
}
