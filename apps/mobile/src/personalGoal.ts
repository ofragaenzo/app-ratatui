import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const objectiveOptions = ['habits', 'fat-loss', 'muscle-gain', 'maintenance', 'wellbeing'] as const;
export const dietaryOptions = ['not-set', 'omnivore', 'vegetarian', 'vegan', 'pescatarian', 'other'] as const;
export const focusOptions = ['vegetables', 'regularity', 'variety', 'protein', 'hydration', 'mindful-eating', 'custom'] as const;
export type Objective = typeof objectiveOptions[number];
export type DietaryPattern = typeof dietaryOptions[number];
export type ConsistencyFocus = typeof focusOptions[number];

export type GoalDraft = {
  objective: Objective; title: string; description: string; startDate: string;
  durationWeeks: string; weeklyFrequency: string;
  currentWeightKg: string; targetWeightKg: string; heightCm: string;
  dietaryPattern: DietaryPattern; preferredFoods: string; dislikedFoods: string;
  allergies: string; restrictions: string; mealsPerDay: string; consistencyFocus: ConsistencyFocus;
  caloriesKcal: string; proteinG: string; carbsG: string; fatG: string; fiberG: string; waterMl: string;
  activityRoutine: string; dailyActivity: string; exerciseDays: string; exerciseDuration: string; exerciseIntensity: string; professionalPlan: boolean; professionalNotes: string;
};

export type PersonalGoal = {
  version: 1; objective: Objective; title: string; description: string; startDate: string;
  durationWeeks: number; weeklyFrequency: number;
  currentWeightKg: number | null; targetWeightKg: number | null; heightCm: number | null;
  dietaryPattern: DietaryPattern; preferredFoods: string; dislikedFoods: string;
  allergies: string; restrictions: string; mealsPerDay: number | null; consistencyFocus: ConsistencyFocus;
  caloriesKcal: number | null; proteinG: number | null; carbsG: number | null;
  fatG: number | null; fiberG: number | null; waterMl: number | null;
  activityRoutine: string; dailyActivity: string; exerciseDays: string; exerciseDuration: string; exerciseIntensity: string; professionalPlan: boolean; professionalNotes: string;
  createdAt: string; updatedAt: string;
};
export type GoalField = keyof GoalDraft;
export type GoalError = 'required' | 'titleLength' | 'textLength' | 'date' | 'duration' | 'frequency' | 'positive' | 'integer' | 'selection';
export type GoalErrors = Partial<Record<GoalField, GoalError>>;
export const PERSONAL_GOAL_KEY = '@prato-a-prato/personal-goal/v1';

const optionalNumbers = ['currentWeightKg', 'targetWeightKg', 'heightCm', 'caloriesKcal', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'waterMl'] as const;
const optionalText = ['description', 'preferredFoods', 'dislikedFoods', 'allergies', 'restrictions', 'activityRoutine', 'dailyActivity', 'exerciseDays', 'exerciseDuration', 'exerciseIntensity', 'professionalNotes'] as const;

function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function createGoalDraft(): GoalDraft {
  return {
    objective: 'habits', title: 'Vegetais no almoço', description: '', startDate: localToday(),
    durationWeeks: '8', weeklyFrequency: '5', currentWeightKg: '', targetWeightKg: '', heightCm: '',
    dietaryPattern: 'not-set', preferredFoods: '', dislikedFoods: '', allergies: '', restrictions: '',
    mealsPerDay: '', consistencyFocus: 'vegetables', caloriesKcal: '', proteinG: '', carbsG: '', fatG: '',
    fiberG: '', waterMl: '', activityRoutine: '', dailyActivity: '', exerciseDays: '', exerciseDuration: '', exerciseIntensity: '', professionalPlan: false, professionalNotes: '',
  };
}

export function goalToDraft(goal: PersonalGoal): GoalDraft {
  const draft = createGoalDraft();
  draft.objective = goal.objective;
  draft.title = goal.title;
  draft.startDate = goal.startDate;
  draft.durationWeeks = String(goal.durationWeeks);
  draft.weeklyFrequency = String(goal.weeklyFrequency);
  draft.dietaryPattern = goal.dietaryPattern;
  draft.consistencyFocus = goal.consistencyFocus;
  draft.professionalPlan = goal.professionalPlan;
  for (const key of optionalNumbers) draft[key] = goal[key] === null ? '' : String(goal[key]);
  draft.mealsPerDay = goal.mealsPerDay === null ? '' : String(goal.mealsPerDay);
  for (const key of optionalText) draft[key] = goal[key];
  return draft;
}

