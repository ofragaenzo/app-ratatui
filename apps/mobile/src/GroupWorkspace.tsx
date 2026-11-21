import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Meal, members } from './data';
import { AccountMenuButton, Avatar, Icon, IconButton, IconName } from './ui';
import { Language, usePreferences } from './preferences';
import { Palette, useAppTheme } from './theme';
import { useI18n } from './i18n';
import { GroupChallengeSummary, personalGroupPoints } from './GroupChallenge';

export type WorkspaceGroup = { id: string; name: string; description: string; isDemo: boolean; challengeStart?: string; challengeEnd?: string };
export type GroupSection = 'meals' | 'details' | 'ranking' | 'chat';
export type ChatMessage = { id: string; author: string; initials: string; text: string; mine: boolean; time?: number; seed?: boolean };
type Props = {
  group: WorkspaceGroup;
  meals: Meal[];
  renderMeal: (meal: Meal) => React.ReactNode;
  goal: string;
  onCompose: () => void;
  onInvite: () => void;
  onBackToGroups: () => void;
  section: GroupSection;
  onSectionChange: (section: GroupSection) => void;
  messages: Record<string, ChatMessage[]>;
  onMessagesChange: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  onBackToChats?: () => void;
  onBackToRankings?: () => void;
  onBackToMeals?: () => void;
  onBackFromDetails?: () => void;
  onOpenMenu?: () => void;
  initialFeedOffset?: number;
  onFeedScroll?: (offset: number) => void;
  chatDrafts?: Record<string, string>;
  onChatDraftsChange?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  secondaryOnly?: boolean;
};

