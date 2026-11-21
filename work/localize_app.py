from pathlib import Path
import re, json

p=Path(r'C:\Users\Enzo Fraga\Documents\projeto app nutrição\apps\mobile\App.tsx')
x=p.read_text(encoding='utf-8')
x=x.replace("import React, { useRef, useState }", "import React, { useEffect, useRef, useState }")
x=x.replace('  Image, KeyboardAvoidingView', '  ActivityIndicator, Image, KeyboardAvoidingView')
x=x.replace('Avatar, colors as C, Icon', 'Avatar, Icon')
x=x.replace("import { styles as s } from './src/styles';", "import { useStyles } from './src/styles';\nimport { useAppTheme } from './src/theme';\nimport { PreferencesProvider, usePreferences } from './src/preferences';\nimport { useI18n } from './src/i18n';\nimport SettingsScreen from './src/SettingsScreen';")
x=x.replace('const navigation:', 'const baseNavigation:')
x=x.replace('export default function App() {', '''export default function App() {
  return <PreferencesProvider><AppContent /></PreferencesProvider>;
}

function AppContent() {
  const { preferences, ready } = usePreferences();
  const { t, locale } = useI18n();
  const { colors: C, isDark } = useAppTheme();
  const s = useStyles();
  const navigation = baseNavigation.map(item => ({ ...item, label: t(item.label) }));
  const [settingsOpen, setSettingsOpen] = useState(false);''')
x=x.replace("new Date().toLocaleDateString('pt-BR'", 'new Date().toLocaleDateString(locale')
x=x.replace("current.toLocaleDateString('pt-BR'", 'current.toLocaleDateString(locale')
x=x.replace('  function notify(message: string) {', '''  useEffect(() => {
    if (ready) setFilter(preferences.defaultFeed);
  }, [ready, preferences.defaultFeed]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function openSettings() {
    setTab('profile');
    setSettingsOpen(true);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function notify(message: string) {''')
x=x.replace('    setTab(next);', '    setTab(next);\n    setSettingsOpen(false);')

# Translate static labels, placeholder text, and direct text nodes in JSX.
def jsx_text(m):
    content=m.group(1)
    stripped=content.strip()
    if not stripped or stripped in ['.', '♡']:
        return m.group(0)
    return '>{t('+json.dumps(stripped, ensure_ascii=False)+')}<'
x=re.sub(r'>([^<>{}\n]+)<', jsx_text, x)
x=re.sub(r'(accessibilityLabel|label|placeholder)="([^"]+)"', lambda m:m.group(1)+'={t('+json.dumps(m.group(2),ensure_ascii=False)+')}',x)
x=re.sub(r"notify\('([^']+)'\)",lambda m:"notify(t('"+m.group(1)+"'))",x)

# Canonical data values remain language-independent; only their display is translated.
for value in ['goal','member.goal','meal.time','meal.category','meal.title','meal.goal','selectedMeal.goal','meal.author','item']:
    x=x.replace('{'+value+'}', '{t('+value+')}')
