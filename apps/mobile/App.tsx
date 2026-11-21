import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, BackHandler, Easing, Image, Keyboard, PanResponder, Platform, Pressable, SafeAreaView,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View,
} from 'react-native';
import GroupWorkspace, { ChatMessage, GroupNavigation, GroupSection, seedMessages } from './src/GroupWorkspace';
import ChatList from './src/ChatList';
import DiaryDetails from './src/DiaryDetails';
import RankingList from './src/RankingList';
import { AccountMenuButton, Avatar, Icon, IconButton, IconName } from './src/ui';
import { initialMeals, Meal, Tab } from './src/data';
import MealComposer, { draftPhoto, emptyMealDraft, type MealDraft } from './src/MealComposer';
import SavedMeals from './src/SavedMeals';
import { emptyJournal, readJournal } from './src/journal';
import { useStyles } from './src/styles';
import { useAppTheme } from './src/theme';
import { PreferencesProvider, usePreferences } from './src/preferences';
import { useI18n } from './src/i18n';
import SettingsScreen from './src/SettingsScreen';
import NavigationDrawer, { DemoGroup } from './src/NavigationDrawer';
import Onboarding, { Assessment } from './src/Onboarding';
import { personalizedGoal } from './src/goalSummary';
import GoalOverview from './src/GoalOverview';
import WeightProgress from './src/WeightProgress';
import { GroupChallengeFields, validateChallengeDates, ChallengeError } from './src/GroupChallenge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet from './src/BottomSheet';

const baseNavigation: { id: Tab; label: string; icon: IconName; selected: IconName }[] = [
  { id: 'diary', label: 'Diário', icon: 'book-outline', selected: 'book' },
  { id: 'groups', label: 'Meus grupos', icon: 'people-outline', selected: 'people' },
  { id: 'profile', label: 'Perfil', icon: 'person-outline', selected: 'person' },
];

type Sheet = 'compose' | 'feedback' | 'invite' | 'saved' | 'createGroup';

type ScreenState = {
  tab: Tab;
  groupId: string;
  groupSection: GroupSection;
  settingsOpen: boolean;
  goalOpen: boolean;
  progressOpen: boolean;
  diarySection: GroupSection;
  returnToChats: boolean;
};

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function currentStreak(dates: string[], fromYesterday = false): number {
  const date = new Date();
  if (fromYesterday || !dates.includes(localDate(date))) date.setDate(date.getDate() - 1);
  let count = 0;
  while (dates.includes(localDate(date))) { count++; date.setDate(date.getDate() - 1); }
  return count;
}

export default function App() {
  return <PreferencesProvider><AppContent /></PreferencesProvider>;
}