const pt = {
  meals: 'Refeições', details: 'Detalhes', ranking: 'Ranking', chat: 'Chat',
  menu: 'Abrir menu lateral', private: 'Grupo privado', people: 'pessoas', person: 'pessoa',
  mealsIntro: 'A mesa do grupo', mealsHelp: 'Cada prato, um passo no próprio caminho.',
  groupFeed: 'Do grupo', myFeed: 'Minhas refeições', logMeal: 'Registrar refeição',
  logTitle: 'Compartilhe o seu prato', logHelp: 'Um registro de cada vez, com companhia.',
  emptyMeals: 'A primeira refeição pode ser sua', emptyMealsHelp: 'Compartilhe um prato para começar a história deste grupo.',
  emptyMine: 'Seu espaço à mesa está aqui', emptyMineHelp: 'Suas refeições neste grupo aparecerão aqui.',
  caughtUp: 'Você está em dia com o grupo.',
  about: 'Sobre o grupo', defaultDescription: 'Um espaço para compartilhar refeições, celebrar a constância e apoiar o caminho de cada pessoa.',
  ownGoals: 'Metas individuais. Apoio em grupo.', ownGoalsHelp: 'Cada integrante segue a própria meta. O grupo reúne pessoas, sem impor o mesmo objetivo a todo mundo.',
  members: 'Quem está à mesa', you: 'Você', invite: 'Convidar alguém', allGroups: 'Todos os meus grupos',
  rules: 'Como o grupo funciona', rule1: 'Compartilhe refeições e apoie as pessoas.',
  rule2: 'Cada refeição vale 5 pontos. O primeiro registro do dia pode somar um bônus pela sequência.', rule3: 'Respeite o ritmo e as escolhas de cada integrante.',
  previewRules: 'As avaliações das refeições de exemplo são ilustrativas.',
  rankingTitle: 'Ranking do grupo', rankingHelp: 'Os pontos vêm das refeições compartilhadas neste grupo.',
  points: 'pontos',
  rankingNote: 'Os demais participantes do Grupo Raiz têm pontuações de exemplo.',
  newRankingHelp: 'Só entram na classificação as refeições publicadas neste grupo durante o desafio.',
  chatTitle: 'Chat do grupo',
  today: 'Hoje', seedTime: 'Exemplo',
  seed1: 'Que bom compartilhar essa rotina com vocês! Um prato de cada vez.',
  seed2: 'Gostei de ver as ideias de almoço do grupo. Bora seguir no nosso ritmo.',
  chatEmpty: 'O começo de uma boa conversa', chatEmptyHelp: 'Envie uma mensagem para abrir o chat deste grupo.',
  chatPreview: 'Conversa de demonstração. As mensagens ficam apenas nesta sessão.',
  message: 'Escreva uma mensagem…', messageLabel: 'Mensagem para', send: 'Enviar mensagem',
};
type Copy = typeof pt;
const copy: Record<Language, Copy> = {
  'pt-BR': pt,
  en: {
    meals: 'Meals', details: 'Details', ranking: 'Ranking', chat: 'Chat',
    menu: 'Open navigation menu', private: 'Private group', people: 'people', person: 'person',
    mealsIntro: 'At the group table', mealsHelp: 'Every plate is a step along your own path.',
    groupFeed: 'Group meals', myFeed: 'My meals', logMeal: 'Log a meal',
    logTitle: 'Share your plate', logHelp: 'One entry at a time, with company.',
    emptyMeals: 'The first meal could be yours', emptyMealsHelp: 'Share a plate to start this group’s story.',
    emptyMine: 'Your place at the table is here', emptyMineHelp: 'Your meals in this group will appear here.',
    caughtUp: 'You’re all caught up with the group.',
    about: 'About this group', defaultDescription: 'A space to share meals, celebrate consistency and support each person’s journey.',
    ownGoals: 'Personal goals. Group support.', ownGoalsHelp: 'Each member follows their own goal. The group brings people together without imposing one shared objective.',
    members: 'Who’s at the table', you: 'You', invite: 'Invite someone', allGroups: 'All my groups',
    rules: 'How the group works', rule1: 'Share meals and support one another.',
    rule2: 'Points consider alignment with the personal goal.', rule3: 'Respect each member’s pace and choices.',
    previewRules: 'Preview with illustrative points and feedback. Automatic analysis is not connected yet.',
    rankingTitle: 'Group ranking', rankingHelp: 'Points come from meals shared with this group.',
    points: 'points',
    rankingNote: 'The other members of Root Group have sample scores.',
    newRankingHelp: 'Only meals shared with this group during the challenge count toward the ranking.',
    chatTitle: 'Group chat',
    today: 'Today', seedTime: 'Example',
    seed1: 'It feels good to share this routine with you! One plate at a time.',
    seed2: 'I enjoyed seeing the group’s lunch ideas. Let’s keep going at our own pace.',
    chatEmpty: 'The start of a good conversation', chatEmptyHelp: 'Send a message to open this group’s chat.',
    chatPreview: 'Demo conversation. Messages stay in this session only.',
    message: 'Write a message…', messageLabel: 'Message to', send: 'Send message',
  },
  es: {
    meals: 'Comidas', details: 'Detalles', ranking: 'Ranking', chat: 'Chat',
    menu: 'Abrir menú lateral', private: 'Grupo privado', people: 'personas', person: 'persona',
    mealsIntro: 'En la mesa del grupo', mealsHelp: 'Cada plato, un paso en tu propio camino.',
    groupFeed: 'Del grupo', myFeed: 'Mis comidas', logMeal: 'Registrar comida',
    logTitle: 'Comparte tu plato', logHelp: 'Un registro a la vez, con compañía.',
    emptyMeals: 'La primera comida puede ser tuya', emptyMealsHelp: 'Comparte un plato para empezar la historia de este grupo.',
    emptyMine: 'Tu lugar en la mesa está aquí', emptyMineHelp: 'Tus comidas en este grupo aparecerán aquí.',
    caughtUp: 'Estás al día con el grupo.',
    about: 'Sobre el grupo', defaultDescription: 'Un espacio para compartir comidas, celebrar la constancia y apoyar el camino de cada persona.',
    ownGoals: 'Metas individuales. Apoyo en grupo.', ownGoalsHelp: 'Cada integrante sigue su propia meta. El grupo reúne personas sin imponer el mismo objetivo a todos.',
    members: 'Quién está en la mesa', you: 'Tú', invite: 'Invitar a alguien', allGroups: 'Todos mis grupos',
    rules: 'Cómo funciona el grupo', rule1: 'Comparte comidas y apoya a las personas.',
    rule2: 'Los puntos consideran la relación con la meta personal.', rule3: 'Respeta el ritmo y las elecciones de cada integrante.',
    previewRules: 'Vista previa con puntos y comentarios ilustrativos. El análisis automático aún no está conectado.',
    rankingTitle: 'Clasificación del grupo', rankingHelp: 'Los puntos vienen de las comidas compartidas con este grupo.',
    points: 'puntos',
    rankingNote: 'Los demás miembros del Grupo Raíz tienen puntuaciones de ejemplo.',
    newRankingHelp: 'Solo las comidas compartidas con este grupo durante el desafío cuentan para la clasificación.',
    chatTitle: 'Chat del grupo',
    today: 'Hoy', seedTime: 'Ejemplo',
    seed1: '¡Qué bien compartir esta rutina con ustedes! Un plato a la vez.',
    seed2: 'Me gustó ver las ideas de almuerzo del grupo. Sigamos a nuestro ritmo.',
    chatEmpty: 'El inicio de una buena conversación', chatEmptyHelp: 'Envía un mensaje para abrir el chat de este grupo.',
    chatPreview: 'Conversación de demostración. Los mensajes quedan solo en esta sesión.',
    message: 'Escribe un mensaje…', messageLabel: 'Mensaje para', send: 'Enviar mensaje',
  },
};

