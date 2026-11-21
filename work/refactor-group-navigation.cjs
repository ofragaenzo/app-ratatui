const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '../apps/mobile/App.tsx');
let source = fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n');
const diaryStart = source.indexOf("              {tab === 'diary'");
const groupsStart = source.indexOf("              {tab === 'groups'");
const profileStart = source.indexOf("              {tab === 'profile'");
const profileEnd = source.indexOf('\n              </>}\n            </View>', profileStart);
const mainStart = source.indexOf('\n  return <SafeAreaView style={s.safe}>');
const modalStart = source.indexOf('\n    <Modal visible={sheet !== null}');
if ([diaryStart, groupsStart, profileStart, profileEnd, mainStart, modalStart].some(v => v < 0)) throw new Error('Expected App structure not found');
const diary = source.slice(diaryStart, groupsStart);
const profile = source.slice(profileStart, profileEnd);
const groups = String.raw`
              {tab === 'groups' && <>
                <View style={[s.sectionRow, { marginBottom: 20 }]}><View style={s.flex}><Text style={s.sectionTitle}>{t('Seus grupos')}</Text><Text style={s.sectionSubtitle}>{t('Escolha um grupo para ver refeições, detalhes, ranking e conversa.')}</Text></View><IconButton name="add" label={t('Criar grupo')} onPress={openCreateGroup} active /></View>
                {availableGroups.map(group => <Pressable key={group.id} accessibilityRole="button" accessibilityLabel={t('Abrir grupo: {name}', { name: group.name })} onPress={() => openGroup(group.id)} style={({ pressed }) => [s.panel, { borderWidth: 1, borderColor: group.id === activeGroupId ? C.accentLine : C.line }, pressed && s.pressed]}>
                  <View style={s.sectionRow}><View style={[s.groupHeroIcon, { width: 48, height: 48, marginBottom: 0, borderRadius: 16 }]}><Icon name={group.id === 'raiz' ? 'leaf-outline' : 'people-outline'} size={24} color={C.purple} /></View><View style={s.flex}><Text style={[s.panelTitle, { fontSize: 17 }]}>{group.name}</Text><Text style={s.meta}>{t(group.id === 'raiz' ? '4 pessoas · grupo privado' : '1 pessoa · grupo privado')}</Text></View><Icon name="chevron-forward" size={19} color={C.purple} /></View>
                  <Text style={[s.caption, { marginTop: 14 }]}>{group.description}</Text>
                  <View style={[s.inline, { borderTopWidth: 1, borderTopColor: C.line, marginTop: 16, paddingTop: 13 }]}><Icon name="enter-outline" size={17} color={C.purple} /><Text style={[s.secondaryText, { flex: 1 }]}>{t('Abrir grupo')}</Text>{group.id === activeGroupId && <Text style={s.smallPurple}>{t('Grupo selecionado')}</Text>}</View>
                </Pressable>)}
              </>}
`;

