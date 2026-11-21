import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Preferences, usePreferences } from './preferences';
import { useAppTheme } from './theme';
import type { Palette } from './theme';
import { Icon, IconName } from './ui';

const text = {
  back: 'Voltar', title: 'Configurações', intro: 'Ajuste a aparência, a leitura e a tela inicial.',
  appearance: 'APARÊNCIA', theme: 'Tema do app', themeHelp: 'No modo Sistema, o tema acompanha o dispositivo.',
  light: 'Claro', dark: 'Escuro', system: 'Sistema',
  experience: 'SUA EXPERIÊNCIA', startFeed: 'Tela inicial', group: 'Meu grupo', mine: 'Meu diário',
  startFeedHelp: 'Na próxima vez que entrar, suas refeições abrirão nesta tela.',
  compact: 'Feed compacto', compactHelp: 'Fotos menores para ver mais refeições de uma vez.',
  feedback: 'Feedback nas refeições', feedbackHelp: 'Mostra como o prato se relaciona com a meta pessoal.',
  accessibility: 'CONFORTO E ACESSIBILIDADE', textSize: 'Tamanho do texto', normal: 'Padrão', large: 'Maior',
  textHelp: 'Escolha o tamanho mais confortável para leitura.',
  motion: 'Reduzir animações', motionHelp: 'Abre e fecha janelas sem a animação de deslizar.',
  saved: 'Preferências salvas neste dispositivo', saving: 'Salvando suas preferências…',
  saveError: 'Não foi possível salvar. Suas escolhas estão ativas nesta sessão.',
  loadError: 'Não foi possível carregar suas preferências. Usando as opções padrão.',
  retry: 'Tentar salvar novamente', local: 'Suas preferências ficam neste dispositivo. Você pode mudar tudo de novo quando quiser.',
  reset: 'Restaurar preferências', resetTitle: 'Voltar ao padrão?',
  resetHelp: 'O app voltará ao tema do sistema, ao tamanho de texto padrão e às demais preferências iniciais.',
  cancel: 'Cancelar', confirm: 'Restaurar', selected: 'Selecionado',
};
export default function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { preferences, updatePreferences, resetPreferences, saving, storageError, retrySave } = usePreferences();
  const { colors: C, isDark } = useAppTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const scale = preferences.textSize === 'large' ? 1.18 : 1;
  const s = useMemo(() => createStyles(C, scale), [C, scale]);
  const themes: { value: Preferences['theme']; label: string; icon: IconName }[] = [
    { value: 'light', label: text.light, icon: 'sunny-outline' },
    { value: 'dark', label: text.dark, icon: 'moon-outline' },
    { value: 'system', label: text.system, icon: 'phone-portrait-outline' },
  ];

  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={text.back} onPress={onBack} style={({ pressed }) => [s.back, pressed && s.pressed]}>
      <Icon name="chevron-back" size={19} color={C.purple} /><Text style={s.backText}>{text.back}</Text>
    </Pressable>
    <View style={s.header}><View style={s.flex}><Text style={s.title}>{text.title}<Text style={{ color: C.purple }}>.</Text></Text><Text style={s.intro}>{text.intro}</Text></View><View style={s.headerIcon}><Icon name="options-outline" size={24} color={C.purple} /></View></View>
    <View style={[s.saveStatus, storageError && s.saveStatusError]} accessibilityLiveRegion="polite">
      <Icon name={storageError ? 'alert-circle-outline' : saving ? 'time-outline' : 'checkmark-circle-outline'} size={17} color={storageError ? C.orange : C.green} />
      <Text style={s.saveStatusText}>{storageError === 'load' ? text.loadError : storageError ? text.saveError : saving ? text.saving : text.saved}</Text>
    </View>
    {storageError === 'save' && <Pressable accessibilityRole="button" onPress={retrySave} style={s.retry}><Text style={s.retryText}>{text.retry}</Text></Pressable>}

    <SectionTitle s={s}>{text.appearance}</SectionTitle>
    <View style={s.card}>
      <View style={s.cardHeading}><View style={s.rowIcon}><Icon name="color-palette-outline" size={21} color={C.purple} /></View><View style={s.flex}><Text style={s.rowTitle}>{text.theme}</Text><Text style={s.rowDescription}>{text.themeHelp}</Text></View></View>
      <View style={s.themeOptions} accessibilityRole="radiogroup" accessibilityLabel={text.theme}>
        {themes.map(theme => <Pressable key={theme.value} accessibilityRole="radio" accessibilityLabel={theme.label}
          accessibilityState={{ checked: preferences.theme === theme.value }} aria-checked={preferences.theme === theme.value} onPress={() => updatePreferences({ theme: theme.value })}
          style={({ pressed }) => [s.themeOption, preferences.theme === theme.value && s.themeSelected, pressed && s.pressed]}>
          <View style={[s.miniScreen, { backgroundColor: theme.value === 'dark' ? '#17151D' : '#F4F2F8' }]}>
            {theme.value === 'system' && <View style={s.miniHalf} />}
            <View style={[s.miniHeading, { backgroundColor: theme.value === 'dark' ? '#4B425F' : '#D9CCE9' }]} />
            <View style={[s.miniCard, { backgroundColor: theme.value === 'dark' ? '#2D2836' : '#FFFFFF' }]}><View style={s.miniPhoto} /><View style={s.miniLine} /></View>
            <View style={[s.miniNav, { backgroundColor: theme.value === 'dark' ? '#302A39' : '#FFFFFF' }]} />
          </View>
          <View style={s.themeLabelRow}><Icon name={theme.icon} size={14} color={preferences.theme === theme.value ? C.purple : C.muted} /><Text style={[s.themeLabel, preferences.theme === theme.value && { color: C.purple }]}>{theme.label}</Text></View>
          <View style={s.themeCheck}>{preferences.theme === theme.value && <Icon name="checkmark-circle" size={18} color={C.purple} />}</View>
        </Pressable>)}
      </View>

    </View>

    <SectionTitle s={s}>{text.experience}</SectionTitle>
    <View style={s.card}>
      <View style={s.cardHeading}><View style={s.rowIcon}><Icon name="grid-outline" size={21} color={C.purple} /></View><View style={s.flex}><Text style={s.rowTitle}>{text.startFeed}</Text><Text style={s.rowDescription}>{text.startFeedHelp}</Text></View></View>
      <Options s={s} label={text.startFeed} value={preferences.defaultFeed} items={[{ value: 'group', label: text.group }, { value: 'mine', label: text.mine }]} onChange={value => updatePreferences({ defaultFeed: value })} />
      <View style={s.divider} />
      <ToggleRow s={s} C={C} isDark={isDark} icon="albums-outline" title={text.compact} description={text.compactHelp} value={preferences.compactFeed} onChange={compactFeed => updatePreferences({ compactFeed })} />
      <ToggleRow s={s} C={C} isDark={isDark} icon="sparkles-outline" title={text.feedback} description={text.feedbackHelp} value={preferences.showFeedback} onChange={showFeedback => updatePreferences({ showFeedback })} last />
    </View>

    <SectionTitle s={s}>{text.accessibility}</SectionTitle>
    <View style={s.card}>
      <View style={s.cardHeading}><View style={s.rowIcon}><Icon name="text-outline" size={21} color={C.purple} /></View><View style={s.flex}><Text style={s.rowTitle}>{text.textSize}</Text><Text style={s.rowDescription}>{text.textHelp}</Text></View></View>
      <Options s={s} label={text.textSize} value={preferences.textSize} items={[{ value: 'default', label: text.normal }, { value: 'large', label: text.large }]} onChange={textSize => updatePreferences({ textSize })} />
      <View style={s.divider} />
      <ToggleRow s={s} C={C} isDark={isDark} icon="accessibility-outline" title={text.motion} description={text.motionHelp} value={preferences.reduceMotion} onChange={reduceMotion => updatePreferences({ reduceMotion })} last />
    </View>

    <View style={s.localNote}><Icon name="lock-closed-outline" size={16} color={C.muted} /><Text style={s.localNoteText}>{text.local}</Text></View>
    {confirmReset ? <View style={s.resetCard}>
      <Text style={s.rowTitle}>{text.resetTitle}</Text><Text style={s.rowDescription}>{text.resetHelp}</Text>
      <View style={s.resetActions}><Pressable accessibilityRole="button" onPress={() => setConfirmReset(false)} style={s.cancelButton}><Text style={s.cancelText}>{text.cancel}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => { resetPreferences(); setConfirmReset(false); }} style={s.confirmButton}><Text style={s.confirmText}>{text.confirm}</Text></Pressable></View>
    </View> : <Pressable accessibilityRole="button" onPress={() => setConfirmReset(true)} style={({ pressed }) => [s.resetButton, pressed && s.pressed]}><Icon name="refresh-outline" size={17} color={C.purple} /><Text style={s.resetText}>{text.reset}</Text></Pressable>}
  </View>;
}

