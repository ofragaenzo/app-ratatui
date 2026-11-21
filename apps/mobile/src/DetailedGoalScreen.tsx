import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { usePreferences, Language } from './preferences';
import { Palette, useAppTheme } from './theme';
import { Icon, IconName } from './ui';
import {
  createGoalDraft, dietaryOptions, focusOptions, goalToDraft, GoalDraft, GoalErrors, GoalField,
  objectiveOptions, usePersonalGoal, validateGoalDraft,
} from './personalGoal';

const pt = {
  back: 'Perfil', title: 'Minha meta', intro: 'Um plano que respeita sua rotina, suas preferências e o seu momento.',
  private: 'Seus detalhes são privados', privacy: 'Só o nome da meta aparece no seu grupo. Medidas, restrições e metas nutricionais ficam neste dispositivo.',
  guidance: 'Preencha apenas metas que você já definiu, de preferência com orientação profissional.',
  completed: 'partes preenchidas', optional: 'Opcional', required: 'Essencial',
  objectiveSection: 'O que você quer construir?', objectiveHelp: 'Escolha uma direção e descreva o que faz sentido para você.',
  titleLabel: 'Nome da sua meta', titlePlaceholder: 'Ex.: incluir vegetais no almoço', titleHelp: 'Esse é o único texto desta ficha que aparece no grupo.',
  descriptionLabel: 'Sua intenção em detalhes', descriptionPlaceholder: 'O que você quer alcançar? Por que isso importa para você?',
  habits: 'Melhorar hábitos', 'fat-loss': 'Reduzir gordura corporal', 'muscle-gain': 'Ganhar massa muscular', maintenance: 'Manter minha rotina e meu peso', wellbeing: 'Bem-estar e relação com a comida',
  scheduleSection: 'Seu plano de ação', scheduleHelp: 'Defina o período e a frequência que você quer acompanhar.',
  startDate: 'Data de início', dateHint: 'Use ano-mês-dia, como 2026-11-17.', duration: 'Duração em semanas', durationHint: 'De 1 a 104 semanas. Você pode revisar depois.',
  frequency: 'Dias por semana', frequencyHelp: 'Em quantos dias você quer praticar esse hábito?', days: 'dias', focus: 'Seu foco de consistência',
  vegetables: 'Vegetais nas refeições', regularity: 'Horários e regularidade', variety: 'Variedade de alimentos', protein: 'Minha meta de proteína', hydration: 'Minha rotina de hidratação', 'mindful-eating': 'Comer com atenção', custom: 'Outro foco pessoal',
  measuresSection: 'Seu ponto de partida', measuresHelp: 'Medidas são opcionais. O app não calcula IMC nem define um peso ideal.',
  currentWeight: 'Peso atual (kg)', targetWeight: 'Peso que você definiu como meta (kg)', height: 'Altura (cm)',
  foodSection: 'Seu jeito de comer', foodHelp: 'Preferências e limites que você quer levar em conta no seu plano.', pattern: 'Padrão alimentar',
  'not-set': 'Prefiro não informar', omnivore: 'Onívoro', vegetarian: 'Vegetariano', vegan: 'Vegano', pescatarian: 'Pescetariano', other: 'Outro',
  preferred: 'Alimentos que você gosta', preferredPlaceholder: 'Ex.: arroz, feijão, frutas, iogurte…', disliked: 'Alimentos que prefere evitar', dislikedPlaceholder: 'Sabores, texturas ou ingredientes que não combinam com você.',
  allergies: 'Alergias alimentares', allergiesPlaceholder: 'Informe apenas alergias que você já conhece.', restrictions: 'Restrições ou necessidades alimentares', restrictionsPlaceholder: 'Ex.: lactose, glúten ou orientações do seu profissional.',
  meals: 'Refeições por dia que você planejou', mealsHint: 'Um número de 1 a 24. Não há uma quantidade sugerida pelo app.',
  targetsSection: 'Metas diárias que você já definiu', targetsHelp: 'Preenchimento opcional. O app não estima nem recomenda quantidades.',
  calories: 'Energia (kcal)', proteinTarget: 'Proteína (g)', carbs: 'Carboidratos (g)', fat: 'Gorduras (g)', fiber: 'Fibras (g)', water: 'Água (ml)',
  routineSection: 'Sua rotina e acompanhamento', routineHelp: 'Dê contexto ao plano sem transformar o cuidado em uma cobrança.',
  activity: 'Rotina de atividade e horários', activityPlaceholder: 'Como seus treinos, trabalho e horários se relacionam com a alimentação?',
  professional: 'Sigo um plano profissional', professionalHelp: 'Marque se você já recebeu orientações individualizadas.',
  professionalNotes: 'Orientações e observações para você', professionalPlaceholder: 'Registre o que você quer lembrar do seu plano.',
  save: 'Salvar minha meta', saving: 'Salvando sua meta…', savedHelp: 'Os detalhes são salvos neste dispositivo. Eles não são enviados ao grupo.',
  loading: 'Carregando sua meta…', loadError: 'Não foi possível carregar seus detalhes. Tente novamente antes de editar para preservar o que já estava salvo.',
  saveError: 'Não foi possível salvar. Seus campos continuam aqui; tente salvar novamente.', retry: 'Tentar novamente', invalid: 'Revise os campos indicados antes de salvar.',
  requiredError: 'Preencha este campo.', titleLengthError: 'Use até 80 caracteres.', textLengthError: 'Use até 1.000 caracteres.',
  dateError: 'Informe uma data válida no formato ano-mês-dia.', durationError: 'Use um número inteiro de 1 a 104.', frequencyError: 'Escolha de 1 a 7 dias.',
  positiveError: 'Use um número maior que zero, com até 2 casas decimais.', integerError: 'Use um número inteiro de 1 a 24.', selectionError: 'Escolha uma opção válida.',
};
type Copy = typeof pt;
const copy: Record<Language, Copy> = {
  'pt-BR': pt,
  en: {
    back: 'Profile', title: 'My goal', intro: 'A plan that respects your routine, preferences and current needs.',
    private: 'Your details are private', privacy: 'Only your goal name appears in your group. Measurements, restrictions and nutrition targets stay on this device.',
    guidance: 'Only enter targets you have already chosen, preferably with professional guidance.',
    completed: 'parts completed', optional: 'Optional', required: 'Essential',
    objectiveSection: 'What do you want to build?', objectiveHelp: 'Choose a direction and describe what matters to you.',
    titleLabel: 'Goal name', titlePlaceholder: 'E.g. add vegetables to lunch', titleHelp: 'This is the only text from this form shown to your group.',
    descriptionLabel: 'Your intention in detail', descriptionPlaceholder: 'What would you like to achieve? Why does it matter to you?',
    habits: 'Improve my habits', 'fat-loss': 'Reduce body fat', 'muscle-gain': 'Build muscle', maintenance: 'Maintain my routine and weight', wellbeing: 'Wellbeing and my relationship with food',
    scheduleSection: 'Your action plan', scheduleHelp: 'Set the period and frequency you want to track.',
    startDate: 'Start date', dateHint: 'Use year-month-day, such as 2026-11-17.', duration: 'Duration in weeks', durationHint: 'From 1 to 104 weeks. You can review this later.',
    frequency: 'Days per week', frequencyHelp: 'On how many days would you like to practise this habit?', days: 'days', focus: 'Your consistency focus',
    vegetables: 'Vegetables in my meals', regularity: 'Timing and regularity', variety: 'Food variety', protein: 'My protein target', hydration: 'My hydration routine', 'mindful-eating': 'Mindful eating', custom: 'Another personal focus',
    measuresSection: 'Your starting point', measuresHelp: 'Measurements are optional. The app does not calculate BMI or set an ideal weight.',
    currentWeight: 'Current weight (kg)', targetWeight: 'Weight target you have chosen (kg)', height: 'Height (cm)',
    foodSection: 'Your way of eating', foodHelp: 'Preferences and limits you want to consider in your plan.', pattern: 'Eating pattern',
    'not-set': 'Prefer not to say', omnivore: 'Omnivore', vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian', other: 'Other',
    preferred: 'Foods you enjoy', preferredPlaceholder: 'E.g. rice, beans, fruit, yogurt…', disliked: 'Foods you prefer to avoid', dislikedPlaceholder: 'Flavours, textures or ingredients that do not work for you.',
    allergies: 'Food allergies', allergiesPlaceholder: 'Only enter allergies you already know about.', restrictions: 'Dietary restrictions or needs', restrictionsPlaceholder: 'E.g. lactose, gluten or guidance from your professional.',
    meals: 'Meals per day you have planned', mealsHint: 'A number from 1 to 24. The app does not suggest an amount.',
    targetsSection: 'Daily targets you have already chosen', targetsHelp: 'Optional. The app does not estimate or recommend amounts.',
    calories: 'Energy (kcal)', proteinTarget: 'Protein (g)', carbs: 'Carbohydrates (g)', fat: 'Fat (g)', fiber: 'Fibre (g)', water: 'Water (ml)',
    routineSection: 'Your routine and support', routineHelp: 'Give your plan context while keeping care manageable.',
    activity: 'Activity routine and schedule', activityPlaceholder: 'How do your exercise, work and schedule relate to your eating habits?',
    professional: 'I follow a professional plan', professionalHelp: 'Select this if you have received personalised guidance.',
    professionalNotes: 'Guidance and personal notes', professionalPlaceholder: 'Write down what you want to remember from your plan.',
    save: 'Save my goal', saving: 'Saving your goal…', savedHelp: 'Details are saved on this device. They are not sent to the group.',
    loading: 'Loading your goal…', loadError: 'Could not load your details. Please retry before editing to preserve what was saved.',
    saveError: 'Could not save. Your entries are still here; please try saving again.', retry: 'Try again', invalid: 'Review the indicated fields before saving.',
    requiredError: 'Please fill in this field.', titleLengthError: 'Use up to 80 characters.', textLengthError: 'Use up to 1,000 characters.',
    dateError: 'Enter a valid date in year-month-day format.', durationError: 'Use a whole number from 1 to 104.', frequencyError: 'Choose from 1 to 7 days.',
    positiveError: 'Use a number greater than zero, with up to 2 decimal places.', integerError: 'Use a whole number from 1 to 24.', selectionError: 'Choose a valid option.',
  },
  es: {
    back: 'Perfil', title: 'Mi meta', intro: 'Un plan que respeta tu rutina, tus preferencias y tu momento.',
    private: 'Tus detalles son privados', privacy: 'Solo el nombre de tu meta aparece en el grupo. Las medidas, restricciones y metas nutricionales se quedan en este dispositivo.',
    guidance: 'Introduce solo metas que ya hayas definido, preferiblemente con orientación profesional.',
    completed: 'partes completadas', optional: 'Opcional', required: 'Esencial',
    objectiveSection: '¿Qué quieres construir?', objectiveHelp: 'Elige una dirección y describe lo que tiene sentido para ti.',
    titleLabel: 'Nombre de tu meta', titlePlaceholder: 'Ej.: incluir verduras en el almuerzo', titleHelp: 'Este es el único texto de esta ficha que aparece en el grupo.',
    descriptionLabel: 'Tu intención en detalle', descriptionPlaceholder: '¿Qué quieres alcanzar? ¿Por qué es importante para ti?',
    habits: 'Mejorar hábitos', 'fat-loss': 'Reducir grasa corporal', 'muscle-gain': 'Ganar masa muscular', maintenance: 'Mantener mi rutina y mi peso', wellbeing: 'Bienestar y relación con la comida',
    scheduleSection: 'Tu plan de acción', scheduleHelp: 'Define el periodo y la frecuencia que quieres seguir.',
    startDate: 'Fecha de inicio', dateHint: 'Usa año-mes-día, como 2026-11-17.', duration: 'Duración en semanas', durationHint: 'De 1 a 104 semanas. Puedes revisarlo después.',
    frequency: 'Días por semana', frequencyHelp: '¿Cuántos días quieres practicar este hábito?', days: 'días', focus: 'Tu foco de constancia',
    vegetables: 'Verduras en las comidas', regularity: 'Horarios y regularidad', variety: 'Variedad de alimentos', protein: 'Mi meta de proteína', hydration: 'Mi rutina de hidratación', 'mindful-eating': 'Comer con atención', custom: 'Otro foco personal',
    measuresSection: 'Tu punto de partida', measuresHelp: 'Las medidas son opcionales. La app no calcula el IMC ni define un peso ideal.',
    currentWeight: 'Peso actual (kg)', targetWeight: 'Peso que has definido como meta (kg)', height: 'Altura (cm)',
    foodSection: 'Tu forma de comer', foodHelp: 'Preferencias y límites que quieres considerar en tu plan.', pattern: 'Patrón alimentario',
    'not-set': 'Prefiero no informar', omnivore: 'Omnívoro', vegetarian: 'Vegetariano', vegan: 'Vegano', pescatarian: 'Pescetariano', other: 'Otro',
    preferred: 'Alimentos que te gustan', preferredPlaceholder: 'Ej.: arroz, legumbres, frutas, yogur…', disliked: 'Alimentos que prefieres evitar', dislikedPlaceholder: 'Sabores, texturas o ingredientes que no van contigo.',
    allergies: 'Alergias alimentarias', allergiesPlaceholder: 'Informa solo de alergias que ya conoces.', restrictions: 'Restricciones o necesidades alimentarias', restrictionsPlaceholder: 'Ej.: lactosa, gluten u orientaciones de tu profesional.',
    meals: 'Comidas por día que has planificado', mealsHint: 'Un número de 1 a 24. La app no sugiere una cantidad.',
    targetsSection: 'Metas diarias que ya has definido', targetsHelp: 'Opcional. La app no estima ni recomienda cantidades.',
    calories: 'Energía (kcal)', proteinTarget: 'Proteína (g)', carbs: 'Carbohidratos (g)', fat: 'Grasas (g)', fiber: 'Fibra (g)', water: 'Agua (ml)',
    routineSection: 'Tu rutina y acompañamiento', routineHelp: 'Da contexto a tu plan para que el cuidado sea sostenible.',
    activity: 'Rutina de actividad y horarios', activityPlaceholder: '¿Cómo se relacionan el ejercicio, el trabajo y tus horarios con la alimentación?',
    professional: 'Sigo un plan profesional', professionalHelp: 'Márcalo si ya has recibido orientación individualizada.',
    professionalNotes: 'Orientaciones y notas personales', professionalPlaceholder: 'Anota lo que quieres recordar de tu plan.',
    save: 'Guardar mi meta', saving: 'Guardando tu meta…', savedHelp: 'Los detalles se guardan en este dispositivo. No se envían al grupo.',
    loading: 'Cargando tu meta…', loadError: 'No se pudieron cargar tus detalles. Inténtalo de nuevo antes de editar para preservar lo guardado.',
    saveError: 'No se pudo guardar. Tus datos siguen aquí; intenta guardar de nuevo.', retry: 'Intentar de nuevo', invalid: 'Revisa los campos indicados antes de guardar.',
    requiredError: 'Completa este campo.', titleLengthError: 'Usa hasta 80 caracteres.', textLengthError: 'Usa hasta 1.000 caracteres.',
    dateError: 'Introduce una fecha válida en formato año-mes-día.', durationError: 'Usa un número entero de 1 a 104.', frequencyError: 'Elige de 1 a 7 días.',
    positiveError: 'Usa un número mayor que cero, con hasta 2 decimales.', integerError: 'Usa un número entero de 1 a 24.', selectionError: 'Elige una opción válida.',
  },
};