const main = String.raw`
  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={C.bg} />
    <View style={s.app}>
      {desktop && <View style={[s.sidebar, { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 }]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={[s.brand, { marginBottom: 22 }]}><View style={s.brandMark}><Icon name="leaf" size={23} color={C.onAccent} /></View><View><Text style={s.brandName}>{t('prato a prato')}<Text style={{ color: C.purple }}>.</Text></Text><Text style={s.brandSub}>{t('crescer juntos, no seu ritmo')}</Text></View></View>
          <View style={[s.inline, { justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 20 }]}><Text style={s.meta}>{points} {t('pontos')}</Text><View style={s.inline}><Icon name="flame" size={14} color={C.orange} /><Text style={s.meta}>{t('5 dias de sequência')}</Text></View></View>
          <Text style={[s.listHeading, { marginLeft: 12 }]}>{t('SEU ESPAÇO')}</Text>
          <View style={s.sideNavigation}>{navigation.map(item => {
            const selected = tab === item.id && !settingsOpen && !goalOpen;
            return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected }} aria-pressed={selected} onPress={() => changeTab(item.id)} style={({ pressed }) => [s.sideNavItem, selected && s.sideNavActive, pressed && s.pressed]}><Icon name={selected ? item.selected : item.icon} size={21} color={selected ? C.purple : C.inactiveIcon} /><Text style={[s.sideNavText, selected && s.sideNavTextActive]}>{item.label}</Text></Pressable>;
          })}</View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('Minha meta pessoal')} onPress={openDetailedGoal} style={[s.sideNavItem, goalOpen && s.sideNavActive, { marginTop: 9 }]}><Icon name="flag-outline" size={21} color={goalOpen ? C.purple : C.inactiveIcon} /><Text style={[s.sideNavText, goalOpen && s.sideNavTextActive, { flex: 1 }]}>{t('Minha meta pessoal')}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('Abrir configurações')} onPress={openSettings} style={[s.sideNavItem, settingsOpen && s.sideNavActive, { marginTop: 4 }]}><Icon name="settings-outline" size={21} color={settingsOpen ? C.purple : C.inactiveIcon} /><Text style={[s.sideNavText, settingsOpen && s.sideNavTextActive]}>{t('Configurações')}</Text></Pressable>
          <View style={{ marginTop: 28 }}><Text style={[s.listHeading, { marginLeft: 12 }]}>{t('MEUS GRUPOS')}</Text>
            {availableGroups.map(group => { const selected = groupView && group.id === activeGroupId; return <Pressable key={group.id} accessibilityRole="button" accessibilityLabel={t('Abrir grupo: {name}', { name: group.name })} aria-current={selected ? 'page' : undefined} onPress={() => openGroup(group.id)} style={[s.sideNavItem, selected && s.sideNavActive, { marginBottom: 6 }]}><Icon name={group.id === 'raiz' ? 'leaf-outline' : 'people-outline'} size={20} color={selected ? C.purple : C.inactiveIcon} /><Text numberOfLines={2} style={[s.sideNavText, { flex: 1 }, selected && s.sideNavTextActive]}>{group.name}</Text></Pressable>; })}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('Criar grupo')} onPress={openCreateGroup} style={[s.sideNavItem, { marginTop: 6 }]}><Icon name="add-circle-outline" size={21} color={C.purple} /><Text style={[s.sideNavText, { color: C.purple }]}>{t('Criar grupo')}</Text></Pressable>
          <View style={s.sidebarBottom}><Pressable onPress={() => changeTab('profile')} accessibilityRole="button" accessibilityLabel={t('Gerenciar meu perfil')} style={s.sideProfile}><Avatar initials="EF" size={39} /><View style={s.flex}><Text style={s.author}>Enzo Fraga</Text><Text style={s.meta}>{t('Gerenciar perfil')}</Text></View><Icon name="chevron-forward" size={16} color={C.muted} /></Pressable></View>
        </ScrollView>
      </View>}
      <View style={s.workspace}>
        <View style={[{ flex: 1 }, !groupView && { display: 'none' }]}>
          <GroupWorkspace group={activeGroup} meals={meals.filter(meal => (meal.groupId ?? 'raiz') === activeGroupId)} renderMeal={meal => <MealCard key={meal.id} meal={meal} />} goal={goal} points={points} onOpenMenu={() => setDrawerOpen(true)} onCompose={compose} onInvite={inviteActiveGroup} onBackToGroups={() => changeTab('groups')} feedRevision={groupFeedRevision} />
        </View>
        {!groupView && <ScrollView ref={scrollRef} contentContainerStyle={[s.scroll, !desktop && { paddingTop: 17, paddingBottom: 36 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          <View style={[s.contentLayout, { paddingHorizontal: width < 370 ? 16 : 22 }, desktop && s.desktopContent]}>
            <View style={[s.mainColumn, { maxWidth: 740 }]}>
              {(settingsOpen || goalOpen) && !desktop && <View style={[s.inline, { marginBottom: 4 }]}><IconButton name="menu-outline" label={t('Abrir menu lateral')} onPress={() => setDrawerOpen(true)} /><Text style={s.meta}>{t('Meu espaço')}</Text></View>}
              {settingsOpen ? <SettingsScreen onBack={() => changeTab('profile')} /> : goalOpen ? <DetailedGoalScreen onBack={() => changeTab('profile')} onSave={(title: string) => { setGoal(title); changeTab('profile'); notify(t('Sua meta pessoal foi salva.')); }} /> : <>
                <View style={s.header}>{!desktop && <IconButton name="menu-outline" label={t('Abrir menu lateral')} onPress={() => setDrawerOpen(true)} />}<View style={s.flex}><Text style={s.greeting}>{t(tab === 'diary' ? 'Seu caminho, refeição por refeição' : tab === 'groups' ? 'Cada pessoa com a própria meta' : 'O cuidado começa com você')}</Text><Text style={s.pageTitle}>{navigation.find(item => item.id === tab)?.label}<Text style={s.titleDot}>.</Text></Text></View></View>
                ${diary}
                ${groups}
                ${profile}
              </>}
            </View>
          </View>
        </ScrollView>}
        {!!toast && <View pointerEvents="none" style={[s.toastWrap, { bottom: groupView ? 110 : 28 }]}><View style={s.toast} accessibilityLiveRegion="polite"><Icon name="checkmark-circle" size={18} color={C.green} /><Text style={s.toastText}>{toast}</Text></View></View>}
      </View>
    </View>
    <NavigationDrawer visible={drawerOpen && !desktop} onClose={() => setDrawerOpen(false)} onNavigate={changeTab} onOpenGoal={openDetailedGoal} onOpenSettings={openSettings} onCreateGroup={openCreateGroup} currentTab={tab} settingsOpen={settingsOpen} goalOpen={goalOpen} points={points} goal={goal} groups={createdGroups} activeGroupId={activeGroupId} onSelectGroup={openGroup} />
`;