type SettingsStyles = ReturnType<typeof createStyles>;

function SectionTitle({ children, s }: { children: string; s: SettingsStyles }) {
  return <Text accessibilityRole="header" style={s.sectionLabel}>{children}</Text>;
}

function ToggleRow({ icon, title, description, value, onChange, last = false, s, C, isDark }: {
  icon: IconName; title: string; description: string; value: boolean; onChange: (value: boolean) => void;
  last?: boolean; s: SettingsStyles; C: Palette; isDark: boolean;
}) {
  return <View style={[s.toggleRow, !last && s.rowBorder]}>
    <Pressable accessible={false} focusable={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden onPress={() => onChange(!value)} style={({ pressed }) => [s.toggleLabel, pressed && s.pressed]}>
      <View style={s.rowIcon}><Icon name={icon} size={21} color={C.purple} /></View>
      <View style={s.flex}><Text style={s.rowTitle}>{title}</Text><Text style={s.rowDescription}>{description}</Text></View>
    </Pressable>
    <Switch accessibilityLabel={title} accessibilityHint={description} value={value} onValueChange={onChange}
      trackColor={{ false: isDark ? '#45404E' : '#DCD7E4', true: C.purple }}
      thumbColor={isDark && value ? '#211C2D' : '#FFFFFF'} ios_backgroundColor={isDark ? '#45404E' : '#DCD7E4'} />
  </View>;
}

function Options<T extends string>({ items, value, onChange, label, s }: {
  items: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string; s: SettingsStyles;
}) {
  return <View style={s.options} accessibilityRole="radiogroup" accessibilityLabel={label}>
    {items.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityLabel={item.label}
      accessibilityState={{ checked: item.value === value }} aria-checked={item.value === value} onPress={() => onChange(item.value)}
      style={({ pressed }) => [s.option, value === item.value && s.optionSelected, pressed && s.pressed]}>
      <Text style={[s.optionText, value === item.value && s.optionSelectedText]}>{item.label}</Text>
    </Pressable>)}
  </View>;
}