const sections: { id: GroupSection; key: 'meals' | 'details' | 'ranking' | 'chat'; icon: IconName; activeIcon: IconName }[] = [
  { id: 'meals', key: 'meals', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { id: 'details', key: 'details', icon: 'information-circle-outline', activeIcon: 'information-circle' },
  { id: 'ranking', key: 'ranking', icon: 'podium-outline', activeIcon: 'podium' },
  { id: 'chat', key: 'chat', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
];

export function GroupNavigation({ selected, onSelect, onCompose }: { selected: GroupSection | null; onSelect: (section: GroupSection) => void; onCompose?: () => void }) {
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const text = copy[preferences.language];
  const scale = preferences.textSize === 'large' ? 1.18 : 1;
  return <>
  {onCompose && <Pressable accessibilityRole="button" accessibilityLabel={text.logMeal} onPress={onCompose}
    style={({ pressed }) => [navStyles.compose, { backgroundColor: C.purple, borderColor: C.surface }, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }]}>
    <Icon name="camera-outline" size={25} color={C.onAccent} />
  </Pressable>}
  <View style={[navStyles.shell, { backgroundColor: C.surface, borderColor: C.line }]}>
    {sections.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={text[item.key]} accessibilityState={{ selected: selected === item.id }} aria-selected={selected === item.id} onPress={() => onSelect(item.id)} style={({ pressed }) => [navStyles.item, pressed && { opacity: 0.76, transform: [{ scale: 0.96 }] }]}>
      <View style={navStyles.icon}><Icon name={selected === item.id ? item.activeIcon : item.icon} size={22} color={selected === item.id ? C.purple : C.muted} /></View>
      <Text numberOfLines={1} style={[navStyles.label, { color: selected === item.id ? C.purple : C.muted, fontSize: 10.5 * scale }, selected === item.id && { fontWeight: '700' }]}>{text[item.key]}</Text>
    </Pressable>)}
  </View></>;
}

const navStyles = StyleSheet.create({
  shell: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', paddingHorizontal: 8, paddingTop: 7, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  compose: { position: 'absolute', right: 22, bottom: 86, width: 56, height: 56, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowColor: '#21172F', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 54 },
  icon: { height: 25, justifyContent: 'center', alignItems: 'center' },
  label: { lineHeight: 17, letterSpacing: 0.1 },
});

export const seedMessages: ChatMessage[] = [
  { id: 'seed-marina', author: 'Marina', initials: 'MA', text: 'seed1', mine: false, seed: true },
  { id: 'seed-rafa', author: 'Rafa', initials: 'RL', text: 'seed2', mine: false, seed: true },
];

export function chatMessageText(message: ChatMessage, language: Language): string {
  return message.seed ? copy[language][message.text as 'seed1' | 'seed2'] : message.text;
}