function AppContent() {
  const { preferences, ready } = usePreferences();
  const { t, locale } = useI18n();
  const { colors: C, isDark } = useAppTheme();
  const s = useStyles();
  const navigation = baseNavigation.map(item => ({ ...item, label: t(item.label) }));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDragging, setDrawerDragging] = useState(false);
  const [createdGroups, setCreatedGroups] = useState<DemoGroup[]>([]);
  const [groupName, setGroupName] = useState('');
  const groupNameInput = useRef<React.ComponentRef<typeof TextInput>>(null);
  const groupSubmitted = useRef(false);
  const [groupDescription, setGroupDescription] = useState('');
  const [groupError, setGroupError] = useState('');
  const [challengeStart, setChallengeStart] = useState('');
  const [challengeEnd, setChallengeEnd] = useState('');
  const [challengeError, setChallengeError] = useState<ChallengeError>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [reassessing, setReassessing] = useState(false);
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const [tab, setTab] = useState<Tab>('home');
  const [activeGroupId, setActiveGroupId] = useState('raiz');
  const [groupSection, setGroupSection] = useState<GroupSection>('meals');
  const [diarySection, setDiarySection] = useState<GroupSection>('meals');
  const [returnToChats, setReturnToChats] = useState(false);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({ raiz: seedMessages });
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});
  const [meals, setMeals] = useState(initialMeals);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [sheet, setActiveSheet] = useState<Sheet | null>(null);
  const [sheetClosing, setSheetClosing] = useState(false);
  const dismissSheet = useCallback(() => {
    setActiveSheet(null);
    setSheetClosing(false);
  }, []);
  function setSheet(next: Sheet | null) {
    if (next === null) {
      Keyboard.dismiss();
      setSheetClosing(true);
      return;
    }
    setSheetClosing(false);
    setActiveSheet(next);
  }
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [mealDrafts, setMealDrafts] = useState<Record<string, MealDraft>>({});
  const [draftKey, setDraftKey] = useState('diary');
  const mealDraft = mealDrafts[draftKey] ?? emptyMealDraft;
  const mealPublished = useRef(false);
  const [journal, setJournal] = useState(emptyJournal);
  const [journalLoad, setJournalLoad] = useState<'loading' | 'ready' | 'invalid' | 'unavailable'>('loading');
  const [journalSaveFailed, setJournalSaveFailed] = useState(false);
  const journalReady = journalLoad !== 'loading';
  const journalNotice = journalLoad === 'invalid' ? 'O histórico salvo tem dados inválidos. Os novos registros ficarão apenas nesta sessão.'
    : journalLoad === 'unavailable' ? 'O aparelho não conseguiu abrir o histórico. Os novos registros ficarão apenas nesta sessão.'
    : journalSaveFailed ? 'O aparelho não conseguiu salvar a última atualização. Seus registros continuam disponíveis nesta sessão.' : '';
  const [progressOpen, setProgressOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [backPreview, setBackPreview] = useState<ScreenState | null>(null);
  const [goal, setGoal] = useState('Vegetais no almoço');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const journalWrites = useRef<Promise<void>>(Promise.resolve());
  const lastJournal = useRef(emptyJournal);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const diaryFeedScroll = useRef<React.ComponentRef<typeof ScrollView> | null>(null);
  const diaryFeedOffset = useRef(0);
  const groupFeedOffset = useRef(0);
  const history = useRef<ScreenState[]>([]);
  const currentScreen = useRef<ScreenState | null>(null);
  const restoringScreen = useRef(false);
  const backOffset = useRef(new Animated.Value(0)).current;
  const overlayOffset = useRef(new Animated.Value(0)).current;
  const drawerSlide = useRef(new Animated.Value(0)).current;
  const gestureMode = useRef<'back' | 'drawer' | 'meals' | null>(null);
  const backAnimationRunning = useRef(false);
  const gestureActions = useRef({ back: () => {}, openDrawer: () => {}, returnToMeals: () => {} });
  const gestureOrigin = useRef({ x: 0, y: 0 });
  const mealsOrigin = useRef<'diary' | 'group'>('group');
  const secondarySection = !settingsOpen && !goalOpen && !progressOpen &&
    ((tab === 'home' && groupSection !== 'meals') || (tab === 'diary' && diarySection !== 'meals'));
  const gesturesEnabled = !desktop && !sheet && !drawerOpen && !keyboardOpen;
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: event => {
      gestureOrigin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      return false;
    },
    onMoveShouldSetPanResponderCapture: (event, gesture) => {
      const origin = gestureOrigin.current;
      const horizontal = event.nativeEvent.pageX - origin.x;
      const vertical = event.nativeEvent.pageY - origin.y;
      const startedAtEdge = origin.x >= width - 44;
      const goingBack = startedAtEdge && horizontal < -3 && history.current.length > 0;
      const openingDrawer = !startedAtEdge && horizontal > 3;
      return gesturesEnabled && !backAnimationRunning.current && gesture.numberActiveTouches === 1 &&
        (goingBack || openingDrawer) && Math.abs(horizontal) > Math.abs(vertical) * 1.25;
    },
    onPanResponderGrant: () => {
      gestureMode.current = gestureOrigin.current.x >= width - 44 ? 'back' : secondarySection ? 'meals' : 'drawer';
      if (gestureMode.current === 'back' && !preferences.reduceMotion) {
        const offset = secondarySection ? overlayOffset : backOffset;
        offset.stopAnimation();
        offset.setValue(0);
        const previous = history.current[history.current.length - 1];
        const baseIsDiary = tab === 'diary' || mealsOrigin.current === 'diary';
        const previousIsBase = secondarySection && previous && !previous.settingsOpen && !previous.goalOpen && !previous.progressOpen &&
          (baseIsDiary ? previous.tab === 'diary' && previous.diarySection === 'meals' :
            previous.tab === 'home' && previous.groupSection === 'meals' && previous.groupId === activeGroupId);
        setBackPreview(previousIsBase ? null : previous);
      } else if (gestureMode.current === 'meals') {
        overlayOffset.stopAnimation();
        overlayOffset.setValue(0);
      } else if (gestureMode.current === 'drawer') {
        drawerSlide.stopAnimation();
        drawerSlide.setValue(0);
        setDrawerDragging(true);
      }
    },
    onPanResponderMove: (_event, gesture) => {
      const horizontal = gesture.moveX - gestureOrigin.current.x;
      if (gestureMode.current === 'back' && !preferences.reduceMotion) {
        (secondarySection ? overlayOffset : backOffset).setValue(Math.max(-width, Math.min(0, horizontal)));
      } else if (gestureMode.current === 'meals' && !preferences.reduceMotion) {
        overlayOffset.setValue(Math.max(0, Math.min(width, horizontal)));
      } else if (gestureMode.current === 'drawer') {
        drawerSlide.setValue(Math.max(0, Math.min(1, horizontal / Math.min(width - 34, 344))));
      }
    },
    onPanResponderRelease: (event, gesture) => {
      const origin = gestureOrigin.current;
      const horizontal = gesture.moveX - origin.x;
      const vertical = event.nativeEvent.pageY - origin.y;
      const completesBack = gestureMode.current === 'back' &&
        (horizontal <= -55 || (horizontal <= -30 && gesture.vx < -0.4)) &&
        -horizontal > Math.abs(vertical) * 1.2;
      const drawerDistance = Math.min(70, Math.max(18, (width - origin.x) * 0.25));
      const enoughMovement = horizontal >= drawerDistance || (horizontal >= 24 && gesture.vx > 0.35);
      const completesDrawer = gestureMode.current === 'drawer' && enoughMovement &&
        horizontal > Math.abs(vertical) * 1.25;
      const completesMeals = gestureMode.current === 'meals' && enoughMovement &&
        horizontal > Math.abs(vertical) * 1.25;
      if (gestureMode.current === 'back') {
        gestureMode.current = null;
        if (preferences.reduceMotion) {
          if (completesBack) gestureActions.current.back();
          return;
        }
        backAnimationRunning.current = true;
        const offset = secondarySection ? overlayOffset : backOffset;
        Animated.timing(offset, {
          toValue: completesBack ? -width : 0,
          duration: completesBack ? 180 : 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }).start(({ finished }) => {
          backAnimationRunning.current = false;
          if (finished && completesBack) {
            gestureActions.current.back();
          } else {
            offset.setValue(0);
            setBackPreview(null);
          }
        });
      } else if (gestureMode.current === 'meals') {
        gestureMode.current = null;
        backAnimationRunning.current = true;
        Animated.timing(overlayOffset, {
          toValue: completesMeals && !preferences.reduceMotion ? width : 0,
          duration: preferences.reduceMotion ? 0 : completesMeals ? 180 : 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }).start(({ finished }) => {
          backAnimationRunning.current = false;
          if (finished && completesMeals) gestureActions.current.returnToMeals();
          else { overlayOffset.setValue(0); setBackPreview(null); }
        });
      } else if (gestureMode.current === 'drawer') {
        gestureMode.current = null;
        backAnimationRunning.current = true;
        Animated.timing(drawerSlide, {
          toValue: completesDrawer ? 1 : 0,
          duration: preferences.reduceMotion ? 0 : completesDrawer ? 180 : 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }).start(({ finished }) => {
          if (finished && completesDrawer) gestureActions.current.openDrawer();
          setDrawerDragging(false);
          backAnimationRunning.current = false;
        });
      }
    },
    onPanResponderTerminate: () => {
      const wasDrawer = gestureMode.current === 'drawer';
      gestureMode.current = null;
      backAnimationRunning.current = true;
      Animated.timing(wasDrawer ? drawerSlide : secondarySection ? overlayOffset : backOffset, {
        toValue: 0,
        duration: preferences.reduceMotion ? 0 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        backAnimationRunning.current = false;
        setDrawerDragging(false);
        setBackPreview(null);
      });
    },
    onPanResponderTerminationRequest: () => false,
  }), [gesturesEnabled, secondarySection, tab, activeGroupId, width, preferences.reduceMotion, backOffset, overlayOffset, drawerSlide]);
  const points = journal.points;
  const today = localDate(new Date());
  const streak = currentStreak(journal.dates);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  const weekDays = journal.dates.filter(date => date >= localDate(weekStart) && date <= today).length;

  useLayoutEffect(() => {
    if (!assessment || reassessing) return;
    const screen: ScreenState = { tab, groupId: activeGroupId, groupSection, settingsOpen, goalOpen, progressOpen, diarySection, returnToChats };
    const visibleKey = (value: ScreenState) => JSON.stringify({
      tab: value.tab,
      groupId: value.tab === 'home' ? value.groupId : null,
      groupSection: value.tab === 'home' ? value.groupSection : null,
      settingsOpen: value.settingsOpen,
      goalOpen: value.goalOpen,
      progressOpen: value.progressOpen,
      diarySection: value.tab === 'diary' ? value.diarySection : null,
    });
    if (currentScreen.current && visibleKey(currentScreen.current) !== visibleKey(screen)) {
      if (!restoringScreen.current) {
        history.current.push(currentScreen.current);
        if (history.current.length > 50) history.current.shift();
      }
      if (restoringScreen.current) {
        backOffset.setValue(0);
        overlayOffset.setValue(0);
        setBackPreview(null);
      }
      restoringScreen.current = false;
    }
    currentScreen.current = screen;
  });

  gestureActions.current = {
    openDrawer: () => setDrawerOpen(true),
    returnToMeals: () => {
      const destination = tab === 'diary' || mealsOrigin.current === 'diary' ? 'diary' : 'home';
      let index = history.current.length - 1;
      while (index >= 0) {
        const screen = history.current[index];
        if (screen.tab === destination && !screen.settingsOpen && !screen.goalOpen && !screen.progressOpen &&
          (destination === 'diary' ? screen.diarySection === 'meals' : screen.groupId === activeGroupId && screen.groupSection === 'meals')) break;
        index--;
      }
      if (index >= 0) history.current.splice(index);
      restoringScreen.current = true;
      setTab(destination);
      setGroupSection('meals');
      setDiarySection('meals');
      setReturnToChats(false);
    },
    back: () => {
      const previous = history.current.pop();
      if (!previous) return;
      restoringScreen.current = true;
      mealsOrigin.current = previous.tab === 'diary' || previous.returnToChats || previous.diarySection === 'ranking' ? 'diary' : 'group';
      setTab(previous.tab);
      setActiveGroupId(previous.groupId);
      setGroupSection(previous.groupSection);
      setSettingsOpen(previous.settingsOpen);
      setGoalOpen(previous.goalOpen);
      setProgressOpen(previous.progressOpen);
      setDiarySection(previous.diarySection);
      setReturnToChats(previous.returnToChats);
      setDrawerOpen(false);
    },
  };

  useEffect(() => {
    if (Platform.OS !== 'android' || !assessment || reassessing || drawerOpen || sheet) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!history.current.length) return false;
      gestureActions.current.back();
      return true;
    });
    return () => listener.remove();
  }, [assessment, reassessing, drawerOpen, sheet]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem('@prato-a-prato/journal/v1').then(raw => {
      if (!active) return;
      const loaded = readJournal(raw);
      if (loaded === null) { setJournalLoad('invalid'); return; }
      lastJournal.current = loaded;
      setJournal(loaded);
      setJournalLoad('ready');
    }).catch(() => { if (active) setJournalLoad('unavailable'); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (journalLoad !== 'ready' || journal === lastJournal.current) return;
    lastJournal.current = journal;
    let current = true;
    const snapshot = JSON.stringify(journal);
    journalWrites.current = journalWrites.current.then(() => AsyncStorage.setItem('@prato-a-prato/journal/v1', snapshot))
      .then(() => { if (current) setJournalSaveFailed(false); })
      .catch(() => { if (current) setJournalSaveFailed(true); });
    return () => { current = false; };
  }, [journal, journalLoad]);

  useEffect(() => {
    if (desktop) setDrawerOpen(false);
  }, [desktop]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function openSettings() {
    setDiarySection('meals');
    setReturnToChats(false);
    setProgressOpen(false);
    setTab('profile');
    setGoalOpen(false);
    setSettingsOpen(true);
    setDrawerOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function openDetailedGoal() {
    setDiarySection('meals');
    setReturnToChats(false);
    setProgressOpen(false);
    setTab('profile');
    setSettingsOpen(false);
    setGoalOpen(true);
    setDrawerOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function openCreateGroup() {
    groupSubmitted.current = false;
    setDrawerOpen(false);
    setGroupName('');
    setGroupDescription('');
    setGroupError('');
    setChallengeStart(''); setChallengeEnd(''); setChallengeError(null);
    setSheet('createGroup');
  }

  function createGroup() {
    if (groupSubmitted.current) return;
    const name = groupName.trim();
    if (name.length < 2) {
      setGroupError(t('Escolha um nome com pelo menos 2 caracteres.'));
      groupNameInput.current?.focus();
      return;
    }
    if ([t('Grupo Raiz'), 'Grupo Raiz', ...createdGroups.map(group => group.name)].some(existing => existing.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setGroupError(t('Você já tem um grupo com esse nome.'));
      groupNameInput.current?.focus();
      return;
    }
    const periodError = validateChallengeDates(challengeStart, challengeEnd);
    if (periodError) { setChallengeError(periodError); return; }
    groupSubmitted.current = true;
    const id = `group-${Date.now()}`;
    setCreatedGroups(previous => [...previous, { id, name, description: groupDescription.trim(), challengeStart, challengeEnd }]);
    setSheet(null);
    openGroup(id);
    notify(t('Seu grupo foi criado nesta sessão.'));
  }

  function notify(message: string) {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }
  function changeTab(next: Tab) {
    setTab(next);
    setSettingsOpen(false);
    setGoalOpen(false);
    setProgressOpen(false);
    setDiarySection('meals');
    setReturnToChats(false);
    setDrawerOpen(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }
  function toggle(id: string, list: string[], setter: (value: string[]) => void) {
    setter(list.includes(id) ? list.filter(value => value !== id) : [...list, id]);
  }
  function publish() {
    const photo = draftPhoto(mealDraft);
    if (!photo || !journalReady || mealPublished.current) return;
    mealPublished.current = true;
    const recordedAt = Date.now();
    const dateToday = localDate(new Date(recordedAt));
    const alreadyToday = journal.dates.includes(dateToday);
    const previousDays = currentStreak(journal.dates, true);
    const nextStreak = alreadyToday ? streak : previousDays + 1;
    const bonus = alreadyToday || nextStreak < 2 ? 0 : Math.min(nextStreak, 5);
    const earned = 5 + bonus;
    const meal: Meal = {
      id: `local-${recordedAt}`, author: 'Você', initials: 'EF', color: '#E7DFF5', mine: true,
      time: new Date(recordedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), recordedAt,
      category: mealDraft.category, title: photo.label, caption: mealDraft.caption.trim(),
      image: photo.image, goal, likes: 0, groupId: tab === 'diary' ? mealDraft.diaryGroupId : activeGroupId,
      ingredients: mealDraft.ingredients.trim(), earnedPoints: earned, streakBonus: bonus,
    };
    setJournal(previous => ({ ...previous, dates: alreadyToday ? previous.dates : [...previous.dates, dateToday], points: previous.points + earned }));
    setMeals(previous => [meal, ...previous]);
    Keyboard.dismiss();
    setSheet(null);
    if (tab === 'home' && groupSection !== 'meals') setGroupSection('meals');
    notify(`Refeição registrada: +${earned} pontos${bonus ? ` (inclui +${bonus} pela sequência)` : ''}.`);
  }
  function registerWeight(kg: number, index?: number) {
    if (!journalReady) return;
    if (index !== undefined) {
      setJournal(previous => ({ ...previous, weights: previous.weights.map((entry, i) => i === index ? { ...entry, kg } : entry) }));
      notify('Peso corrigido.');
      return;
    }
    const now = new Date();
    const today = localDate(now);
    now.setDate(now.getDate() - 6);
    const weekStart = localDate(now);
    const bonusFor = (weights: typeof journal.weights) => weights.some(entry => entry.date >= weekStart && entry.date <= today) ? 0 : 5;
    setJournal(previous => ({ ...previous, weights: [...previous.weights, { date: today, kg }], points: previous.points + bonusFor(previous.weights) }));
    notify(bonusFor(journal.weights) ? 'Peso registrado. +5 pontos pelo acompanhamento.' : 'Peso registrado.');
  }
  function openGroup(id: string) {
    if (id !== activeGroupId) groupFeedOffset.current = 0;
    setGroupSection('meals');
    mealsOrigin.current = 'group';
    setActiveGroupId(id);
    changeTab('home');
  }
  function returnToDiaryList(section: 'chat' | 'ranking') {
    const stack = history.current;
    let index = stack.length - 1;
    while (index >= 0 && !(stack[index].tab === 'diary' && stack[index].diarySection === section)) index--;
    if (index >= 0) {
      stack.splice(index);
      restoringScreen.current = true;
    }
    Keyboard.dismiss();
    setTab('diary');
    setDiarySection(section);
    setReturnToChats(false);
  }
  function openGroupChat(id: string) {
    if (id !== activeGroupId) groupFeedOffset.current = 0;
    mealsOrigin.current = 'diary';
    setActiveGroupId(id);
    setGroupSection('chat');
    setDiarySection('chat');
    setReturnToChats(true);
    setTab('home');
  }
  function openGroupRanking(id: string) {
    if (id !== activeGroupId) groupFeedOffset.current = 0;
    mealsOrigin.current = 'diary';
    setActiveGroupId(id);
    setGroupSection('ranking');
    setDiarySection('ranking');
    setReturnToChats(false);
    setTab('home');
  }
  function inviteActiveGroup() {
    if (activeGroupId === 'raiz') setSheet('invite');
    else notify(t('Os convites ainda não estão disponíveis nesta prévia.'));
  }
  function compose() {
    if (mealPublished.current) setMealDrafts(previous => {
      const remaining = { ...previous };
      delete remaining[draftKey];
      return remaining;
    });
    setDraftKey(tab === 'diary' ? 'diary' : activeGroupId);
    mealPublished.current = false;
    setSheet('compose');
  }
  function updateMealDraft(changes: Partial<MealDraft>) {
    setMealDrafts(previous => ({
      ...previous, [draftKey]: { ...(previous[draftKey] ?? emptyMealDraft), ...changes },
    }));
  }
  function openFeedback(meal: Meal) { setSelectedMeal(meal); setSheet('feedback'); }

  function renderGoalCard() {
    return <Pressable onPress={openDetailedGoal} accessibilityRole="button" accessibilityLabel={t("Minha meta pessoal")}
      style={({ pressed }) => [s.goalCard, pressed && s.pressed]}>
      <View style={s.goalTop}><View style={s.inline}><View style={s.tinyIcon}><Icon name="leaf-outline" size={15} color={C.purple} /></View><Text style={s.goalEyebrow}>{t("Sua meta, seu ritmo")}</Text></View><Icon name="chevron-forward" size={16} color={C.purple} /></View>
      <View style={s.goalMain}><View style={s.flex}><Text style={s.goalTitle}>{t(goal)}</Text><Text style={s.goalSub}>{t('{count} dias com registros nos últimos 7 dias', { count: weekDays })}</Text></View></View>
      <View style={s.goalBottom}><View style={s.inline}><Icon name="flame" size={16} color={C.orange} /><Text style={s.goalFootText}>{t('{count} dias de sequência', { count: streak })}</Text></View><Text style={s.goalWeek}>{t('Ver minha meta')}</Text></View>
    </Pressable>;
  }

  function renderMealCard(meal: Meal) {
    const isLiked = liked.includes(meal.id);
    const isSaved = saved.includes(meal.id);
    return <View style={s.mealCard}>
      <View style={s.mealHeader}><Avatar initials={meal.initials} color={meal.color} />
        <View style={s.flex}><Text style={s.author}>{t(meal.author)}</Text><Text style={s.meta}>{meal.id.startsWith('local-') ? t(meal.time) : t('Exemplo')} <Text style={s.dot}>{t("·")}</Text> {t(meal.category)}</Text></View>
        <View style={[s.groupTag, { maxWidth: '48%' }]}><Icon name={meal.groupId ? 'people-outline' : 'lock-closed-outline'} size={12} color={C.purple} /><Text numberOfLines={2} style={[s.groupTagText, { flexShrink: 1 }]}>{meal.groupId ? availableGroups.find(group => group.id === meal.groupId)?.name : 'Só no diário'}</Text></View>
      </View>
      <View style={s.photoWrap}><Image source={meal.image} style={s.mealPhoto} resizeMode="cover" fadeDuration={0} accessibilityLabel={t(meal.title)} />
        <View style={s.photoLabel}><Icon name="restaurant-outline" size={13} color={C.ink} /><Text style={s.photoLabelText}>{t(meal.category)}</Text></View>
      </View>
      <View style={s.mealBody}><Text style={s.mealTitle}>{t(meal.title)}</Text>{!!meal.caption && <Text style={s.caption}>{meal.id.startsWith('local-') ? meal.caption : t(meal.caption)}</Text>}{!!meal.ingredients && <Text style={s.caption}>Alimentos e quantidades: {meal.ingredients}</Text>}{!preferences.showFeedback && meal.earnedPoints !== undefined && <Text style={s.smallPurple}>+{meal.earnedPoints} pontos</Text>}
        {preferences.showFeedback && <Pressable accessibilityRole="button" accessibilityLabel={meal.earnedPoints !== undefined ? 'Ver pontos desta refeição' : meal.mine ? t('Ver relação com sua meta') : t('Ver relação com a meta de {name}', { name: meal.author })} onPress={() => openFeedback(meal)} style={({ pressed }) => [s.feedback, !meal.feedback && { backgroundColor: C.bg }, pressed && s.pressed]}>
          <View style={[s.feedbackIcon, !meal.feedback && { backgroundColor: C.neutralSurface }]}><Icon name={meal.feedback ? 'checkmark' : 'receipt-outline'} size={13} color={meal.feedback ? C.green : C.purple} /></View>
          <View style={s.flex}><Text style={[s.feedbackTitle, !meal.feedback && { color: C.ink }]}>{meal.earnedPoints !== undefined ? `+${meal.earnedPoints} pontos` : t('Um passo na direção da meta')}</Text><Text style={s.feedbackGoal}>{meal.feedback ? t(meal.goal) : 'Ver detalhes do registro'}</Text></View>
          <Icon name="chevron-forward" size={15} color={meal.feedback ? C.green : C.muted} />
        </Pressable>}
        <View style={s.mealActions}><Pressable accessibilityRole="button" accessibilityLabel={meal.mine ? t(isLiked ? 'Remover apoio da sua refeição' : 'Apoiar sua refeição') : t(isLiked ? 'Remover apoio de {name}' : 'Apoiar refeição de {name}', { name: meal.author })} accessibilityState={{ selected: isLiked }} onPress={() => toggle(meal.id, liked, setLiked)} style={s.likeButton}>
          <Icon name={isLiked ? 'heart' : 'heart-outline'} size={22} color={isLiked ? C.like : C.inactiveIcon} /><Text style={[s.likeText, isLiked && { color: C.like }]}>{t(meal.likes + (isLiked ? 1 : 0) === 1 ? '{count} apoio' : '{count} apoios', { count: meal.likes + (isLiked ? 1 : 0) })}</Text>
        </Pressable><Pressable accessibilityRole="button" accessibilityLabel={t(isSaved ? 'Remover dos salvos: {title}' : 'Salvar refeição: {title}', { title: t(meal.title) })} accessibilityState={{ selected: isSaved }} onPress={() => { toggle(meal.id, saved, setSaved); if (!isSaved) notify(t('Refeição salva no seu perfil.')); }} style={s.saveButton}>
          <Icon name={isSaved ? 'bookmark' : 'bookmark-outline'} size={21} color={isSaved ? C.purple : C.inactiveIcon} />
        </Pressable></View>
      </View>
    </View>;
  }

  function renderWeekStrip() {
    const today = new Date();
    return <View style={s.weekStrip}>{Array.from({ length: 7 }, (_, index) => {
      const current = new Date(today); current.setDate(today.getDate() - 6 + index);
      const day = current.toLocaleDateString(locale, { weekday: 'short' }).charAt(0).toUpperCase();
      const completed = journal.dates.includes(localDate(current));
      const isToday = current.toDateString() === today.toDateString();
      return <View key={index} style={s.weekDay}><Text style={s.dayLabel}>{day}</Text><View style={[s.dayCircle, completed && s.dayComplete, isToday && s.dayToday]}>
        {completed ? <Icon name="checkmark" size={17} color={C.purple} /> : <Text style={s.dayNumber}>{current.getDate()}</Text>}
      </View>{isToday ? <View style={s.dayDot} /> : <View style={s.dotSpace} />}</View>;
    })}</View>;
  }

  function renderPersonalPage(screen: ScreenState, isPreview = false) {
    const { tab, settingsOpen, goalOpen, progressOpen, diarySection } = screen;
    const isDiaryFeed = tab === 'diary' && diarySection === 'meals' && !settingsOpen && !goalOpen && !progressOpen;
    return <ScrollView ref={isPreview ? undefined : isDiaryFeed ? diaryFeedScroll : scrollRef} contentContainerStyle={[s.scroll, !desktop && { paddingTop: 17, paddingBottom: 36 }, tab === 'diary' && (diarySection === 'meals' || desktop) && !settingsOpen && !goalOpen && !progressOpen && { paddingBottom: 125 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} contentOffset={isPreview && isDiaryFeed ? { x: 0, y: diaryFeedOffset.current } : undefined} onScroll={isDiaryFeed && !isPreview ? event => { diaryFeedOffset.current = event.nativeEvent.contentOffset.y; } : undefined} scrollEventThrottle={16}>
          <View style={[s.contentLayout, { paddingHorizontal: width < 370 ? 16 : 22 }, desktop && s.desktopContent]}>
            <View style={[s.mainColumn, { maxWidth: 740 }]}>
              {(settingsOpen || goalOpen || progressOpen) && !desktop && <View style={[s.inline, { marginBottom: 4 }]}><Text style={s.meta}>{t('Meu espaço')}</Text></View>}
              {settingsOpen ? <SettingsScreen onBack={gestureActions.current.back} /> : goalOpen && assessment ? <GoalOverview assessment={assessment} onBack={gestureActions.current.back} onReassess={() => setReassessing(true)} /> : progressOpen ? <WeightProgress weights={journal.weights} ready={journalReady} onBack={gestureActions.current.back} onSave={registerWeight} /> : <>
                {!desktop && tab === 'diary' && diarySection !== 'meals' && <Pressable accessibilityRole="button" accessibilityLabel={t('Voltar para refeições')} onPress={() => gestureActions.current.returnToMeals()} style={({ pressed }) => [s.backLink, pressed && s.pressed]}>
                  <Icon name="chevron-back" size={19} color={C.purple} /><Text style={s.smallPurple}>{t('Refeições')}</Text>
                </Pressable>}
                <View style={s.header}><View style={s.flex}><Text style={s.greeting}>{t(tab === 'diary' && diarySection === 'chat' ? 'Suas conversas' : tab === 'diary' && diarySection === 'details' ? 'Sua jornada pessoal' : tab === 'diary' && diarySection === 'ranking' ? 'Seus grupos, seus rankings' : tab === 'diary' ? 'Seu caminho, refeição por refeição' : tab === 'groups' ? 'Cada pessoa com a própria meta' : 'O cuidado começa com você')}</Text><Text style={s.pageTitle}>{tab === 'diary' && diarySection !== 'meals' ? t(diarySection === 'chat' ? 'Chats' : diarySection === 'details' ? 'Detalhes' : 'Ranking') : navigation.find(item => item.id === tab)?.label}<Text style={s.titleDot}>.</Text></Text></View>
                  {!desktop && (tab !== 'diary' || diarySection === 'meals') && <AccountMenuButton onPress={gestureActions.current.openDrawer} />}
                </View>
              {tab === 'diary' && diarySection === 'chat' && <ChatList groups={availableGroups} messages={chatMessages} drafts={chatDrafts} onOpen={openGroupChat} />}
              {tab === 'diary' && diarySection === 'details' && <DiaryDetails goal={null} assessmentWeight={assessment?.weight} goalTitle={assessment ? personalizedGoal(assessment) : undefined} journal={journal} streak={streak} weekDays={weekDays} onEditGoal={openDetailedGoal} onWeight={() => { setTab('profile'); setProgressOpen(true); }} />}
              {tab === 'diary' && diarySection === 'ranking' && <RankingList groups={availableGroups} onOpen={openGroupRanking} />}
              {tab === 'diary' && diarySection === 'meals' && <>
                {renderGoalCard()}<View style={s.panel}><View style={s.sectionRow}><Text style={s.panelTitle}>{t("Últimos 7 dias")}</Text><Text style={s.smallPurple}>{t('{count} dias com registros', { count: weekDays })}</Text></View>{renderWeekStrip()}<View style={s.statRow}><View style={s.statItem}><Text style={s.statValue}>{streak}<Icon name="flame" size={17} color={C.orange} /></Text><Text style={s.statLabel}>{t("dias de sequência")}</Text></View><View style={s.statDivider} /><View style={s.statItem}><Text style={s.statValue}>{points}</Text><Text style={s.statLabel}>{t("pontos acumulados")}</Text></View></View></View>
                <View style={s.feedHeading}>
                  <View style={s.flex}><Text style={s.sectionTitle}>Seu diário</Text><Text style={s.sectionSubtitle}>{t(meals.filter(m => m.mine).length === 1 ? '{count} refeição' : '{count} refeições', { count: meals.filter(m => m.mine).length })}</Text></View>
                  {desktop && <IconButton name="add" label="Registrar refeição no diário" onPress={compose} active />}
                </View>
                {meals.filter(m => m.mine).map(meal => <React.Fragment key={meal.id}>{renderMealCard(meal)}</React.Fragment>)}
              </>}

                
              {tab === 'groups' && <>
                <View style={[s.sectionRow, { marginBottom: 20 }]}><View style={s.flex}><Text style={s.sectionTitle}>{t('Seus grupos')}</Text><Text style={s.sectionSubtitle}>{t('Escolha um grupo para ver refeições, detalhes, ranking e conversa.')}</Text></View><IconButton name="add" label={t('Criar grupo')} onPress={openCreateGroup} active /></View>
                {availableGroups.map(group => <Pressable key={group.id} accessibilityRole="button" accessibilityLabel={t('Abrir grupo: {name}', { name: group.name })} onPress={() => openGroup(group.id)} style={({ pressed }) => [s.panel, { borderWidth: 1, borderColor: group.id === activeGroupId ? C.accentLine : C.line }, pressed && s.pressed]}>
                  <View style={s.sectionRow}><View style={[s.groupHeroIcon, { width: 48, height: 48, marginBottom: 0, borderRadius: 16 }]}><Icon name={group.id === 'raiz' ? 'leaf-outline' : 'people-outline'} size={24} color={C.purple} /></View><View style={s.flex}><Text style={[s.panelTitle, { fontSize: 17 }]}>{group.name}</Text><Text style={s.meta}>{t(group.id === 'raiz' ? '4 pessoas · grupo privado' : '1 pessoa · grupo privado')}</Text></View><Icon name="chevron-forward" size={19} color={C.purple} /></View>
                  <Text style={[s.caption, { marginTop: 14 }]}>{group.description}</Text>
                  <View style={[s.inline, { borderTopWidth: 1, borderTopColor: C.line, marginTop: 16, paddingTop: 13 }]}><Icon name="enter-outline" size={17} color={C.purple} /><Text style={[s.secondaryText, { flex: 1 }]}>{t('Abrir grupo')}</Text>{group.id === activeGroupId && <Text style={s.smallPurple}>{t('Grupo selecionado')}</Text>}</View>
                </Pressable>)}
              </>}

              {tab === 'profile' && <>
                <View style={s.profileCard}><Avatar initials="EF" size={88} /><Text style={s.profileName}>{t("Enzo Fraga")}</Text><Text style={s.sectionSubtitle}>{t("Um prato de cada vez.")}</Text><View style={s.profileStats}><View style={s.statItem}><Text style={s.statValue}>{points}</Text><Text style={s.statLabel}>{t("pontos")}</Text></View><View style={s.statDivider} /><View style={s.statItem}><Text style={s.statValue}>{streak}</Text><Text style={s.statLabel}>{t("dias seguidos")}</Text></View><View style={s.statDivider} /><View style={s.statItem}><Text style={s.statValue}>{createdGroups.length + 1}</Text><Text style={s.statLabel}>{t(createdGroups.length === 0 ? "grupo" : "grupos")}</Text></View></View></View>
                <Text style={s.listHeading}>{t("SEU ESPAÇO")}</Text><View style={s.settingsList}>
                  <SettingsRow icon="flag-outline" title={t("Minha meta pessoal")} detail={t(goal)} onPress={openDetailedGoal} />
                  <SettingsRow icon="analytics-outline" title="Meu progresso" detail="Registrar peso e consultar histórico" onPress={() => { setProgressOpen(true); scrollRef.current?.scrollTo({ y: 0, animated: false }); }} />
                  <SettingsRow icon="bookmark-outline" title={t("Refeições salvas")} detail={t(saved.length === 1 ? '{count} refeição' : '{count} refeições', { count: saved.length })} onPress={() => setSheet('saved')} />
                  <SettingsRow icon="people-outline" title={t('Meus grupos')} detail={t(availableGroups.length === 1 ? '1 grupo' : '{count} grupos', { count: availableGroups.length })} onPress={() => changeTab('groups')} />
                  <SettingsRow icon="settings-outline" title={t("Configurações")} detail={t("Personalize sua experiência")} onPress={openSettings} last />
                </View><View style={s.previewNote}><Icon name="flask-outline" size={18} color={C.purple} /><Text style={s.previewNoteText}>{t('Sua meta, suas refeições e seus grupos ficam nesta sessão. As preferências, os pontos e os registros de peso ficam salvos neste dispositivo.')}</Text></View>
              </>}
              </>}
            </View>
          </View>
        </ScrollView>;
  }

  const availableGroups = [
    { id: 'raiz', name: t('Grupo Raiz'), description: t('Juntos na constância. Cada um no seu caminho.'), isDemo: true },
    ...createdGroups.map(group => ({ ...group, isDemo: true })),
  ];
  const activeGroup = availableGroups.find(group => group.id === activeGroupId) ?? availableGroups[0];
  const groupView = tab === 'home' && !settingsOpen && !goalOpen && !progressOpen;
  const diaryFeedVisible = tab === 'diary' && diarySection === 'meals' && !settingsOpen && !goalOpen && !progressOpen;
  const showDiaryBase = secondarySection ? tab === 'diary' || mealsOrigin.current === 'diary' : diaryFeedVisible;
  const showGroupBase = secondarySection ? !showDiaryBase : groupView;

  function renderBackPreview() {
    if (!backPreview) return null;
    const offset = secondarySection ? overlayOffset : backOffset;
    return <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
      style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, transform: [{ translateX: offset.interpolate({
        inputRange: [-width, 0, width], outputRange: [0, width * 0.15, 0], extrapolate: 'clamp',
      }) }] }]}>
      {backPreview.tab === 'home' && !backPreview.settingsOpen && !backPreview.goalOpen && !backPreview.progressOpen
        ? <GroupWorkspace group={availableGroups.find(group => group.id === backPreview.groupId) ?? availableGroups[0]}
            meals={meals.filter(meal => meal.groupId === backPreview.groupId)} renderMeal={renderMealCard}
            goal={goal} onCompose={() => {}} onInvite={() => {}} onBackToGroups={() => {}}
            section={backPreview.groupSection} onSectionChange={() => {}} messages={chatMessages} onMessagesChange={setChatMessages}
            onBackToChats={backPreview.returnToChats ? () => {} : undefined} onBackToRankings={backPreview.diarySection === 'ranking' ? () => {} : undefined}
            initialFeedOffset={groupFeedOffset.current} onOpenMenu={gestureActions.current.openDrawer} onBackFromDetails={gestureActions.current.back} secondaryOnly={backPreview.groupSection !== 'meals'} />
        : <>{renderPersonalPage(backPreview, true)}
            {backPreview.tab === 'diary' && backPreview.diarySection === 'meals' && !backPreview.settingsOpen && !backPreview.goalOpen && !backPreview.progressOpen &&
              <GroupNavigation selected="meals" onSelect={() => {}} />}</>}
    </Animated.View>;
  }

  if (!ready) return <SafeAreaView style={[s.safe, { alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={C.purple} accessibilityLabel={t("Carregando suas preferências")} /></SafeAreaView>;
  if (!assessment || reassessing) return <Onboarding mode={assessment ? 'reassess' : 'signup'} initial={assessment ?? undefined} onCancel={assessment ? () => setReassessing(false) : undefined} onComplete={value => { if (!assessment) setTab(preferences.defaultFeed === 'mine' ? 'diary' : 'home'); setAssessment(value); setGoal(personalizedGoal(value)); setReassessing(false); }} />;

  return <SafeAreaView style={s.safe}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
    {!!journalNotice && <View accessibilityRole="alert" style={[s.previewNote, { marginHorizontal: 12, marginVertical: 6 }]}>
      <Icon name="information-circle-outline" color={C.purple} size={18} />
      <Text style={s.previewNoteText}>{journalNotice}</Text>
    </View>}
    <View style={s.app} accessibilityElementsHidden={drawerOpen} importantForAccessibility={drawerOpen ? 'no-hide-descendants' : 'auto'} aria-hidden={drawerOpen}>
      {desktop && <View style={[s.sidebar, { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 }]}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 30, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          <View style={[s.brand, { marginBottom: 22 }]}><View style={s.brandMark}><Icon name="leaf" size={23} color={C.onAccent} /></View><View><Text style={s.brandName}>{t('prato a prato')}<Text style={{ color: C.purple }}>.</Text></Text><Text style={s.brandSub}>{t('crescer juntos, no seu ritmo')}</Text></View></View>
          <View style={[s.inline, { justifyContent: 'space-between', paddingHorizontal: 8, marginBottom: 20 }]}><Text style={s.meta}>{points} {t('pontos')}</Text><View style={s.inline}><Icon name="flame" size={14} color={C.orange} /><Text style={s.meta}>{t('{count} dias de sequência', { count: streak })}</Text></View></View>
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
      <View style={[s.workspace, { overflow: 'hidden', backgroundColor: C.bg }]} {...panResponder.panHandlers}>
        {!secondarySection && renderBackPreview()}
        <Animated.View pointerEvents={drawerDragging ? 'none' : 'auto'} style={{ flex: 1, backgroundColor: C.bg, transform: [{ translateX: backOffset }] }}>
          <View pointerEvents={showGroupBase && !secondarySection ? 'auto' : 'none'}
            accessibilityElementsHidden={!showGroupBase || secondarySection}
            importantForAccessibility={!showGroupBase || secondarySection ? 'no-hide-descendants' : 'auto'}
            aria-hidden={!showGroupBase || secondarySection}
            style={[StyleSheet.absoluteFill, !showGroupBase && { display: 'none' }]}>
            <GroupWorkspace group={activeGroup} meals={meals.filter(meal => meal.groupId === activeGroupId)} renderMeal={renderMealCard} goal={goal} onCompose={compose} onInvite={inviteActiveGroup} onBackToGroups={() => changeTab('groups')} section="meals" onOpenMenu={gestureActions.current.openDrawer} onSectionChange={section => { mealsOrigin.current = 'group'; setGroupSection(section); }} messages={chatMessages} onMessagesChange={setChatMessages} onFeedScroll={offset => { groupFeedOffset.current = offset; }} />
          </View>
          <View pointerEvents={showDiaryBase && !secondarySection ? 'auto' : 'none'}
            accessibilityElementsHidden={!showDiaryBase || secondarySection}
            importantForAccessibility={!showDiaryBase || secondarySection ? 'no-hide-descendants' : 'auto'}
            aria-hidden={!showDiaryBase || secondarySection}
            style={[StyleSheet.absoluteFill, !showDiaryBase && { display: 'none' }]}>
            {renderPersonalPage({ tab: 'diary', groupId: activeGroupId, groupSection, settingsOpen: false, goalOpen: false, progressOpen: false, diarySection: 'meals', returnToChats: false })}
            <GroupNavigation selected="meals" onCompose={!desktop && !keyboardOpen ? compose : undefined} onSelect={section => { mealsOrigin.current = 'diary'; setDiarySection(section); scrollRef.current?.scrollTo({ y: 0, animated: false }); }} />
          </View>
          {!secondarySection && !groupView && !diaryFeedVisible && renderPersonalPage({ tab, groupId: activeGroupId, groupSection, settingsOpen, goalOpen, progressOpen, diarySection, returnToChats })}
          {secondarySection && renderBackPreview()}
          {secondarySection && <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, transform: [{ translateX: overlayOffset }] }]}>
            {groupView ? <GroupWorkspace secondaryOnly onBackFromDetails={gestureActions.current.back} onBackToMeals={() => gestureActions.current.returnToMeals()} group={activeGroup} meals={meals.filter(meal => meal.groupId === activeGroupId)} renderMeal={renderMealCard} goal={goal} onCompose={compose} onInvite={inviteActiveGroup} onBackToGroups={() => changeTab('groups')} section={groupSection} onSectionChange={setGroupSection} messages={chatMessages} onMessagesChange={setChatMessages} chatDrafts={chatDrafts} onChatDraftsChange={setChatDrafts} onBackToChats={returnToChats ? () => returnToDiaryList('chat') : undefined} onBackToRankings={diarySection === 'ranking' && mealsOrigin.current === 'diary' ? () => returnToDiaryList('ranking') : undefined} /> : <>
              {renderPersonalPage({ tab, groupId: activeGroupId, groupSection, settingsOpen, goalOpen, progressOpen, diarySection, returnToChats })}
              {desktop && tab === 'diary' && <GroupNavigation selected={diarySection} onSelect={section => { mealsOrigin.current = 'diary'; setDiarySection(section); scrollRef.current?.scrollTo({ y: 0, animated: false }); }} />}
            </>}
          </Animated.View>}
        {!!toast && <View pointerEvents="none" style={[s.toastWrap, { bottom: groupView ? 110 : 28 }]}><View style={s.toast} accessibilityLiveRegion="polite"><Icon name="checkmark-circle" size={18} color={C.green} /><Text style={s.toastText}>{toast}</Text></View></View>}
        </Animated.View>
      </View>
    </View>
    <NavigationDrawer visible={drawerOpen && !desktop} dragging={drawerDragging && !desktop} slide={drawerSlide} onClose={() => setDrawerOpen(false)} onNavigate={changeTab} onOpenGoal={openDetailedGoal} onOpenSettings={openSettings} onCreateGroup={openCreateGroup} currentTab={tab} settingsOpen={settingsOpen} goalOpen={goalOpen} points={points} streak={streak} goal={goal} groups={createdGroups} activeGroupId={activeGroupId} onSelectGroup={openGroup} />

    {sheet && <BottomSheet closing={sheetClosing} onClose={() => setSheet(null)} onDismissed={dismissSheet}
      title={t(sheet === 'compose' ? 'Registrar refeição' : sheet === 'createGroup' ? 'Criar grupo' : sheet === 'invite' ? 'Convidar para o grupo' : sheet === 'saved' ? 'Refeições salvas' : 'Sobre este registro')}>
            {sheet === 'createGroup' && <>
              <Text style={s.sheetIntro}>{t('Crie um espaço para compartilhar refeições. Cada pessoa continua com sua própria meta.')}</Text>
              <Text style={s.fieldLabel}>{t('Nome do grupo')}</Text>
              <TextInput ref={groupNameInput} value={groupName} onChangeText={value => { setGroupName(value); setGroupError(''); }}
                placeholder={t('Ex.: Amigos à mesa')} placeholderTextColor={C.textFaint} accessibilityLabel={t('Nome do grupo')}
                accessibilityHint={groupError || undefined} maxLength={48} autoCapitalize="sentences"
                style={[s.input, { minHeight: 52 }, !!groupError && { borderColor: C.orange }]} />
              {!!groupError && <Text accessibilityRole="alert" style={[s.caption, { color: C.ink }]}>{groupError}</Text>}
              <Text style={s.fieldLabel}>{t('Descrição (opcional)')}</Text>
              <TextInput value={groupDescription} onChangeText={setGroupDescription} placeholder={t('O que reúne vocês?')}
                placeholderTextColor={C.textFaint} accessibilityLabel={t('Descrição do grupo')} maxLength={240} multiline style={s.input} />
              <GroupChallengeFields start={challengeStart} end={challengeEnd}
                onStart={value => { setChallengeStart(value); setChallengeError(null); }}
                onEnd={value => { setChallengeEnd(value); setChallengeError(null); }} error={challengeError} />
              <View style={s.postAudience}><Icon name="lock-closed-outline" size={17} color={C.purple} /><Text style={[s.meta, s.flex]}>{t('Grupo privado · você começa como administrador')}</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('Criar grupo na prévia')} onPress={createGroup}
                style={({ pressed }) => [s.primaryButton, pressed && s.pressed]}><Icon name="add" size={19} color={C.onAccent} /><Text style={s.primaryText}>{t('Criar grupo na prévia')}</Text></Pressable>
              <Text style={s.sheetFootnote}>{t('Este grupo fica apenas nesta sessão. Ainda não há convites ou sincronização com outras pessoas.')}</Text>
            </>}
            {sheet === 'compose' && <MealComposer draft={mealDraft} groups={availableGroups} groupName={activeGroup.name} inDiary={tab === 'diary'}
              ready={journalReady} onChange={updateMealDraft} onPublish={publish} />}
            {sheet === 'feedback' && selectedMeal && <>
              <View style={s.composePhoto}><Image accessibilityLabel={selectedMeal.title} source={selectedMeal.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" /></View>
              {selectedMeal.earnedPoints !== undefined && <>
                <Text style={s.feedbackGoalTitle}>+{selectedMeal.earnedPoints} pontos</Text>
                <Text style={s.feedbackExplanation}>
                  {selectedMeal.earnedPoints - (selectedMeal.streakBonus ?? 0)} pelo registro da refeição{selectedMeal.streakBonus ? ` e ${selectedMeal.streakBonus} de bônus pela sequência de dias` : ''}.
                </Text>
              </>}
              <Text style={s.fieldLabel}>{selectedMeal.mine ? t('Sua meta') : t('Meta de {name}', { name: selectedMeal.author.split(' ')[0] })}</Text>
              <Text style={s.feedbackGoalTitle}>{t(selectedMeal.goal)}</Text>
              {selectedMeal.feedback && <Text style={s.feedbackExplanation}>{t(selectedMeal.feedback)}</Text>}
              <View style={s.previewNote}><Icon name="information-circle-outline" size={20} color={C.purple} />
                <Text style={s.previewNoteText}>{selectedMeal.feedback ? 'Avaliação ilustrativa de uma refeição de exemplo.' : 'A análise automática dos alimentos ainda não está disponível nesta prévia.'}</Text>
              </View>
            </>}
            {sheet === 'invite' && <><View style={s.sheetIllustration}><Icon name="people-outline" size={42} color={C.purple} /></View><Text style={s.inviteTitle}>{t('Cada pessoa com sua meta.\nTodo mundo com apoio.')}</Text><Text style={s.sheetIntro}>{t("Seu grupo é um lugar para compartilhar refeições e celebrar constância.")}</Text><View style={s.inviteCode}><Icon name="lock-closed-outline" color={C.purple} /><Text selectable style={s.inviteCodeText}>{t("RAIZ-2026")}</Text></View><Text style={s.sheetFootnote}>{t("Código ilustrativo. Convites reais chegam em uma próxima etapa.")}</Text></>}
            {sheet === 'saved' && <SavedMeals meals={meals.filter(meal => saved.includes(meal.id))} onRemove={id => setSaved(previous => previous.filter(savedId => savedId !== id))} />}
    </BottomSheet>}
  </SafeAreaView>;
}

function SettingsRow({ icon, title, detail, onPress, last = false }: { icon: IconName; title: string; detail: string; onPress: () => void; last?: boolean }) {
  const s = useStyles();
  const { colors: C } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [s.settingsRow, !last && s.settingsBorder, pressed && s.pressed]}><View style={s.settingsIcon}><Icon name={icon} size={20} color={C.purple} /></View><View style={s.flex}><Text style={s.settingTitle}>{title}</Text><Text style={s.settingDetail}>{detail}</Text></View><Icon name="chevron-forward" size={17} color={C.inactiveIcon} /></Pressable>;
}
