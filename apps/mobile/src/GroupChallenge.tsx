import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from './theme';
import { usePreferences } from './preferences';
import { Icon } from './ui';
import type { Meal } from './data';

export type ChallengeError = { field: 'start' | 'end'; reason: 'required' | 'invalid' | 'order' } | null;
const copy = {
  'pt-BR': { title: 'Período do desafio', help: 'Os pontos das refeições publicadas nesse período contam para o ranking do grupo.', start: 'Início', end: 'Término', placeholder: 'DD/MM/AAAA', required: 'Preencha esta data.', invalid: 'Use uma data válida no formato dia/mês/ano.', order: 'Use a data de início ou uma data posterior.', unset: 'Período ainda não definido', until: 'até' },
  en: { title: 'Challenge period', help: 'The group decides when the competition begins and ends.', start: 'Starts', end: 'Ends', placeholder: 'DD/MM/YYYY', required: 'Enter a start and end date.', invalid: 'Check that both dates are valid.', order: 'The end date must be on or after the start date.', unset: 'No period set yet', until: 'to' },
  es: { title: 'Período del desafío', help: 'El grupo decide cuándo empieza y termina la competición.', start: 'Inicio', end: 'Fin', placeholder: 'DD/MM/AAAA', required: 'Indica las fechas de inicio y fin.', invalid: 'Comprueba que las fechas sean válidas.', order: 'El fin debe ser igual o posterior al inicio.', unset: 'Período aún no definido', until: 'hasta' },
};

export function formatChallengeDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join('/');
}

function dateKey(value: string): number | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, d, m, y] = match;
  const day = Number(d), month = Number(m), year = Number(y);
  if (year < 1900 || year > 9999) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? year * 10000 + month * 100 + day : null;
}

export function validateChallengeDates(start: string, end: string): ChallengeError {
  const first = dateKey(start), last = dateKey(end);
  if (first === null) return { field: 'start', reason: start ? 'invalid' : 'required' };
  if (last === null) return { field: 'end', reason: end ? 'invalid' : 'required' };
  return last < first ? { field: 'end', reason: 'order' } : null;
}

export function personalGroupPoints(group: { id: string; challengeStart?: string; challengeEnd?: string }, meals: Meal[]): number {
  const start = group.challengeStart ? dateKey(group.challengeStart) : null;
  const end = group.challengeEnd ? dateKey(group.challengeEnd) : null;
  return meals.reduce((sum, meal) => {
    if (!meal.mine || meal.groupId !== group.id || meal.earnedPoints === undefined) return sum;
    if (start !== null || end !== null) {
      if (meal.recordedAt === undefined) return sum;
      const date = new Date(meal.recordedAt);
      const day = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
      if ((start !== null && day < start) || (end !== null && day > end)) return sum;
    }
    return sum + meal.earnedPoints;
  }, 0);
}

export function GroupChallengeFields({ start, end, onStart, onEnd, error }: { start: string; end: string; onStart: (value: string) => void; onEnd: (value: string) => void; error: ChallengeError }) {
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const text = copy[preferences.language];
  const scale = preferences.textSize === 'large' ? 1.15 : 1;
  const startRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const endRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  useEffect(() => {
    if (error) (error.field === 'start' ? startRef : endRef).current?.focus();
  }, [error]);
  return <View style={s.fields}>
    <Text style={[s.title, { color: C.ink, fontSize: 14 * scale }]}>{text.title}</Text>
    <Text style={[s.help, { color: C.muted, fontSize: 11 * scale }]}>{text.help}</Text>
    <View style={s.row}>{([{ id: 'start', ref: startRef, label: text.start, value: start, change: onStart }, { id: 'end', ref: endRef, label: text.end, value: end, change: onEnd }]).map(field => <View key={field.id} style={s.flex}>
      <Text style={[s.label, { color: C.textSecondary, fontSize: 11 * scale }]}>{field.label}</Text>
      <TextInput ref={field.ref} accessibilityLabel={field.label}
        accessibilityHint={error?.field === field.id ? text[error.reason] : undefined}
        value={field.value} onChangeText={value => field.change(formatChallengeDate(value))} keyboardType="number-pad"
        maxLength={10} placeholder={text.placeholder} placeholderTextColor={C.textFaint}
        style={[s.input, { color: C.ink, borderColor: error?.field === field.id ? C.orange : C.line, backgroundColor: C.surfaceSubtle, fontSize: 14 * scale }]} />
      {error?.field === field.id && <Text accessibilityRole="alert" style={[s.error, { color: C.ink, fontSize: 12 * scale }]}>{text[error.reason]}</Text>}
    </View>)}</View>
  </View>;
}

export function GroupChallengeSummary({ start, end }: { start?: string; end?: string }) {
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const text = copy[preferences.language];
  const scale = preferences.textSize === 'large' ? 1.15 : 1;
  return <View style={[s.summary, { backgroundColor: C.surface, borderColor: C.line }]}>
    <View style={[s.icon, { backgroundColor: C.lilac }]}><Icon name="calendar-outline" size={21} color={C.purple} /></View>
    <View style={s.flex}><Text style={[s.summaryTitle, { color: C.ink, fontSize: 14 * scale }]}>{text.title}</Text><Text style={[s.summaryDate, { color: C.textSecondary, fontSize: 12 * scale }]}>{start && end ? `${start} ${text.until} ${end}` : text.unset}</Text></View>
  </View>;
}

const s = StyleSheet.create({
  fields: { marginTop: 18, marginBottom: 18 }, title: { fontWeight: '600', lineHeight: 21 }, help: { lineHeight: 18, marginTop: 5, marginBottom: 12 }, row: { flexDirection: 'row', gap: 12 }, flex: { flex: 1 }, label: { marginBottom: 6 }, input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, height: 50 }, error: { marginTop: 8, lineHeight: 17 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 18 }, icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, summaryTitle: { fontWeight: '600' }, summaryDate: { marginTop: 6 },
});