export default function GroupWorkspace(props: Props) {
  const { group, meals, renderMeal, goal } = props;
  const { preferences } = usePreferences();
  const { colors: C } = useAppTheme();
  const { t, locale } = useI18n();
  const { width } = useWindowDimensions();
  const text = copy[preferences.language];
  const s = useMemo(() => createStyles(C, preferences.textSize === 'large' ? 1.18 : 1), [C, preferences.textSize]);
  const section = props.section;
  const [filter, setFilter] = useState<'group' | 'mine'>('group');
  const [localDrafts, setLocalDrafts] = useState<Record<string, string>>({});
  const drafts = props.chatDrafts ?? localDrafts;
  const setDrafts = props.onChatDraftsChange ?? setLocalDrafts;
  const feedScroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const sectionScroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const lastScrolledMessage = useRef<string | null>(null);
  const seeded = group.id === 'raiz';
  const points = personalGroupPoints(group, meals);
  const groupMembers = seeded ? members.map(member => ({ ...member, goal: member.mine ? goal : member.goal, points: member.mine ? points : member.points }))
    : [{ name: 'Enzo Fraga', initials: 'EF', color: '#E7DFF5', points, goal, streak: 0, mine: true }];
  const ranked = [...groupMembers].sort((a, b) => b.points - a.points);
  const groupMessages = props.messages[group.id] ?? [];
  const draft = drafts[group.id] ?? '';
  const shownMeals = filter === 'mine' ? meals.filter(meal => meal.mine) : meals;

  useEffect(() => {
    setFilter('group');
    feedScroll.current?.scrollTo({ y: props.initialFeedOffset ?? 0, animated: false });
  }, [group.id]);
  useLayoutEffect(() => { lastScrolledMessage.current = null; }, [group.id, section]);

  function changeSection(next: GroupSection) {
    props.onSectionChange(next);
    if (next !== 'meals') sectionScroll.current?.scrollTo({ y: 0, animated: false });
  }

  let backAction: (() => void) | undefined;
  let backLabel = t('Voltar para refeições');
  if (props.onBackToChats && section === 'chat') {
    backAction = props.onBackToChats;
    backLabel = t('Voltar para chats');
  } else if (props.onBackToRankings && section === 'ranking') {
    backAction = props.onBackToRankings;
    backLabel = t('Voltar para rankings');
  } else if (width < 1000 && section !== 'meals') {
    if (section === 'details' && props.onBackFromDetails) {
      backAction = props.onBackFromDetails;
      backLabel = t('Voltar');
    } else {
      backAction = props.onBackToMeals ?? (() => changeSection('meals'));
    }
  }

  function scrollToLatestMessage() {
    if (section !== 'chat' || !groupMessages.length) return;
    const latest = groupMessages[groupMessages.length - 1].id;
    if (lastScrolledMessage.current === latest) return;
    const animated = lastScrolledMessage.current !== null && !preferences.reduceMotion;
    lastScrolledMessage.current = latest;
    sectionScroll.current?.scrollToEnd({ animated });
  }
  function send() {
    const body = draft.trim();
    if (!body) return;
    const message: ChatMessage = { id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, author: text.you, initials: 'EF', text: body.slice(0, 500), mine: true, time: Date.now() };
    props.onMessagesChange(previous => ({ ...previous, [group.id]: [...(previous[group.id] ?? []), message] }));
    setDrafts(previous => ({ ...previous, [group.id]: '' }));
  }

  return <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={s.headerShell}><View style={s.header}>
      {backAction ? <IconButton name="chevron-back" label={backLabel} onPress={backAction} /> : width >= 1000 ? <View style={s.groupIcon}><Icon name="leaf-outline" color={C.purple} size={24} /></View> : props.onOpenMenu && <AccountMenuButton onPress={props.onOpenMenu} />}
      <View style={s.flex}><View style={s.privateRow}><Icon name="lock-closed-outline" size={11} color={C.muted} /><Text style={s.privateText}>{text.private} · {groupMembers.length} {groupMembers.length === 1 ? text.person : text.people}</Text></View><Text numberOfLines={2} style={s.groupName}>{seeded ? t(group.name) : group.name}</Text></View>
      {(width >= 1000 || section !== 'meals') && <IconButton name={section === 'chat' ? 'people-outline' : 'add'} label={section === 'chat' ? text.about : text.logMeal} onPress={section === 'chat' ? () => changeSection('details') : props.onCompose} active />}
    </View></View>

    {!props.secondaryOnly && <ScrollView ref={feedScroll} style={[s.scroll, section !== 'meals' && { display: 'none' }]} contentContainerStyle={[s.scrollContent, { paddingBottom: 120 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets contentOffset={props.initialFeedOffset === undefined ? undefined : { x: 0, y: props.initialFeedOffset }} onScroll={event => props.onFeedScroll?.(event.nativeEvent.contentOffset.y)} scrollEventThrottle={16}>
      <View style={s.column}>
          <View style={s.sectionHeading}><Text style={s.title}>{text.mealsIntro}</Text><Text style={s.subtitle}>{text.mealsHelp}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={text.logMeal} onPress={props.onCompose} style={({ pressed }) => [s.quickPost, pressed && s.pressed]}><View style={s.camera}><Icon name="camera-outline" size={23} color={C.purple} /></View><View style={s.flex}><Text style={s.actionTitle}>{text.logTitle}</Text><Text style={s.actionSub}>{text.logHelp}</Text></View><Icon name="add-circle-outline" color={C.purple} size={24} /></Pressable>
          <View style={s.segment}>
            {(['group', 'mine'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityLabel={value === 'group' ? text.groupFeed : text.myFeed} aria-selected={filter === value} accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={[s.segmentOption, filter === value && s.segmentSelected]}><Text style={[s.segmentText, filter === value && { color: C.purple, fontWeight: '600' }]}>{value === 'group' ? text.groupFeed : text.myFeed}</Text></Pressable>)}
          </View>
          {shownMeals.length ? <>{shownMeals.map(meal => <React.Fragment key={meal.id}>{renderMeal(meal)}</React.Fragment>)}<Text style={s.endNote}>{text.caughtUp}</Text></> : <EmptyState icon="restaurant-outline" title={filter === 'mine' ? text.emptyMine : text.emptyMeals} description={filter === 'mine' ? text.emptyMineHelp : text.emptyMealsHelp} s={s} C={C}><Pressable accessibilityRole="button" onPress={props.onCompose} style={s.primaryButton}><Icon name="camera-outline" size={18} color={C.onAccent} /><Text style={s.primaryText}>{text.logMeal}</Text></Pressable></EmptyState>}
      </View>
    </ScrollView>}
    {section !== 'meals' && <ScrollView ref={sectionScroll} style={s.scroll} contentContainerStyle={[s.scrollContent, width >= 1000 && section !== 'chat' && { paddingBottom: 120 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
      onContentSizeChange={scrollToLatestMessage}>
      <View style={s.column}>
        {section === 'details' && <>
          <View style={s.sectionHeading}><Text style={s.title}>{text.details}</Text><Text style={s.subtitle}>{text.ownGoals}</Text></View>
          <GroupChallengeSummary start={group.challengeStart} end={group.challengeEnd} />
          <View style={s.card}><View style={s.inline}><View style={s.smallIcon}><Icon name="leaf-outline" size={22} color={C.purple} /></View><Text style={s.cardTitle}>{text.about}</Text></View><Text style={s.body}>{group.description || text.defaultDescription}</Text><View style={s.groupPrinciple}><Icon name="heart-outline" color={C.purple} size={20} /><Text style={s.principleText}>{text.ownGoalsHelp}</Text></View></View>
          <View style={s.card}><View style={s.cardHeading}><Text style={s.cardTitle}>{text.members}</Text><Text style={s.memberCount}>{groupMembers.length}</Text></View>{groupMembers.map(member => <View key={member.name} style={s.memberRow}><Avatar initials={member.initials} color={member.color} size={42} /><View style={s.flex}><Text style={s.memberName}>{member.mine ? text.you : member.name}</Text><Text style={s.memberGoal}>{t(member.goal)}</Text></View><Icon name="leaf-outline" size={17} color={C.purple} /></View>)}<Pressable accessibilityRole="button" onPress={props.onInvite} style={s.secondaryButton}><Icon name="person-add-outline" color={C.purple} size={18} /><Text style={s.secondaryText}>{text.invite}</Text></Pressable></View>
          <View style={s.card}><Text style={s.cardTitle}>{text.rules}</Text>{[text.rule1, text.rule2, text.rule3].map((rule, index) => <View style={s.rule} key={rule}><View style={s.ruleNumber}><Text style={s.ruleNumberText}>{index + 1}</Text></View><Text style={s.ruleText}>{rule}</Text></View>)}<Text style={s.note}>{text.previewRules}</Text></View>
          <Pressable accessibilityRole="button" onPress={props.onBackToGroups} style={s.allGroups}><Icon name="albums-outline" color={C.purple} size={19} /><Text style={s.secondaryText}>{text.allGroups}</Text><Icon name="chevron-forward" color={C.purple} size={15} /></Pressable>
        </>}

        {section === 'ranking' && <>
          <View style={s.sectionHeading}><Text accessibilityRole="header" style={s.title}>{text.rankingTitle}</Text><Text style={s.subtitle}>{group.challengeStart && group.challengeEnd ? text.newRankingHelp : text.rankingHelp}</Text></View>
          {group.challengeStart && group.challengeEnd && <GroupChallengeSummary start={group.challengeStart} end={group.challengeEnd} />}
          <View style={s.card}>{ranked.map((member, index) => <View key={member.name} style={[s.rankRow, member.mine && s.rankMine]}><Text style={[s.position, index === 0 && { color: C.orange }]}>{index + 1}</Text><Avatar initials={member.initials} color={member.color} size={44} /><View style={s.flex}><Text style={s.memberName}>{member.mine ? text.you : member.name}</Text><Text style={s.memberGoal}>{t(member.goal)}</Text></View><View style={s.points}><Text style={s.pointValue}>{member.points}</Text><Text style={s.pointLabel}>{text.points}</Text></View></View>)}{seeded && <Text style={s.rankingNote}>{text.rankingNote}</Text>}</View>
        </>}

        {section === 'chat' && <>
          <View style={s.sectionHeading}><Text accessibilityRole="header" style={s.title}>{text.chatTitle}</Text><Text style={s.subtitle}>{text.chatPreview}</Text></View>
          {groupMessages.length > 0 ? groupMessages.map((message, index) => {
            const date = message.time !== undefined ? new Date(message.time) : null;
            const previousTime = groupMessages[index - 1]?.time;
            const startsDay = date && (previousTime === undefined || new Date(previousTime).toDateString() !== date.toDateString());
            return <React.Fragment key={message.id}>
              {startsDay && <View style={s.chatDay}><Text style={s.chatDayText}>{date.toDateString() === new Date().toDateString() ? text.today : date.toLocaleDateString(locale)}</Text></View>}
              <View style={[s.messageRow, message.mine && s.messageRowMine]}>
                {!message.mine && <Avatar initials={message.initials} size={30} />}
                <View style={[s.bubble, message.mine && s.bubbleMine]}>
                  {!message.mine && <Text style={s.messageAuthor}>{message.author}</Text>}
                  <Text style={s.messageText}>{chatMessageText(message, preferences.language)}</Text>
                  <Text style={s.messageTime}>{message.seed ? text.seedTime : date?.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            </React.Fragment>;
          }) : <EmptyState icon="chatbubbles-outline" title={text.chatEmpty} description={text.chatEmptyHelp} s={s} C={C} />}
        </>}
      </View>
    </ScrollView>}

    {section === 'chat' && <View style={[s.composerShell, width < 1000 && { paddingBottom: 16 }]}><View style={s.composerColumn}><View style={s.composer}><TextInput accessibilityLabel={`${text.messageLabel} ${group.name}`} value={draft} onChangeText={value => setDrafts(previous => ({ ...previous, [group.id]: value }))} placeholder={text.message} placeholderTextColor={C.textFaint} maxLength={500} multiline style={s.chatInput} /><Pressable accessibilityRole="button" accessibilityLabel={text.send} disabled={!draft.trim()} accessibilityState={{ disabled: !draft.trim() }} onPress={send} style={({ pressed }) => [s.sendButton, !draft.trim() && s.sendDisabled, pressed && s.pressed]}><Icon name="arrow-up" size={22} color={C.onAccent} /></Pressable></View>{draft.length >= 450 && <Text style={s.characterCount}>{draft.length}/500</Text>}</View></View>}

    {(section === 'meals' || width >= 1000) && <GroupNavigation selected={section} onSelect={changeSection} onCompose={width < 1000 && section === 'meals' ? props.onCompose : undefined} />}
  </KeyboardAvoidingView>;
}

type WorkspaceStyles = ReturnType<typeof createStyles>;
function EmptyState({ icon, title, description, children, s, C }: { icon: IconName; title: string; description: string; children?: React.ReactNode; s: WorkspaceStyles; C: Palette }) {
  return <View style={s.empty}><View style={s.emptyIcon}><Icon name={icon} size={35} color={C.purple} /></View><Text style={s.emptyTitle}>{title}</Text><Text style={s.emptyText}>{description}</Text>{children}</View>;
}

function createStyles(C: Palette, scale: number) {
  const f = (size: number) => size * scale;
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: C.bg }, flex: { flex: 1, minWidth: 0 }, pressed: { opacity: 0.65 }, inline: { flexDirection: 'row', alignItems: 'center', gap: 11 },
    headerShell: { paddingTop: 18, paddingBottom: 16, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: C.line }, header: { width: '100%', maxWidth: 740, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 12 }, groupIcon: { width: 46, height: 46, backgroundColor: C.lilac, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    privateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }, privateText: { fontSize: f(10), color: C.muted, lineHeight: f(15) }, groupName: { fontSize: f(26), lineHeight: f(33), color: C.ink, fontWeight: '700', letterSpacing: -0.8 },
    scroll: { flex: 1 }, scrollContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 25, paddingBottom: 24 }, column: { maxWidth: 740, width: '100%', alignSelf: 'center' }, sectionHeading: { marginBottom: 23 }, title: { fontSize: f(23), lineHeight: f(30), color: C.ink, fontWeight: '600', letterSpacing: -0.6 }, subtitle: { color: C.muted, fontSize: f(12), lineHeight: f(20), marginTop: 6 },
    quickPost: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, backgroundColor: C.surface, marginBottom: 20, borderWidth: 1, borderColor: C.line }, camera: { width: 43, height: 43, borderRadius: 14, backgroundColor: C.lilac, justifyContent: 'center', alignItems: 'center' }, actionTitle: { color: C.ink, fontSize: f(13), lineHeight: f(20), fontWeight: '600' }, actionSub: { color: C.muted, fontSize: f(11), lineHeight: f(17), marginTop: 3 },
    segment: { flexDirection: 'row', padding: 4, gap: 4, borderRadius: 13, backgroundColor: C.neutralSurface, marginBottom: 20 }, segmentOption: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 44, paddingHorizontal: 9, borderRadius: 10 }, segmentSelected: { backgroundColor: C.lilac }, segmentText: { fontSize: f(12), color: C.muted, lineHeight: f(18), textAlign: 'center' }, endNote: { color: C.muted, fontSize: f(11), lineHeight: f(18), textAlign: 'center', paddingTop: 10 },
    card: { padding: 20, borderRadius: 22, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, marginBottom: 18 }, cardTitle: { color: C.ink, fontSize: f(15), lineHeight: f(22), fontWeight: '600' }, body: { color: C.textSecondary, fontSize: f(12), lineHeight: f(21), marginTop: 12 }, smallIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.lilac, justifyContent: 'center', alignItems: 'center' }, groupPrinciple: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 13, backgroundColor: C.lilac, borderRadius: 13, marginTop: 18 }, principleText: { flex: 1, color: C.textSecondary, fontSize: f(11), lineHeight: f(19) },
    cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }, memberCount: { color: C.purple, fontSize: f(12), fontWeight: '600', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: C.lilac }, memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.line }, memberName: { color: C.ink, fontSize: f(13), lineHeight: f(20), fontWeight: '500' }, memberGoal: { color: C.textSecondary, fontSize: f(11), lineHeight: f(18), marginTop: 3 }, secondaryButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 13, backgroundColor: C.lilac, marginTop: 18, padding: 12 }, secondaryText: { color: C.purple, fontSize: f(12), fontWeight: '600' }, allGroups: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10 },
    rule: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginTop: 17 }, ruleNumber: { width: 24, height: 24, borderRadius: 9, backgroundColor: C.lilac, alignItems: 'center', justifyContent: 'center' }, ruleNumberText: { color: C.purple, fontSize: f(10), fontWeight: '700' }, ruleText: { flex: 1, color: C.textSecondary, fontSize: f(12), lineHeight: f(21) }, note: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: C.line, fontSize: f(10.5), lineHeight: f(18), color: C.muted },
    rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginHorizontal: -8, borderRadius: 14, marginBottom: 8 }, rankMine: { backgroundColor: C.lilac }, position: { color: C.muted, fontSize: f(12), width: 15, textAlign: 'center', fontWeight: '600' }, points: { alignItems: 'flex-end', minWidth: 35 }, pointValue: { color: C.purple, fontSize: f(17), fontWeight: '600' }, pointLabel: { color: C.muted, fontSize: f(9), marginTop: 3 }, rankingNote: { borderTopWidth: 1, borderTopColor: C.line, marginTop: 10, paddingTop: 16, color: C.muted, fontSize: f(10), lineHeight: f(18), textAlign: 'center' },
    empty: { paddingHorizontal: 20, paddingVertical: 38, borderRadius: 20, alignItems: 'center', backgroundColor: C.surface }, emptyIcon: { width: 72, height: 72, borderRadius: 25, backgroundColor: C.lilac, justifyContent: 'center', alignItems: 'center', marginBottom: 18 }, emptyTitle: { color: C.ink, fontSize: f(18), lineHeight: f(25), fontWeight: '600', textAlign: 'center' }, emptyText: { color: C.muted, fontSize: f(12), lineHeight: f(21), marginTop: 10, marginBottom: 18, textAlign: 'center', maxWidth: 340 }, primaryButton: { minHeight: 47, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: C.purple, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, primaryText: { color: C.onAccent, fontSize: f(12), fontWeight: '600' },
    chatDay: { alignItems: 'center', marginBottom: 22 }, chatDayText: { color: C.muted, fontSize: f(10), backgroundColor: C.surfaceSubtle, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9 }, messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 17, paddingRight: 28 }, messageRowMine: { justifyContent: 'flex-end', paddingRight: 0, paddingLeft: 40 }, bubble: { maxWidth: '88%', minWidth: 100, backgroundColor: C.surface, borderRadius: 17, borderBottomLeftRadius: 5, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 8 }, bubbleMine: { backgroundColor: C.lilac, borderColor: C.accentLine, borderBottomLeftRadius: 17, borderBottomRightRadius: 5 }, messageAuthor: { color: C.purple, fontSize: f(11), fontWeight: '600', marginBottom: 6 }, messageText: { color: C.ink, fontSize: f(13), lineHeight: f(22) }, messageTime: { alignSelf: 'flex-end', color: C.muted, fontSize: f(9), marginTop: 5 },
    composerShell: { paddingHorizontal: 22, paddingTop: 9, paddingBottom: 100, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line }, composerColumn: { width: '100%', maxWidth: 740, alignSelf: 'center' }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, padding: 7, paddingLeft: 14, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line }, chatInput: { flex: 1, minHeight: 39, maxHeight: 105, paddingVertical: 9, color: C.ink, fontSize: f(13), lineHeight: f(21) }, sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.purple, alignItems: 'center', justifyContent: 'center' }, sendDisabled: { opacity: 0.38 }, characterCount: { textAlign: 'right', fontSize: f(8), color: C.muted, marginTop: 3, paddingRight: 7 },
    navShell: { paddingHorizontal: 18, paddingTop: 9, paddingBottom: 14, width: '100%', maxWidth: 620, alignSelf: 'center' }, bottomNav: { flexDirection: 'row', padding: 7, borderRadius: 26, overflow: 'hidden', minHeight: 75, borderWidth: 1, borderColor: C.navBorder, backgroundColor: C.navBackground }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 59 }, navIcon: { width: 47, height: 30, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, navIconSelected: { backgroundColor: C.lilac }, navLabel: { color: C.muted, fontSize: f(10), lineHeight: f(15) },
  });
}
