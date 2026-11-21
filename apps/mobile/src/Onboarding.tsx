import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from './theme';
import { Icon, IconName } from './ui';
import { personalizedGoal } from './goalSummary';

export type Assessment = {
  objective: string; age: string; weight: string; height: string;
  activity: string; exercise: string; eating: string; notes: string;
};
type Props = { mode: 'signup' | 'reassess'; initial?: Assessment | null; onComplete: (assessment: Assessment) => void; onCancel?: () => void };
const empty: Assessment = { objective: '', age: '', weight: '', height: '', activity: '', exercise: '', eating: '', notes: '' };
const objectives: { label: string; icon: IconName; help: string }[] = [
  { label: 'Ganhar massa muscular', icon: 'barbell-outline', help: 'Apoiar meu desenvolvimento muscular' },
  { label: 'Reduzir gordura corporal', icon: 'trending-down-outline', help: 'Seguir um objetivo de redução de gordura' },
  { label: 'Manter meu peso', icon: 'scale-outline', help: 'Cuidar da minha rotina atual' },
  { label: 'Melhorar minha alimentação', icon: 'leaf-outline', help: 'Construir hábitos alimentares saudáveis' },
  { label: 'Bem-estar', icon: 'heart-outline', help: 'Melhorar minha relação com a comida' },
];
const activities = ['Pouco ativa', 'Levemente ativa', 'Moderadamente ativa', 'Muito ativa'];