// Decimal comma and decimal point are accepted, without guessing thousands separators.
function positiveNumber(value: string): number | null {
  const cleaned = value.trim();
  if (!/^\d{1,8}(?:[.,]\d{1,2})?$/.test(cleaned)) return null;
  const number = Number(cleaned.replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? number : null;
}
export function validGoalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function validateGoalDraft(draft: GoalDraft): GoalErrors {
  const errors: GoalErrors = {};
  if (!objectiveOptions.includes(draft.objective)) errors.objective = 'selection';
  if (!dietaryOptions.includes(draft.dietaryPattern)) errors.dietaryPattern = 'selection';
  if (!focusOptions.includes(draft.consistencyFocus)) errors.consistencyFocus = 'selection';
  if (!draft.title.trim()) errors.title = 'required';
  else if (draft.title.trim().length > 80) errors.title = 'titleLength';
  if (!validGoalDate(draft.startDate.trim())) errors.startDate = 'date';
  if (!/^\d+$/.test(draft.durationWeeks.trim()) || Number(draft.durationWeeks) < 1 || Number(draft.durationWeeks) > 104) errors.durationWeeks = 'duration';
  if (!/^\d+$/.test(draft.weeklyFrequency.trim()) || Number(draft.weeklyFrequency) < 1 || Number(draft.weeklyFrequency) > 7) errors.weeklyFrequency = 'frequency';
  for (const key of optionalNumbers) if (draft[key].trim() && positiveNumber(draft[key]) === null) errors[key] = 'positive';
  if (draft.mealsPerDay.trim() && (!/^\d{1,2}$/.test(draft.mealsPerDay.trim()) || Number(draft.mealsPerDay) < 1 || Number(draft.mealsPerDay) > 24)) errors.mealsPerDay = 'integer';
  for (const key of optionalText) if (draft[key].length > 1000) errors[key] = 'textLength';
  return errors;
}

export function goalFromDraft(draft: GoalDraft, previous?: PersonalGoal | null): PersonalGoal {
  if (Object.keys(validateGoalDraft(draft)).length) throw new Error('Invalid personal goal');
  const now = new Date().toISOString();
  const goal: PersonalGoal = {
    version: 1, objective: draft.objective, title: draft.title.trim(), description: draft.description.trim(),
    startDate: draft.startDate.trim(), durationWeeks: Number(draft.durationWeeks), weeklyFrequency: Number(draft.weeklyFrequency),
    currentWeightKg: null, targetWeightKg: null, heightCm: null, dietaryPattern: draft.dietaryPattern,
    preferredFoods: '', dislikedFoods: '', allergies: '', restrictions: '', mealsPerDay: draft.mealsPerDay.trim() ? Number(draft.mealsPerDay) : null,
    consistencyFocus: draft.consistencyFocus, caloriesKcal: null, proteinG: null, carbsG: null, fatG: null, fiberG: null, waterMl: null,
    activityRoutine: '', dailyActivity: '', exerciseDays: '', exerciseDuration: '', exerciseIntensity: '', professionalPlan: draft.professionalPlan, professionalNotes: '',
    createdAt: previous?.createdAt || now, updatedAt: now,
  };
  for (const key of optionalNumbers) goal[key] = draft[key].trim() ? positiveNumber(draft[key]) : null;
  for (const key of optionalText) goal[key] = draft[key].trim();
  return goal;
}

function storedGoal(value: unknown): PersonalGoal {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid stored personal goal');
  const source = value as Record<string, unknown>;
  if (source.version !== 1 || typeof source.title !== 'string' || typeof source.startDate !== 'string') throw new Error('Invalid stored personal goal');
  const draft = createGoalDraft();
  draft.objective = source.objective as Objective;
  draft.title = source.title;
  draft.startDate = source.startDate;
  draft.dietaryPattern = source.dietaryPattern as DietaryPattern;
  draft.consistencyFocus = source.consistencyFocus as ConsistencyFocus;
  if (typeof source.professionalPlan !== 'boolean') throw new Error('Invalid stored personal goal');
  draft.professionalPlan = source.professionalPlan;
  for (const key of optionalText) {
    if (source[key] === undefined && ['dailyActivity', 'exerciseDays', 'exerciseDuration', 'exerciseIntensity'].includes(key)) continue;
    if (typeof source[key] !== 'string') throw new Error('Invalid stored personal goal');
    draft[key] = source[key] as string;
  }
  for (const key of [...optionalNumbers, 'mealsPerDay'] as const) {
    const value = source[key];
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error('Invalid stored personal goal');
    draft[key] = value === null ? '' : String(value);
  }
  for (const key of ['durationWeeks', 'weeklyFrequency'] as const) {
    if (typeof source[key] !== 'number' || !Number.isInteger(source[key])) throw new Error('Invalid stored personal goal');
    draft[key] = String(source[key]);
  }
  if (typeof source.createdAt !== 'string' || !Number.isFinite(Date.parse(source.createdAt)) || typeof source.updatedAt !== 'string' || !Number.isFinite(Date.parse(source.updatedAt))) throw new Error('Invalid stored personal goal');
  const clean = goalFromDraft(draft);
  return { ...clean, createdAt: source.createdAt, updatedAt: source.updatedAt };
}

let writes: Promise<void> = Promise.resolve();
export async function loadPersonalGoal(): Promise<PersonalGoal | null> {
  const raw = await AsyncStorage.getItem(PERSONAL_GOAL_KEY);
  return raw === null ? null : storedGoal(JSON.parse(raw));
}
export async function savePersonalGoal(draft: GoalDraft, previous?: PersonalGoal | null): Promise<PersonalGoal> {
  const goal = goalFromDraft(draft, previous);
  const write = writes.catch(() => {}).then(() => AsyncStorage.setItem(PERSONAL_GOAL_KEY, JSON.stringify(goal)));
  writes = write;
  await write;
  return goal;
}

export function usePersonalGoal() {
  const [goal, setGoal] = useState<PersonalGoal | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const mounted = useRef(true);
  const savingRef = useRef(false);
  const reload = useCallback(async () => {
    setReady(false); setLoadError(false);
    try {
      const loaded = await loadPersonalGoal();
      if (mounted.current) setGoal(loaded);
    } catch {
      if (mounted.current) setLoadError(true);
    } finally {
      if (mounted.current) setReady(true);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => { mounted.current = false; };
  }, [reload]);
  const save = useCallback(async (draft: GoalDraft) => {
    if (savingRef.current || !ready || loadError) return null;
    savingRef.current = true; setSaving(true); setSaveError(false);
    try {
      const next = await savePersonalGoal(draft, goal);
      if (mounted.current) setGoal(next);
      return next;
    } catch {
      if (mounted.current) setSaveError(true);
      return null;
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  }, [goal, ready, loadError]);
  return { goal, ready, saving, loadError, saveError, reload, save };
}
