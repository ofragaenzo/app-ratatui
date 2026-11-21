import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Assessment } from './Onboarding';
import { personalizedGoal } from './goalSummary';
import { usePreferences } from './preferences';
import { useAppTheme } from './theme';
import { Icon } from './ui';

type Props = { assessment: Assessment; onBack: () => void; onReassess: () => void };

const copy = {
  'pt-BR': { back: 'Voltar', eyebrow: 'SEU CAMINHO', title: 'Minha meta', intro: 'Sua meta acompanha você todos os dias.', objective: 'Meu objetivo', overview: 'Sua avaliação', age: 'Idade', years: 'anos', weight: 'Peso informado', height: 'Altura', activity: 'Atividade no dia a dia', exercise: 'Exercícios', eating: 'Como você se alimenta', notes: 'Mais sobre sua meta', none: 'Não informado', review: 'Refazer minha avaliação', reviewHelp: 'Se sua rotina ou seu objetivo mudar, faça uma nova avaliação.', daily: 'Um dia de cada vez', dailyHelp: 'Registre suas refeições para acompanhar sua sequência diária.', preview: 'Prévia: suas respostas ficam apenas nesta sessão.' },
  en: { back: 'Back', eyebrow: 'YOUR JOURNEY', title: 'My goal', intro: 'Your goal stays with you every day.', objective: 'My objective', overview: 'Your assessment', age: 'Age', years: 'years', weight: 'Reported weight', height: 'Height', activity: 'Daily activity', exercise: 'Exercise', eating: 'How you eat', notes: 'More about your goal', none: 'Not provided', review: 'Redo my assessment', reviewHelp: 'If your routine or objective changes, start a new assessment.', daily: 'One day at a time', dailyHelp: 'Log your meals to follow your daily streak.', preview: 'Preview: your answers last only for this session.' },
  es: { back: 'Volver', eyebrow: 'TU CAMINO', title: 'Mi meta', intro: 'Tu meta te acompaña cada día.', objective: 'Mi objetivo', overview: 'Tu evaluación', age: 'Edad', years: 'años', weight: 'Peso indicado', height: 'Altura', activity: 'Actividad diaria', exercise: 'Ejercicio', eating: 'Cómo te alimentas', notes: 'Más sobre tu meta', none: 'Sin indicar', review: 'Rehacer mi evaluación', reviewHelp: 'Si cambia tu rutina o tu objetivo, haz una nueva evaluación.', daily: 'Un día a la vez', dailyHelp: 'Registra tus comidas para seguir tu racha diaria.', preview: 'Vista previa: tus respuestas quedan solo durante esta sesión.' },
};