export default function Onboarding({ mode, initial, onComplete, onCancel }: Props) {
  const { colors: C, isDark } = useAppTheme();
  const [step, setStep] = useState(mode === 'signup' ? 0 : 1);
  const [form, setForm] = useState<Assessment>({ ...empty, ...initial });
  const [provider, setProvider] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<{ key: string; message: string } | null>(null);
  const [reviewSnapshot, setReviewSnapshot] = useState<Assessment | null>(null);
  const inputs = useRef<Record<string, React.ComponentRef<typeof TextInput> | null>>({});
  const scroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [step]);
  const update = (key: keyof Assessment, value: string) => {
    setForm(previous => ({ ...previous, [key]: value }));
    if (fieldError?.key === key) setFieldError(null);
    setError('');
  };
  const numeric = (value: string) => Number(value.trim().replace(',', '.'));
  const invalidField = (key: string, message: string) => {
    setFieldError({ key, message });
    inputs.current[key]?.focus();
  };
  const changeStep = (destination: number) => {
    Keyboard.dismiss();
    setError('');
    setFieldError(null);
    setStep(destination);
  };
  const editStep = (destination: number) => {
    setReviewSnapshot(form);
    changeStep(destination);
  };
  const next = () => {
    if (step === 0 && !provider) { setError('Escolha uma forma de acesso para continuar.'); return; }
    if (step === 0 && provider === 'E-mail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { invalidField('email', 'Digite seu e-mail completo, como nome@exemplo.com.'); return; }
    if (step === 1 && !form.objective) { setError('Escolha seu objetivo principal.'); return; }
    if (step === 2) {
      const decimal = /^\d+(?:[.,]\d{1,2})?$/;
      const weight = numeric(form.weight);
      const rawHeight = numeric(form.height);
      const centimeters = rawHeight <= 2.5 ? Math.round(rawHeight * 100) : rawHeight;
      if (!/^\d+$/.test(form.age.trim()) || numeric(form.age) < 13 || numeric(form.age) > 120) {
        invalidField('age', 'Informe sua idade em anos, entre 13 e 120.'); return;
      }
      if (!decimal.test(form.weight.trim()) || weight <= 0 || weight > 500) {
        invalidField('weight', 'Informe o peso em quilos, por exemplo 72,5.'); return;
      }
      if (!decimal.test(form.height.trim()) || centimeters < 50 || centimeters > 250) {
        invalidField('height', 'Informe a altura em metros ou centímetros, por exemplo 1,70 ou 170.'); return;
      }
      setForm(previous => ({ ...previous, age: String(numeric(form.age)), weight: String(weight).replace('.', ','), height: String(centimeters).replace('.', ',') }));
    }
    if (step === 3 && !form.activity) { setError('Escolha o nível de atividade que mais se aproxima da sua rotina.'); return; }
    if (step === 5) { onComplete(form); return; }
    changeStep(reviewSnapshot ? 5 : step + 1);
    setReviewSnapshot(null);
  };
  const back = () => {
    if (reviewSnapshot) {
      setForm(reviewSnapshot);
      setReviewSnapshot(null);
      changeStep(5);
    } else if (step === 0 || (mode === 'reassess' && step === 1)) {
      Keyboard.dismiss();
      onCancel?.();
    } else changeStep(step - 1);
  };
  useEffect(() => {
    if (Platform.OS !== 'android' || step === 0) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => subscription.remove();
  }, [step, mode, reviewSnapshot, onCancel]);
  const errorMessage = (key: string) => fieldError?.key === key && <Text accessibilityRole="alert" style={[styles.error, { color: C.ink }]}>{fieldError.message}</Text>;
  const editAction = (stepNumber: number, section: string) => <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${section}`} onPress={() => editStep(stepNumber)} style={styles.edit}><Text style={[styles.label, { color: C.purple, marginBottom: 0 }]}>Editar</Text></Pressable>;
  const choice = (label: string, selected: boolean, onPress: () => void, icon?: IconName, help?: string) => <Pressable key={label} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.choice, { backgroundColor: selected ? C.lilac : C.surface, borderColor: selected ? C.purple : C.line }, pressed && styles.pressed]}>
    {icon && <View style={[styles.choiceIcon, { backgroundColor: C.lilac }]}><Icon name={icon} size={20} color={C.purple} /></View>}
    <View style={styles.flex}><Text style={[styles.choiceTitle, { color: selected ? C.purple : C.ink }]}>{label}</Text>{!!help && <Text style={[styles.choiceHelp, { color: C.textSecondary }]}>{help}</Text>}</View>
    {selected && <Icon name="checkmark-circle" size={21} color={C.purple} />}
  </Pressable>;
  const field = (key: keyof Assessment, label: string, placeholder: string, keyboard: 'default' | 'decimal-pad' | 'number-pad' = 'default', multiline = false) => <View style={styles.field}>
    <Text style={[styles.label, { color: C.ink }]}>{label}</Text>
    <TextInput ref={instance => { inputs.current[key] = instance; }} value={form[key]} onChangeText={value => update(key, value)} placeholder={placeholder} placeholderTextColor={C.textFaint} keyboardType={keyboard} multiline={multiline} maxLength={multiline ? 500 : 8} accessibilityLabel={label} accessibilityHint={fieldError?.key === key ? fieldError.message : undefined} style={[styles.input, multiline && styles.multiline, { backgroundColor: C.surface, borderColor: fieldError?.key === key ? C.orange : C.line, color: C.ink }]} />
    {errorMessage(key)}
  </View>;
  const titles = ['Seu espaço começa aqui', 'Qual é seu objetivo?', 'Seu ponto de partida', 'Como é sua rotina?', 'Seu jeito de comer', 'Sua meta pessoal'];
  const help = ['Escolha como deseja acessar o Prato a Prato.', 'Escolha o que mais combina com o que você deseja agora.', 'Essas informações ajudam a entender seu momento.', 'Conte um pouco sobre seu dia a dia e seus exercícios.', 'Suas preferências ajudam a dar contexto ao seu objetivo.', 'Confira as informações antes de confirmar.'];
  return <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}><StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} /><KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
      <View style={styles.content}>
        <View style={styles.top}>
          {step > 0 && (mode === 'signup' || step > 1 || !!reviewSnapshot) && <Pressable accessibilityRole="button" accessibilityLabel={reviewSnapshot ? 'Voltar ao resumo sem aplicar alterações' : 'Voltar'} onPress={back} style={styles.back}><Icon name="arrow-back" size={21} color={C.ink} /></Pressable>}
          <View style={styles.brand}><Icon name="leaf" size={20} color={C.purple} /><Text style={[styles.brandText, { color: C.ink }]}>prato a prato.</Text></View>
          {mode === 'reassess' && <Pressable accessibilityRole="button" accessibilityLabel="Cancelar reavaliação e manter minha meta" onPress={() => { Keyboard.dismiss(); onCancel?.(); }} style={styles.edit}><Text style={[styles.label, { color: C.purple, marginBottom: 0 }]}>Cancelar</Text></Pressable>}
        </View>
        {step > 0 && <><Text style={[styles.step, { color: C.purple }]}>{reviewSnapshot ? 'REVISÃO DAS RESPOSTAS' : `SUA AVALIAÇÃO · ${step} DE 5`}</Text>{!reviewSnapshot && <View style={[styles.track, { backgroundColor: C.neutralSurface }]}><View style={[styles.progress, { width: `${step * 20}%`, backgroundColor: C.purple }]} /></View>}</>}
        <Text accessibilityRole="header" style={[styles.title, { color: C.ink }]}>{titles[step]}</Text><Text style={[styles.intro, { color: C.textSecondary }]}>{help[step]}</Text>
        {step === 0 && <>
          <View style={styles.stack} accessibilityRole="radiogroup" accessibilityLabel="Forma de acesso">
            {([['Google', 'logo-google'], ['Apple', 'logo-apple'], ['E-mail', 'mail-outline']] as const).map(([name, icon]) => choice(name, provider === name, () => { setProvider(name); setFieldError(null); setError(''); }, icon))}
          </View>
          {provider === 'E-mail' && <View style={styles.field}><Text style={[styles.label, { color: C.ink }]}>E-mail</Text>
            <TextInput ref={instance => { inputs.current.email = instance; }} value={email} onChangeText={value => { setEmail(value); setFieldError(null); }} placeholder="seu@email.com" placeholderTextColor={C.textFaint} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" accessibilityLabel="E-mail" style={[styles.input, { backgroundColor: C.surface, borderColor: fieldError?.key === 'email' ? C.orange : C.line, color: C.ink }]} />
            {errorMessage('email')}
          </View>}
          <Text style={[styles.note, { color: C.muted }]}>Nesta prévia, você pode experimentar o cadastro e a avaliação. Suas respostas valem durante esta sessão.</Text>
        </>}
        {step === 1 && <View style={styles.stack} accessibilityRole="radiogroup" accessibilityLabel="Objetivo principal">{objectives.map(item => choice(item.label, form.objective === item.label, () => update('objective', item.label), item.icon, item.help))}</View>}
        {step === 2 && <>{field('age', 'Idade', 'Ex.: 25', 'number-pad')}{field('weight', 'Peso atual (kg)', 'Ex.: 70,5', 'decimal-pad')}{field('height', 'Altura (m ou cm)', 'Ex.: 1,70 ou 170', 'decimal-pad')}</>}
        {step === 3 && <><Text style={[styles.label, { color: C.ink, marginBottom: 12 }]}>Atividade no dia a dia</Text><View style={styles.stack} accessibilityRole="radiogroup" accessibilityLabel="Atividade no dia a dia">{activities.map(label => choice(label, form.activity === label, () => update('activity', label)))}</View>{field('exercise', 'Exercícios que pratica (opcional)', 'Ex.: musculação 3 vezes por semana', 'default', true)}</>}
        {step === 4 && <>{field('eating', 'Preferências ou restrições (opcional)', 'Conte como você costuma comer', 'default', true)}{field('notes', 'Mais sobre sua meta (opcional)', 'O que mais gostaria de compartilhar?', 'default', true)}</>}
        {step === 5 && <>
          <View style={[styles.summary, { backgroundColor: C.lilac }]}>
            <View style={styles.summaryHeading}><Text style={[styles.summaryLabel, { color: C.purple }]}>SEU OBJETIVO</Text>{editAction(1, 'objetivo')}</View>
            <Text style={[styles.summaryTitle, { color: C.purpleDark }]}>{personalizedGoal(form)}</Text>
          </View>
          {[
            { title: 'Dados pessoais', step: 2, values: [['Idade', `${form.age} anos`], ['Peso atual', `${form.weight} kg`], ['Altura', `${form.height} cm`]] },
            { title: 'Rotina e exercícios', step: 3, values: [['Atividade diária', form.activity], ['Exercícios', form.exercise]] },
            { title: 'Alimentação e preferências', step: 4, values: [['Alimentação', form.eating], ['Sobre a meta', form.notes]] },
          ].map(section => <View key={section.step} style={[styles.summary, { backgroundColor: C.surface, borderColor: C.line, borderWidth: 1 }]}>
            <View style={styles.summaryHeading}><Text accessibilityRole="header" style={[styles.choiceTitle, styles.flex, { color: C.ink }]}>{section.title}</Text>{editAction(section.step, section.title.toLowerCase())}</View>
            {section.values.map(([label, value]) => <View key={label} style={[styles.summaryRow, { borderBottomColor: C.line }]}><Text style={[styles.summaryKey, { color: C.muted }]}>{label}</Text><Text style={[styles.summaryValue, { color: C.ink }]}>{value.trim() || 'Não informado'}</Text></View>)}
          </View>)}
        </>}
        {!!error && <Text accessibilityRole="alert" style={[styles.error, { color: C.ink }]}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={next} style={({ pressed }) => [styles.primary, { backgroundColor: C.purple }, pressed && styles.pressed]}><Text style={[styles.primaryText, { color: C.onAccent }]}>{step === 0 ? 'Continuar na prévia' : step === 5 ? (mode === 'reassess' ? 'Atualizar minha meta' : 'Confirmar minha meta') : reviewSnapshot ? 'Aplicar e voltar ao resumo' : step === 4 ? 'Revisar minha meta' : 'Continuar'}</Text><Icon name={step === 5 ? 'checkmark' : 'arrow-forward'} color={C.onAccent} size={18} /></Pressable>
        {step > 0 && <Text style={[styles.note, { color: C.muted }]}>Você poderá refazer sua avaliação quando quiser.</Text>}
      </View>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, scroll: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 36 }, content: { width: '100%', maxWidth: 520, alignSelf: 'center' }, flex: { flex: 1 },
  top: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, brandText: { fontSize: 18, fontWeight: '700', letterSpacing: -0.6 }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  step: { fontSize: 10, letterSpacing: 1.1, fontWeight: '700', marginBottom: 9 }, track: { height: 4, borderRadius: 4, overflow: 'hidden', marginBottom: 25 }, progress: { height: 4, borderRadius: 4 },
  title: { fontSize: 30, lineHeight: 38, letterSpacing: -0.8, fontWeight: '700' }, intro: { fontSize: 13, lineHeight: 21, marginTop: 9, marginBottom: 24 }, stack: { gap: 10 },
  choice: { minHeight: 62, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, choiceIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, choiceTitle: { fontSize: 14, fontWeight: '600' }, choiceHelp: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  field: { marginBottom: 17, marginTop: 5 }, label: { fontSize: 12, fontWeight: '600', marginBottom: 8 }, input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 14 }, multiline: { minHeight: 94, textAlignVertical: 'top' },
  primary: { minHeight: 54, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 24 }, primaryText: { fontSize: 14, fontWeight: '700' }, pressed: { opacity: 0.65 }, note: { fontSize: 11, lineHeight: 18, marginTop: 15, textAlign: 'center' }, error: { fontSize: 12, lineHeight: 18, marginTop: 12 },
  summary: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, marginBottom: 14 }, summaryHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, edit: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' }, summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 }, summaryTitle: { fontSize: 23, fontWeight: '700', marginBottom: 6 }, summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth }, summaryKey: { fontSize: 12, flex: 1 }, summaryValue: { fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
});
