import type { Assessment } from './Onboarding';

export function personalizedGoal(assessment: Assessment): string {
  const text = `${assessment.exercise} ${assessment.notes}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const activities: [RegExp, string][] = [
    [/\bmusculacao\b/, 'musculação'], [/\b(corrida|correr)\b/, 'corrida'],
    [/\b(ciclismo|pedalar|bicicleta)\b/, 'ciclismo'], [/\b(natacao|nadar)\b/, 'natação'],
    [/\b(caminhada|caminhar)\b/, 'caminhadas'], [/\b(crossfit)\b/, 'crossfit'],
  ];
  const activity = activities.find(([pattern]) => {
    const match = pattern.exec(text);
    if (!match) return false;
    return !/\b(nao|sem|evito)\b[^.!?,;]{0,30}$/.test(text.slice(Math.max(0, match.index - 35), match.index));
  });
  if (activity) return `${assessment.objective} com ${activity[1]}`;
  const routine: Record<string, string> = {
    'Pouco ativa': 'em uma rotina pouco ativa', 'Levemente ativa': 'em uma rotina levemente ativa',
    'Moderadamente ativa': 'em uma rotina moderadamente ativa', 'Muito ativa': 'em uma rotina muito ativa',
  };
  return routine[assessment.activity] ? `${assessment.objective} ${routine[assessment.activity]}` : assessment.objective;
}