x=x.replace('{meal.caption}', "{meal.id.startsWith('local-') ? meal.caption : t(meal.caption)}")
x=x.replace('{selectedMeal.feedback ||', '{(selectedMeal.feedback && t(selectedMeal.feedback)) ||')
x=x.replace("'Sua refeição foi adicionada ao diário. Esta prévia ainda não analisa fotos automaticamente.'", "t('Sua refeição foi adicionada ao diário. Esta prévia ainda não analisa fotos automaticamente.')")
x=x.replace("caption: caption.trim() || 'Mais um registro no meu diário.'", "caption: caption.trim() || t('Mais um registro no meu diário.')")
x=x.replace("{member.mine ? 'Você' : member.name.split(' ')[0]}", "{member.mine ? t('Você') : member.name.split(' ')[0]}")
x=x.replace("{meal.feedback ? 'Um passo na direção da meta' : 'Registro adicionado ao diário'}", "{t(meal.feedback ? 'Um passo na direção da meta' : 'Registro adicionado ao diário')}")
x=x.replace("{selectedMeal.feedback ? 'Uma leitura do seu hábito' : 'Um espaço para registrar'}", "{t(selectedMeal.feedback ? 'Uma leitura do seu hábito' : 'Um espaço para registrar')}")
x=x.replace("{tab === 'home' ? 'Um novo dia para cuidar de você' : tab === 'diary' ? 'Seu caminho, refeição por refeição' : tab === 'groups' ? 'Cada pessoa com a própria meta' : 'O cuidado começa com você'}", "{t(tab === 'home' ? 'Um novo dia para cuidar de você' : tab === 'diary' ? 'Seu caminho, refeição por refeição' : tab === 'groups' ? 'Cada pessoa com a própria meta' : 'O cuidado começa com você')}")
x=x.replace("{sheet === 'compose' ? 'Uma nova refeição' : sheet === 'goal' ? 'Sua meta pessoal' : sheet === 'invite' ? 'Mais companhia à mesa' : sheet === 'saved' ? 'Suas inspirações' : 'Sobre este registro'}", "{t(sheet === 'compose' ? 'Uma nova refeição' : sheet === 'goal' ? 'Sua meta pessoal' : sheet === 'invite' ? 'Mais companhia à mesa' : sheet === 'saved' ? 'Suas inspirações' : 'Sobre este registro')}")
x=x.replace("{ '\\n' }", "{'\\n'}")
x=x.replace("O cuidado começa{'\\n'}nas pequenas escolhas.", "{t('O cuidado começa\\nnas pequenas escolhas.')}")
x=x.replace("Juntos na constância.{'\\n'}Cada um no seu caminho.", "{t('Juntos na constância.\\nCada um no seu caminho.')}")
x=x.replace("Seu prato não precisa{'\\n'}ser perfeito.", "{t('Seu prato não precisa\\nser perfeito.')}")
x=x.replace("Cada pessoa com sua meta.{'\\n'}Todo mundo com apoio.", "{t('Cada pessoa com sua meta.\\nTodo mundo com apoio.')}")
x=x.replace('Meta de {selectedMeal.author', "{t('Meta de {name}', { name: selectedMeal.mine ? 'Enzo' : selectedMeal.author.split(' ')[0] })}{false && selectedMeal.author")
# Remove old suffix remaining after replacing the mixed text expression.
x=x.replace("{false && selectedMeal.author === 'Você' ? 'Enzo' : selectedMeal.author.split(' ')[0]}", '')
x=x.replace("{meals.filter(m => m.mine).length} {meals.filter(m => m.mine).length === 1 ? 'refeição' : 'refeições'}", "{t(meals.filter(m => m.mine).length === 1 ? '{count} refeição' : '{count} refeições', { count: meals.filter(m => m.mine).length })}")
x=x.replace("detail={`${saved.length} ${saved.length === 1 ? 'refeição' : 'refeições'}`}", "detail={t(saved.length === 1 ? '{count} refeição' : '{count} refeições', { count: saved.length })}")
x=x.replace('{meal.likes + (isLiked ? 1 : 0)} apoios', "{t('{count} apoios', { count: meal.likes + (isLiked ? 1 : 0) })}")
x=x.replace('accessibilityLabel={`Ver relação com a meta de ${meal.author}`}', "accessibilityLabel={t('Ver relação com a meta de {name}', { name: t(meal.author) })}")
x=x.replace("accessibilityLabel={`${isLiked ? 'Remover apoio' : 'Apoiar refeição'} de ${meal.author}`}", "accessibilityLabel={t(isLiked ? 'Remover apoio de {name}' : 'Apoiar refeição de {name}', { name: t(meal.author) })}")
x=x.replace("accessibilityLabel={`${isSaved ? 'Remover dos salvos' : 'Salvar refeição'}: ${meal.title}`}", "accessibilityLabel={t(isSaved ? 'Remover dos salvos: {title}' : 'Salvar refeição: {title}', { title: t(meal.title) })}")
x=x.replace('accessibilityLabel={`Escolher ${p.label}`}', "accessibilityLabel={t('Escolher {title}', { title: t(p.label) })}")
x=x.replace('label={`Remover ${meal.title} dos salvos`}', "label={t('Remover {title} dos salvos', { title: t(meal.title) })}")
x=x.replace('accessibilityLabel={meal.title}', 'accessibilityLabel={t(meal.title)}')
x=x.replace('title="Minha meta" detail={goal}', 'title={t("Minha meta")} detail={t(goal)}')
x=x.replace('title="Refeições salvas"', 'title={t("Refeições salvas")}')
x=x.replace('title="Meu grupo" detail="Grupo Raiz"', 'title={t("Meu grupo")} detail={t("Grupo Raiz")}')

