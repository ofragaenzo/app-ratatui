import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PersonalGoal } from './personalGoal';
import { useI18n } from './i18n';
import { usePreferences } from './preferences';
import { useAppTheme } from './theme';
import { Icon } from './ui';

type Props = {
  goal: PersonalGoal | null;
  goalTitle?: string;
  assessmentWeight?: string;
  journal: { dates: string[]; points: number; weights: { date: string; kg: number }[] };
  streak: number;
  weekDays: number;
  onEditGoal: () => void;
  onWeight: () => void;
};

export default function DiaryDetails({ goal, goalTitle, assessmentWeight, journal, streak, weekDays, onEditGoal, onWeight }: Props) {
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const { t, locale } = useI18n();
  const scale = preferences.textSize === 'large' ? 1.15 : 1;
  const lastWeight = journal.weights[journal.weights.length - 1];
  const firstWeight = journal.weights[0];
  const change = journal.weights.length > 1 ? lastWeight.kg - firstWeight.kg : null;
  const number = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 2 });
  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(locale);
  };
  return <View>
    <View style={[styles.hero, { backgroundColor: C.lilac }]}>
      <View style={styles.row}><View style={[styles.icon, { backgroundColor: C.accentSurface }]}><Icon name="flag-outline" size={20} color={C.purple} /></View><Text style={[styles.overline, { color: C.purple, fontSize: 11 * scale }]}>{t('SUA META PESSOAL')}</Text></View>
      <Text style={[styles.heroTitle, { color: C.purpleDark, fontSize: 23 * scale }]}>{goalTitle || (goal ? t(goal.title) : t('Comece definindo sua meta'))}</Text>
      <Text style={[styles.body, { color: C.textSecondary, fontSize: 12 * scale }]}>{goalTitle || goal ? t('Acompanhe seus registros e sua constância ao longo do caminho.') : t('Crie uma meta pessoal para acompanhar o que importa para você.')}</Text>
      <Pressable accessibilityRole="button" onPress={onEditGoal} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={[styles.actionText, { color: C.purple, fontSize: 12 * scale }]}>{t(goalTitle || goal ? 'Ver e editar meta' : 'Definir minha meta')}</Text><Icon name="arrow-forward" size={16} color={C.purple} /></Pressable>
    </View>

    <Text style={[styles.heading, { color: C.ink, fontSize: 17 * scale }]}>{t('Sua constância')}</Text>
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.line }]}>
      <View style={styles.metrics}>
        <View style={styles.metric}><Text style={[styles.value, { color: C.purpleDark, fontSize: 25 * scale }]}>{weekDays}<Text style={{ fontSize: 14 * scale, color: C.muted }}> / 7</Text></Text><Text style={[styles.label, { color: C.textSecondary, fontSize: 11 * scale }]}>{t('dias com registros')}</Text></View>
        <View style={[styles.divider, { backgroundColor: C.line }]} />
        <View style={styles.metric}><Text style={[styles.value, { color: C.purpleDark, fontSize: 25 * scale }]}>{streak}</Text><Text style={[styles.label, { color: C.textSecondary, fontSize: 11 * scale }]}>{t('dias de sequência')}</Text></View>
        <View style={[styles.divider, { backgroundColor: C.line }]} />
        <View style={styles.metric}><Text style={[styles.value, { color: C.purpleDark, fontSize: 25 * scale }]}>{journal.points}</Text><Text style={[styles.label, { color: C.textSecondary, fontSize: 11 * scale }]}>{t('pontos')}</Text></View>
      </View>
      <Text style={[styles.note, { color: C.muted, fontSize: 11 * scale }]}>{t('Dias com registros nos últimos 7 dias.')}</Text>
    </View>

    <Text style={[styles.heading, { color: C.ink, fontSize: 17 * scale }]}>{t('Acompanhamento de peso')}</Text>
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.line }]}>
      <View style={styles.weightRow}>
        {!!assessmentWeight && <View style={styles.weightItem}>
          <Text style={[styles.label, { color: C.textSecondary, fontSize: 11 * scale }]}>{t('Peso na avaliação')}</Text>
          <Text style={[styles.weight, { color: C.ink, fontSize: 20 * scale }]}>{number(Number(assessmentWeight.replace(',', '.')))} kg</Text>
        </View>}
        <View style={styles.weightItem}>
          <Text style={[styles.label, { color: C.textSecondary, fontSize: 11 * scale }]}>{t('Último peso registrado')}</Text>
          <Text style={[lastWeight ? styles.weight : styles.note, { color: lastWeight ? C.ink : C.textSecondary, fontSize: (lastWeight ? 20 : 12) * scale }]}>{lastWeight ? `${number(lastWeight.kg)} kg` : t('Sem registros')}</Text>
          {lastWeight && <Text style={[styles.note, { color: C.muted, fontSize: 10 * scale }]}>{formatDate(lastWeight.date)}</Text>}
        </View>
        {goal?.targetWeightKg != null && <View style={styles.weightItem}>
          <Text style={[styles.label, { color: C.textSecondary, fontSize: 11 * scale }]}>{t('Peso definido na meta')}</Text>
          <Text style={[styles.weight, { color: C.ink, fontSize: 20 * scale }]}>{number(goal.targetWeightKg)} kg</Text>
        </View>}
      </View>
      {change !== null ? <Text style={[styles.note, { color: C.textSecondary, fontSize: 11 * scale }]}>{t('Variação desde o primeiro registro: {change} kg', { change: `${change > 0 ? '+' : ''}${number(change)}` })}</Text> : <Text style={[styles.note, { color: C.muted, fontSize: 11 * scale }]}>{t('Registre seu peso em momentos diferentes para acompanhar a variação.')}</Text>}
      <Pressable accessibilityRole="button" onPress={onWeight} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={[styles.actionText, { color: C.purple, fontSize: 12 * scale }]}>{t('Registrar ou ver pesos')}</Text><Icon name="arrow-forward" size={16} color={C.purple} /></Pressable>
    </View>
    <Text style={[styles.footnote, { color: C.muted, fontSize: 10 * scale }]}>{t('Seus dados pessoais ficam neste dispositivo. A análise automática das refeições ainda não está conectada.')}</Text>
  </View>;
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, marginBottom: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, overline: { fontWeight: '700', letterSpacing: 0.7 },
  heroTitle: { fontWeight: '700', lineHeight: 31, marginTop: 18, letterSpacing: -0.5 }, body: { lineHeight: 20, marginTop: 8 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 44, marginTop: 8 }, actionText: { fontWeight: '700' }, pressed: { opacity: 0.6 },
  heading: { fontWeight: '700', marginTop: 18, marginBottom: 12 }, card: { borderRadius: 20, borderWidth: 1, padding: 19, marginBottom: 3 },
  metrics: { flexDirection: 'row', alignItems: 'center' }, metric: { flex: 1, alignItems: 'center' }, divider: { width: 1, height: 40 }, value: { fontWeight: '700' },
  label: { lineHeight: 17, marginTop: 5 }, note: { lineHeight: 18, marginTop: 14 }, weightRow: { flexDirection: 'row', gap: 16 }, weightItem: { flex: 1 }, weight: { fontWeight: '700', marginTop: 6 }, footnote: { textAlign: 'center', lineHeight: 18, marginTop: 18 },
});