type Section = 'objective' | 'schedule' | 'measures' | 'food' | 'targets' | 'routine';
type FormStyles = ReturnType<typeof createStyles>;

export default function DetailedGoalScreen({ onBack, onSave }: { onBack: () => void; onSave: (goal: string) => void }) {
  const { preferences } = usePreferences();
  const { colors: C, isDark } = useAppTheme();
  const text = copy[preferences.language];
  const scale = preferences.textSize === 'large' ? 1.18 : 1;
  const s = useMemo(() => createStyles(C, scale), [C, scale]);
  const { goal, ready, saving, loadError, saveError, reload, save } = usePersonalGoal();
  const [draft, setDraft] = useState<GoalDraft>(createGoalDraft);
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<GoalField, boolean>>>({});
  const [expanded, setExpanded] = useState<Section[]>(['objective', 'schedule']);
  useEffect(() => { if (ready && !loadError) setDraft(goal ? goalToDraft(goal) : createGoalDraft()); }, [goal, ready, loadError]);
  const errors = validateGoalDraft(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const filled = [
    Boolean(draft.title.trim()), Boolean(draft.startDate && draft.durationWeeks && draft.weeklyFrequency),
    Boolean(draft.currentWeightKg || draft.targetWeightKg || draft.heightCm),
    Boolean(draft.dietaryPattern !== 'not-set' || draft.preferredFoods || draft.dislikedFoods || draft.allergies || draft.restrictions || draft.mealsPerDay),
    Boolean(draft.caloriesKcal || draft.proteinG || draft.carbsG || draft.fatG || draft.fiberG || draft.waterMl),
    Boolean(draft.activityRoutine || draft.professionalPlan || draft.professionalNotes),
  ];
  function set<K extends GoalField>(field: K, value: GoalDraft[K]) { setDraft(previous => ({ ...previous, [field]: value })); }
  function error(field: GoalField) {
    if ((!attempted && !touched[field]) || !errors[field]) return undefined;
    const keys = { required: 'requiredError', titleLength: 'titleLengthError', textLength: 'textLengthError', date: 'dateError', duration: 'durationError', frequency: 'frequencyError', positive: 'positiveError', integer: 'integerError', selection: 'selectionError' } as const;
    return text[keys[errors[field]!]];
  }
  function field(name: GoalField, label: string, options: { hint?: string; placeholder?: string; numeric?: boolean; multiline?: boolean; maxLength?: number } = {}) {
    return <FormField key={name} label={label} value={String(draft[name])} onChange={value => set(name, value as never)}
      onBlur={() => setTouched(previous => ({ ...previous, [name]: true }))} error={error(name)} s={s} C={C}
      {...options} disabled={saving} />;
  }
  function section(id: Section, icon: IconName, title: string, help: string, children: React.ReactNode, optional = true) {
    return <AccordionSection key={id} title={title} help={help} icon={icon} optional={optional ? text.optional : text.required}
      open={expanded.includes(id)} onToggle={() => setExpanded(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id])} s={s} C={C}>{children}</AccordionSection>;
  }
  async function submit() {
    setAttempted(true);
    if (hasErrors) {
      const sectionsWithErrors: Section[] = [];
      for (const key of Object.keys(errors) as GoalField[]) {
        const id: Section = ['objective', 'title', 'description'].includes(key) ? 'objective'
          : ['startDate', 'durationWeeks', 'weeklyFrequency', 'consistencyFocus'].includes(key) ? 'schedule'
          : ['currentWeightKg', 'targetWeightKg', 'heightCm'].includes(key) ? 'measures'
          : ['dietaryPattern', 'preferredFoods', 'dislikedFoods', 'allergies', 'restrictions', 'mealsPerDay'].includes(key) ? 'food'
          : ['caloriesKcal', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'waterMl'].includes(key) ? 'targets' : 'routine';
        if (!sectionsWithErrors.includes(id)) sectionsWithErrors.push(id);
      }
      setExpanded(previous => [...new Set([...previous, ...sectionsWithErrors])]);
      return;
    }
    const saved = await save(draft);
    if (saved) onSave(saved.title);
  }

  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={text.back} onPress={onBack} disabled={saving} style={s.back}><Icon name="chevron-back" color={C.purple} size={20} /><Text style={s.backText}>{text.back}</Text></Pressable>
    <View style={s.header}><View style={s.flex}><Text style={s.title}>{text.title}<Text style={{ color: C.purple }}>.</Text></Text><Text style={s.intro}>{text.intro}</Text></View><View style={s.headerIcon}><Icon name="leaf-outline" size={25} color={C.purple} /></View></View>
    <View style={s.privacy}><Icon name="lock-closed-outline" size={20} color={C.purple} /><View style={s.flex}><Text style={s.privacyTitle}>{text.private}</Text><Text style={s.privacyText}>{text.privacy}</Text></View></View>
    {!ready ? <View style={s.loading}><ActivityIndicator color={C.purple} /><Text style={s.intro}>{text.loading}</Text></View> : loadError ? <View style={s.errorBox}><Text style={s.errorText}>{text.loadError}</Text><Pressable accessibilityRole="button" onPress={reload} style={s.retry}><Text style={s.retryText}>{text.retry}</Text></Pressable></View> : <>
      <View style={s.completion}><View style={s.sectionRow}><Text style={s.completionText}>{filled.filter(Boolean).length}/6 {text.completed}</Text><Text style={s.optionalText}>{text.optional}</Text></View><View style={s.completionBars}>{filled.map((value, index) => <View key={index} style={[s.completionBar, value && { backgroundColor: C.purple }]} />)}</View></View>
      {section('objective', 'compass-outline', text.objectiveSection, text.objectiveHelp, <>
        <ChoiceGroup options={objectiveOptions.map(value => ({ value, label: text[value] }))} label={text.objectiveSection} value={draft.objective} onChange={value => set('objective', value as GoalDraft['objective'])} s={s} C={C} disabled={saving} />
        {field('title', text.titleLabel, { placeholder: text.titlePlaceholder, hint: text.titleHelp, maxLength: 80 })}
        {field('description', text.descriptionLabel, { placeholder: text.descriptionPlaceholder, multiline: true, maxLength: 1000 })}
      </>, false)}
      {section('schedule', 'calendar-outline', text.scheduleSection, text.scheduleHelp, <>
        {field('startDate', text.startDate, { placeholder: 'YYYY-MM-DD', hint: text.dateHint, maxLength: 10 })}
        {field('durationWeeks', text.duration, { numeric: true, hint: text.durationHint, maxLength: 3 })}
        <Text style={s.label}>{text.frequency}</Text><Text style={s.hint}>{text.frequencyHelp}</Text>
        <ChoiceGroup options={Array.from({ length: 7 }, (_, index) => ({ value: String(index + 1), label: String(index + 1), a11y: `${index + 1} ${text.days}` }))} label={text.frequency} value={draft.weeklyFrequency} onChange={value => set('weeklyFrequency', value)} s={s} C={C} compact disabled={saving} />
        {error('weeklyFrequency') && <Text style={s.fieldError}>{error('weeklyFrequency')}</Text>}
        <Text style={s.label}>{text.focus}</Text><ChoiceGroup options={focusOptions.map(value => ({ value, label: text[value] }))} label={text.focus} value={draft.consistencyFocus} onChange={value => set('consistencyFocus', value as GoalDraft['consistencyFocus'])} s={s} C={C} disabled={saving} />
      </>, false)}
      {section('measures', 'body-outline', text.measuresSection, text.measuresHelp, <>
        {field('currentWeightKg', text.currentWeight, { numeric: true })}{field('targetWeightKg', text.targetWeight, { numeric: true })}{field('heightCm', text.height, { numeric: true })}
      </>)}
      {section('food', 'restaurant-outline', text.foodSection, text.foodHelp, <>
        <Text style={s.label}>{text.pattern}</Text><ChoiceGroup options={dietaryOptions.map(value => ({ value, label: text[value] }))} label={text.pattern} value={draft.dietaryPattern} onChange={value => set('dietaryPattern', value as GoalDraft['dietaryPattern'])} s={s} C={C} disabled={saving} />
        {field('preferredFoods', text.preferred, { placeholder: text.preferredPlaceholder, multiline: true, maxLength: 1000 })}{field('dislikedFoods', text.disliked, { placeholder: text.dislikedPlaceholder, multiline: true, maxLength: 1000 })}
        {field('allergies', text.allergies, { placeholder: text.allergiesPlaceholder, multiline: true, maxLength: 1000 })}{field('restrictions', text.restrictions, { placeholder: text.restrictionsPlaceholder, multiline: true, maxLength: 1000 })}
        {field('mealsPerDay', text.meals, { numeric: true, hint: text.mealsHint, maxLength: 2 })}
      </>)}
      {section('targets', 'options-outline', text.targetsSection, text.targetsHelp, <>
        <View style={s.guidance}><Icon name="information-circle-outline" size={18} color={C.purple} /><Text style={s.guidanceText}>{text.guidance}</Text></View>
        {field('caloriesKcal', text.calories, { numeric: true })}{field('proteinG', text.proteinTarget, { numeric: true })}{field('carbsG', text.carbs, { numeric: true })}{field('fatG', text.fat, { numeric: true })}{field('fiberG', text.fiber, { numeric: true })}{field('waterMl', text.water, { numeric: true })}
      </>)}
      {section('routine', 'heart-outline', text.routineSection, text.routineHelp, <>
        {field('dailyActivity', 'Atividade no dia a dia', { placeholder: 'Ex.: trabalho sentado ou em movimento' })}
        {field('exerciseDays', 'Dias de exercício por semana', { placeholder: 'Ex.: 3 dias' })}
        {field('exerciseDuration', 'Duração de cada treino', { placeholder: 'Ex.: 45 minutos' })}
        {field('exerciseIntensity', 'Intensidade dos exercícios', { placeholder: 'Ex.: leve, moderada ou intensa' })}
        {field('activityRoutine', text.activity, { placeholder: text.activityPlaceholder, multiline: true, maxLength: 1000 })}
        <View style={s.switchRow}><View style={s.flex}><Text style={s.label}>{text.professional}</Text><Text style={s.hint}>{text.professionalHelp}</Text></View><Switch accessibilityLabel={text.professional} accessibilityHint={text.professionalHelp} value={draft.professionalPlan} onValueChange={value => set('professionalPlan', value)} disabled={saving} trackColor={{ false: C.neutralSurface, true: C.purple }} thumbColor={isDark && draft.professionalPlan ? C.onAccent : '#FFFFFF'} /></View>
        {field('professionalNotes', text.professionalNotes, { placeholder: text.professionalPlaceholder, multiline: true, maxLength: 1000 })}
      </>)}
      {attempted && hasErrors && <View style={s.errorBox} accessibilityLiveRegion="polite"><Text style={s.errorText}>{text.invalid}</Text></View>}
      {saveError && <View style={s.errorBox} accessibilityLiveRegion="polite"><Text style={s.errorText}>{text.saveError}</Text></View>}
      <Pressable accessibilityRole="button" accessibilityLabel={text.save} accessibilityState={{ disabled: saving }} onPress={submit} disabled={saving} style={({ pressed }) => [s.saveButton, (pressed || saving) && s.pressed]}>{saving ? <ActivityIndicator color={C.onAccent} /> : <Icon name="checkmark" size={21} color={C.onAccent} />}<Text style={s.saveText}>{saving ? text.saving : text.save}</Text></Pressable>
      <Text style={s.footer}>{text.savedHelp}</Text>
    </>}
  </View>;
}