function createStyles(C: Palette, scale: number) {
  const font = (size: number) => size * scale;
  return StyleSheet.create({
    flex: { flex: 1, minWidth: 0 }, pressed: { opacity: 0.6 },
    back: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 44, alignSelf: 'flex-start', marginBottom: 10 },
    backText: { fontSize: font(13), fontWeight: '500', color: C.purple },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    title: { color: C.ink, fontSize: font(30), lineHeight: font(38), fontWeight: '700', letterSpacing: -1 },
    intro: { color: C.muted, fontSize: font(12), lineHeight: font(19), marginTop: 7 },
    headerIcon: { width: 47, height: 47, backgroundColor: C.lilac, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
    saveStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: C.greenLight, borderRadius: 12, marginBottom: 28 },
    saveStatusError: { backgroundColor: C.lilac },
    saveStatusText: { flex: 1, color: C.ink, fontSize: font(10.5), lineHeight: font(17) },
    retry: { minHeight: 44, justifyContent: 'center', marginTop: -20, marginBottom: 15, alignSelf: 'flex-start', paddingHorizontal: 12 },
    retryText: { color: C.purple, fontWeight: '600', fontSize: font(12) },
    sectionLabel: { color: C.muted, fontSize: font(10), letterSpacing: 1.2, fontWeight: '600', marginBottom: 12, marginLeft: 5 },
    card: { backgroundColor: C.white, borderRadius: 22, padding: 18, marginBottom: 27, borderWidth: 1, borderColor: C.line },
    cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 16 },
    rowIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: C.lilac, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { color: C.ink, fontSize: font(13), lineHeight: font(19), fontWeight: '600' },
    rowDescription: { color: C.muted, fontSize: font(11), lineHeight: font(18), marginTop: 5 },
    themeOptions: { flexDirection: 'row', gap: 9 },
    themeOption: { flex: 1, minWidth: 0, borderWidth: 1.5, borderColor: C.line, borderRadius: 15, padding: 7, paddingBottom: 10 },
    themeSelected: { borderColor: C.purple, backgroundColor: C.lilac },
    miniScreen: { height: 87, borderRadius: 8, padding: 9, overflow: 'hidden' },
    miniHalf: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', backgroundColor: '#211C2B' },
    miniHeading: { width: '56%', height: 5, borderRadius: 3, marginBottom: 8 },
    miniCard: { borderRadius: 5, padding: 5, marginBottom: 7 },
    miniPhoto: { backgroundColor: '#B2A0C8', borderRadius: 2, height: 19, opacity: 0.65 },
    miniLine: { backgroundColor: '#B9A9CF', height: 3, width: '65%', marginTop: 5, borderRadius: 2 },
    miniNav: { height: 8, borderRadius: 4, marginHorizontal: 3 },
    themeLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10, flexWrap: 'wrap' },
    themeLabel: { fontSize: font(11), color: C.muted, fontWeight: '600', lineHeight: font(17) },
    themeCheck: { height: 20, marginTop: 5, alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, backgroundColor: C.line, marginVertical: 20 },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: C.line },
    options: { flexDirection: 'row', padding: 4, borderRadius: 12, backgroundColor: C.bg, gap: 4 },
    option: { flex: 1, minHeight: 44, paddingVertical: 10, paddingHorizontal: 7, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    optionSelected: { backgroundColor: C.lilac },
    optionText: { fontSize: font(11), lineHeight: font(17), color: C.muted, textAlign: 'center' },
    optionSelectedText: { color: C.purple, fontWeight: '600' },
    toggleRow: { flexDirection: 'row', gap: 11, alignItems: 'center' },
    toggleLabel: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 18 },
    localNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingHorizontal: 8, marginBottom: 16 },
    localNoteText: { flex: 1, color: C.muted, fontSize: font(11), lineHeight: font(18) },
    resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 50, borderRadius: 14, marginBottom: 5 },
    resetText: { color: C.purple, fontSize: font(12), fontWeight: '500' },
    resetCard: { borderWidth: 1, borderColor: C.line, padding: 18, borderRadius: 18, backgroundColor: C.white },
    resetActions: { flexDirection: 'row', gap: 10, marginTop: 15 },
    cancelButton: { minHeight: 44, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.lilac, borderRadius: 11 },
    cancelText: { color: C.purple, fontWeight: '600', fontSize: font(12) },
    confirmButton: { minHeight: 44, flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.purple, borderRadius: 11 },
    confirmText: { color: C.onAccent, fontWeight: '600', fontSize: font(12) },
  });
}