# Theme-sensitive inline colors use semantic tokens from the shared theme.
colors={"'#B48A4E'":'C.orange',"'#E4E2E9'":'C.neutralSurface',"'#CB7E94'":'C.like',"'#908B9B'":'C.inactiveIcon',"'#B66980'":'C.like',"'#96909F'":'C.inactiveIcon',"'#9C97A6'":'C.inactiveIcon',"'#CFCAD8'":'C.inactiveIcon',"'#B1AABA'":'C.inactiveIcon'}
for old,new in colors.items():x=x.replace(old,new)
x=x.replace('color={C.white}', 'color={C.onAccent}')
x=x.replace('color="white"', 'color={C.onAccent}')
x=x.replace('placeholderTextColor="#A29AAE"', 'placeholderTextColor={C.textFaint}')
x=x.replace('<StatusBar barStyle="dark-content"', '<StatusBar barStyle={isDark ? "light-content" : "dark-content"}')
x=x.replace('<BlurView intensity={85} tint="light"', '<BlurView intensity={preferences.reduceMotion ? 0 : 85} tint={isDark ? "dark" : "light"}')
x=x.replace('animationType="slide"', 'animationType={preferences.reduceMotion ? "none" : "slide"}')
x=x.replace('        <Pressable accessibilityRole="button" accessibilityLabel=', '        <Pressable accessibilityRole="button" accessibilityLabel=',1)
feedback_start='        <Pressable accessibilityRole="button" accessibilityLabel={t(\'Ver relação com a meta de {name}\''
x=x.replace(feedback_start,'        {preferences.showFeedback && <Pressable accessibilityRole="button" accessibilityLabel={t(\'Ver relação com a meta de {name}\'')
x=x.replace('        </Pressable>\n        <View style={s.mealActions}>','        </Pressable>}\n        <View style={s.mealActions}>')

# Settings are a profile subsection, available both in the sidebar and the header.
x=x.replace('      <View style={s.headerActions}>','      <View style={s.headerActions}>')
avatar='<Pressable onPress={() => changeTab(\'profile\')} accessibilityRole="button" accessibilityLabel={t("Abrir perfil de Enzo")}><Avatar initials="EF" size={44} /></Pressable>'
x=x.replace(avatar, '<IconButton name="settings-outline" label={t("Abrir configurações")} onPress={openSettings} />')
x=x.replace('        </Pressable>)}</View>\n        <Pressable accessibilityRole="button" onPress={compose}', '        </Pressable>)}</View>\n        <Pressable accessibilityRole="button" accessibilityLabel={t("Abrir configurações")} onPress={openSettings} style={[s.sideNavItem, settingsOpen && s.sideNavActive, { marginTop: 9 }]}><Icon name="settings-outline" size={21} color={settingsOpen ? C.purple : C.inactiveIcon} /><Text style={[s.sideNavText, settingsOpen && s.sideNavTextActive]}>{t("Configurações")}</Text></Pressable>\n        <Pressable accessibilityRole="button" onPress={compose}')
x=x.replace('              <View style={s.header}>','              {settingsOpen ? <SettingsScreen onBack={() => setSettingsOpen(false)} /> : <>\n              <View style={s.header}>',1)
x=x.replace("              </>}\n            </View>\n            {wide &&", "              </>}\n              </>}\n            </View>\n            {wide && !settingsOpen &&",1)
x=x.replace('onPress={() => changeTab(\'groups\')} last />', 'onPress={() => changeTab(\'groups\')} />\n                  <SettingsRow icon="settings-outline" title={t("Configurações")} detail={t("Personalize sua experiência")} onPress={openSettings} last />')
x=x.replace('  return <SafeAreaView style={s.safe}>', '  if (!ready) return <SafeAreaView style={[s.safe, { alignItems: \'center\', justifyContent: \'center\' }]}><ActivityIndicator color={C.purple} accessibilityLabel={t("Carregando suas preferências")} /></SafeAreaView>;\n\n  return <SafeAreaView style={s.safe}>',1)
x=x.replace('function SettingsRow({ icon, title, detail, onPress, last = false }: { icon: IconName; title: string; detail: string; onPress: () => void; last?: boolean }) {', 'function SettingsRow({ icon, title, detail, onPress, last = false }: { icon: IconName; title: string; detail: string; onPress: () => void; last?: boolean }) {\n  const s = useStyles();\n  const { colors: C } = useAppTheme();')
x=x.replace('<Pressable accessibilityRole="button" onPress={onPress} style=', '<Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style=')
p.write_text(x,encoding='utf-8')