export default function GoalOverview({ assessment, onBack, onReassess }: Props) {
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const text = copy[preferences.language];
  const scale = preferences.textSize === 'large' ? 1.15 : 1;
  const rows = [
    [text.age, assessment.age ? `${assessment.age} ${text.years}` : text.none],
    [text.weight, assessment.weight ? `${assessment.weight} kg` : text.none],
    [text.height, assessment.height ? `${assessment.height} cm` : text.none],
    [text.activity, assessment.activity || text.none],
    [text.exercise, assessment.exercise || text.none],
    [text.eating, assessment.eating || text.none],
  ];
  return <View>
    <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={text.back} style={styles.back}><Icon name="chevron-back" size={18} color={C.purple} /><Text style={[styles.backText, { color: C.purple, fontSize: 13 * scale }]}>{text.back}</Text></Pressable>
    <Text style={[styles.eyebrow, { color: C.purple, fontSize: 10 * scale }]}>{text.eyebrow}</Text>
    <Text style={[styles.title, { color: C.ink, fontSize: 34 * scale }]}>{text.title}<Text style={{ color: C.purple }}>.</Text></Text>
    <Text style={[styles.intro, { color: C.textSecondary, fontSize: 13 * scale }]}>{text.intro}</Text>
    <View style={[styles.hero, { backgroundColor: C.lilac }]}><View style={styles.row}><View style={[styles.icon, { backgroundColor: C.accentSurface }]}><Icon name="flag-outline" size={21} color={C.purple} /></View><Text style={[styles.label, { color: C.purple, fontSize: 11 * scale }]}>{text.objective}</Text></View><Text style={[styles.heroTitle, { color: C.purpleDark, fontSize: 23 * scale }]}>{personalizedGoal(assessment) || text.none}</Text><Text style={[styles.helper, { color: C.textSecondary, fontSize: 12 * scale }]}>Um resumo baseado no objetivo e na rotina que você informou.</Text></View>
    <Text style={[styles.heading, { color: C.ink, fontSize: 18 * scale }]}>{text.overview}</Text>
    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.line }]}>{rows.map(([label, value], index) => <View key={label} style={[styles.detail, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line }]}><Text style={[styles.detailLabel, { color: C.textSecondary, fontSize: 12 * scale }]}>{label}</Text><Text style={[styles.detailValue, { color: C.ink, fontSize: 13 * scale }]}>{value}</Text></View>)}{assessment.notes ? <View style={[styles.note, { borderTopColor: C.line }]}><Text style={[styles.detailLabel, { color: C.textSecondary, fontSize: 12 * scale }]}>{text.notes}</Text><Text style={[styles.noteText, { color: C.ink, fontSize: 13 * scale }]}>{assessment.notes}</Text></View> : null}</View>
    <View style={[styles.daily, { backgroundColor: C.surfaceSubtle }]}><Icon name="flame-outline" size={22} color={C.orange} /><View style={styles.flex}><Text style={[styles.dailyTitle, { color: C.ink, fontSize: 13 * scale }]}>{text.daily}</Text><Text style={[styles.helper, { color: C.textSecondary, fontSize: 11 * scale }]}>{text.dailyHelp}</Text></View></View>
    <Text style={[styles.helper, { color: C.textSecondary, fontSize: 12 * scale }]}>{text.reviewHelp}</Text>
    <Pressable onPress={onReassess} accessibilityRole="button" accessibilityLabel={text.review} style={({ pressed }) => [styles.button, { backgroundColor: C.purple }, pressed && { opacity: 0.7 }]}><Icon name="refresh-outline" size={19} color={C.onAccent} /><Text style={[styles.buttonText, { color: C.onAccent, fontSize: 14 * scale }]}>{text.review}</Text></Pressable>
    <Text style={[styles.footnote, { color: C.muted, fontSize: 10 * scale }]}>{text.preview}</Text>
  </View>;
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, gap: 3, marginBottom: 10 }, backText: { fontWeight: '600' },
  eyebrow: { fontWeight: '700', letterSpacing: 1.2, marginBottom: 7 }, title: { fontWeight: '700', letterSpacing: -1.1 }, intro: { lineHeight: 21, marginTop: 7, marginBottom: 22 },
  hero: { borderRadius: 22, padding: 20 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, label: { fontWeight: '600' }, heroTitle: { fontWeight: '700', lineHeight: 32, marginTop: 15 },
  heading: { fontWeight: '700', marginTop: 26, marginBottom: 12 }, card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 18, overflow: 'hidden' },
  detail: { paddingVertical: 15, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }, detailLabel: { flex: 1, lineHeight: 19 }, detailValue: { flex: 1, textAlign: 'right', fontWeight: '600', lineHeight: 19 }, note: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 15 }, noteText: { marginTop: 7, lineHeight: 20 },
  daily: { flexDirection: 'row', gap: 12, padding: 17, borderRadius: 18, marginVertical: 19 }, flex: { flex: 1 }, dailyTitle: { fontWeight: '700' }, helper: { lineHeight: 19, marginTop: 5 }, button: { minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }, buttonText: { fontWeight: '700' }, footnote: { textAlign: 'center', lineHeight: 17, marginTop: 14, marginBottom: 20 },
});