function FormField({ label, value, onChange, onBlur, error, hint, placeholder, numeric, multiline, maxLength, disabled, s, C }: {
  label: string; value: string; onChange: (value: string) => void; onBlur: () => void; error?: string; hint?: string; placeholder?: string;
  numeric?: boolean; multiline?: boolean; maxLength?: number; disabled?: boolean; s: FormStyles; C: Palette;
}) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} accessibilityHint={error || hint} aria-invalid={Boolean(error)}
    value={value} onChangeText={onChange} onBlur={onBlur} placeholder={placeholder ?? (numeric ? '—' : '')} placeholderTextColor={C.textFaint}
    keyboardType={numeric ? 'decimal-pad' : 'default'} inputMode={numeric ? 'decimal' : 'text'} multiline={multiline}
    maxLength={maxLength ?? (numeric ? 11 : 1000)} editable={!disabled} style={[s.input, multiline && s.multiline, Boolean(error) && s.inputError]} />
    {error ? <Text style={s.fieldError} accessibilityLiveRegion="polite">{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}</View>;
}

function ChoiceGroup({ options, label, value, onChange, compact, disabled, s, C }: {
  options: { value: string; label: string; a11y?: string }[]; label: string; value: string; onChange: (value: string) => void;
  compact?: boolean; disabled?: boolean; s: FormStyles; C: Palette;
}) {
  return <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[s.choices, compact && s.compactChoices]}>{options.map(option => <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={option.a11y ?? option.label}
    accessibilityState={{ checked: value === option.value, disabled }} aria-checked={value === option.value} onPress={() => onChange(option.value)} disabled={disabled}
    style={({ pressed }) => [s.choice, compact && s.compactChoice, value === option.value && s.choiceSelected, pressed && s.pressed]}>
    {!compact && <Icon name={value === option.value ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={value === option.value ? C.purple : C.muted} />}
    <Text style={[s.choiceText, value === option.value && s.choiceSelectedText, compact && { textAlign: 'center' }]}>{option.label}</Text>
  </Pressable>)}</View>;
}