source = source.slice(0, mainStart) + main + source.slice(modalStart);
source = source.replace("import { BlurView } from 'expo-blur';", "import GroupWorkspace from './src/GroupWorkspace';");
source = source.replace("  { id: 'home', label: 'Hoje', icon: 'grid-outline', selected: 'grid' },\n", '');
source = source.replace("{ id: 'groups', label: 'Grupos'", "{ id: 'groups', label: 'Meus grupos'");
source = source.replace("const { width, height } = useWindowDimensions();", "const { width } = useWindowDimensions();");
source = source.replace("  const wide = width >= 1300;\n", '');
source = source.replace("  const [filter, setFilter] = useState<'group' | 'mine'>('group');", "  const [activeGroupId, setActiveGroupId] = useState('raiz');\n  const [groupFeedRevision, setGroupFeedRevision] = useState(0);");
source = source.replace(/  const date = new Date\(\)\.toLocaleDateString\(locale, \{ weekday: 'long', day: 'numeric', month: 'long' \}\);\n/, '');
source = source.replace(/  useEffect\(\(\) => \{\n    if \(ready\) setFilter\(preferences.defaultFeed\);\n  \}, \[ready, preferences.defaultFeed\]\);\n/, '');
source = source.replace("  const filtered = filter === 'mine' ? meals.filter(m => m.mine) : meals;", String.raw`  const availableGroups = [
    { id: 'raiz', name: t('Grupo Raiz'), description: t('Juntos na constância. Cada um no seu caminho.'), isDemo: true },
    ...createdGroups.map(group => ({ ...group, isDemo: true })),
  ];
  const activeGroup = availableGroups.find(group => group.id === activeGroupId) ?? availableGroups[0];
  const groupView = tab === 'home' && !settingsOpen && !goalOpen;`);
source = source.replace("    setCreatedGroups(previous => [...previous, { id: `group-${Date.now()}`, name, description: groupDescription.trim() }]);\n    setSheet(null);\n    changeTab('groups');", "    const id = `group-${Date.now()}`;\n    setCreatedGroups(previous => [...previous, { id, name, description: groupDescription.trim() }]);\n    setSheet(null);\n    openGroup(id);");
source = source.replace("  function compose() { setSheet('compose'); }", String.raw`  function openGroup(id: string) {
    setActiveGroupId(id);
    changeTab('home');
  }
  function inviteActiveGroup() {
    if (activeGroupId === 'raiz') setSheet('invite');
    else notify(t('Os convites ainda não estão disponíveis nesta prévia.'));
  }
  function compose() { setSheet('compose'); }`);
source = source.replace('image: photos[photo].image, goal, likes: 0,', 'image: photos[photo].image, goal, likes: 0, groupId: activeGroupId,');
source = source.replace("setSheet(null); setCaption(''); changeTab('home'); setFilter('group');", "setSheet(null); setCaption(''); changeTab('home'); setGroupFeedRevision(value => value + 1);");
source = source.replace('{t("Raiz")}</Text></View>', "{availableGroups.find(group => group.id === (meal.groupId ?? 'raiz'))?.name ?? t('Grupo Raiz')}</Text></View>");
source = source.replace('{t("Compartilhar com")}{\' \'}<Text style={{ color: C.ink }}>{t("Grupo Raiz")}</Text>', '{t("Compartilhar com")}{\' \'}<Text style={{ color: C.ink }}>{activeGroup.name}</Text>');
// Ranking moved into the group workspace; the directory is now only a directory.
const rankingStart = source.indexOf('  function Ranking(');
const mealStart = source.indexOf('  function MealCard(', rankingStart);
if (rankingStart < 0 || mealStart < 0) throw new Error('Ranking boundaries missing');
source = source.slice(0, rankingStart) + source.slice(mealStart);
source = source.replace("initialMeals, Meal, members, photos, Tab", "initialMeals, Meal, photos, Tab");
fs.writeFileSync(file, source);
console.log('Group workspace routing integrated.');