function AccordionSection({ title, help, icon, optional, open, onToggle, children, s, C }: {
  title: string; help: string; icon: IconName; optional: string; open: boolean; onToggle: () => void; children: React.ReactNode; s: FormStyles; C: Palette;
}) {
  return <View style={s.card}><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} aria-expanded={open} onPress={onToggle} style={s.sectionButton}>
    <View style={s.sectionIcon}><Icon name={icon} size={22} color={C.purple} /></View><View style={s.flex}><Text style={s.sectionTitle}>{title}</Text><Text style={s.optionalText}>{optional}</Text></View><Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.muted} />
  </Pressable>{open && <View style={s.sectionContent}><Text style={s.sectionHelp}>{help}</Text>{children}</View>}</View>;
}

function createStyles(C: Palette, scale: number) {
  const f = (value: number) => value * scale;
  return StyleSheet.create({
    flex: { flex: 1, minWidth: 0 }, pressed: { opacity: 0.6 }, back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 10 }, backText: { fontSize: f(13), color: C.purple, fontWeight: '500' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }, title: { fontSize: f(32), lineHeight: f(40), fontWeight: '700', color: C.ink, letterSpacing: -1 }, intro: { color: C.muted, fontSize: f(12), lineHeight: f(20), marginTop: 6 }, headerIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: C.lilac, alignItems: 'center', justifyContent: 'center' },
    privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 17, borderRadius: 17, backgroundColor: C.lilac, marginBottom: 20 }, privacyTitle: { color: C.purpleDark, fontSize: f(12), fontWeight: '600', lineHeight: f(18) }, privacyText: { color: C.textSecondary, fontSize: f(11), lineHeight: f(19), marginTop: 5 },
    completion: { marginBottom: 24, paddingHorizontal: 3 }, sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, completionText: { color: C.textSecondary, fontSize: f(11), fontWeight: '500' }, completionBars: { flexDirection: 'row', gap: 5, marginTop: 10 }, completionBar: { flex: 1, height: 4, borderRadius: 3, backgroundColor: C.accentLine }, optionalText: { color: C.muted, fontSize: f(10), lineHeight: f(15), marginTop: 3 },
    card: { backgroundColor: C.surface, borderRadius: 21, marginBottom: 17, borderWidth: 1, borderColor: C.line, overflow: 'hidden' }, sectionButton: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 85, padding: 17 }, sectionIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: C.lilac, alignItems: 'center', justifyContent: 'center' }, sectionTitle: { color: C.ink, fontSize: f(14), lineHeight: f(21), fontWeight: '600' }, sectionContent: { paddingHorizontal: 18, paddingBottom: 18 }, sectionHelp: { color: C.muted, fontSize: f(12), lineHeight: f(20), marginBottom: 20 },
    field: { marginTop: 15 }, label: { color: C.ink, fontSize: f(12), lineHeight: f(19), fontWeight: '600', marginBottom: 7 }, input: { color: C.ink, fontSize: f(14), lineHeight: f(21), borderWidth: 1, borderColor: C.line, borderRadius: 12, backgroundColor: C.surfaceSubtle, paddingHorizontal: 13, paddingVertical: 12, minHeight: 48 }, multiline: { minHeight: 100, textAlignVertical: 'top' }, inputError: { borderColor: C.orange }, hint: { color: C.muted, fontSize: f(10.5), lineHeight: f(18), marginTop: 6 }, fieldError: { color: C.ink, fontWeight: '500', fontSize: f(11), lineHeight: f(18), marginTop: 6 },
    choices: { gap: 8, marginTop: 5, marginBottom: 12 }, choice: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.surfaceSubtle, minHeight: 47, paddingHorizontal: 12, paddingVertical: 11 }, choiceSelected: { borderColor: C.purple, backgroundColor: C.lilac }, choiceText: { flex: 1, color: C.textSecondary, fontSize: f(12), lineHeight: f(19) }, choiceSelectedText: { color: C.purpleDark, fontWeight: '500' }, compactChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 12, marginBottom: 22 }, compactChoice: { minWidth: 44, flexBasis: '22%', flexGrow: 1, maxWidth: '24%', paddingHorizontal: 3, minHeight: 44 },
    guidance: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, borderRadius: 12, backgroundColor: C.lilac, marginBottom: 4 }, guidanceText: { flex: 1, color: C.textSecondary, fontSize: f(11), lineHeight: f(19) }, switchRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 19, marginBottom: 5 },
    loading: { alignItems: 'center', paddingVertical: 48, gap: 10 }, errorBox: { padding: 16, borderRadius: 14, backgroundColor: C.lilac, marginBottom: 17 }, errorText: { color: C.ink, fontSize: f(12), lineHeight: f(20) }, retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 3, marginTop: 8 }, retryText: { color: C.purple, fontSize: f(12), fontWeight: '600' },
    saveButton: { minHeight: 52, backgroundColor: C.purple, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, marginTop: 5 }, saveText: { color: C.onAccent, fontSize: f(14), lineHeight: f(22), fontWeight: '600' }, footer: { color: C.muted, fontSize: f(10.5), lineHeight: f(18), textAlign: 'center', marginTop: 14, marginBottom: 20 },
  });
}
