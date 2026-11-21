import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, PanResponder, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Avatar, Icon, IconButton, IconName } from './ui';
import { Tab } from './data';
import { useAppTheme } from './theme';
import { usePreferences } from './preferences';
import { useI18n } from './i18n';

export type DemoGroup = { id: string; name: string; description: string; challengeStart?: string; challengeEnd?: string };

type Props = {
  visible: boolean;
  dragging: boolean;
  slide: Animated.Value;
  onClose: () => void;
  onNavigate: (tab: Tab) => void;
  onSelectGroup: (id: string) => void;
  onOpenGoal: () => void;
  onOpenSettings: () => void;
  onCreateGroup: () => void;
  currentTab: Tab;
  activeGroupId: string;
  settingsOpen: boolean;
  goalOpen: boolean;
  points: number;
  streak: number;
  goal: string;
  groups: DemoGroup[];
};

const links: { tab: Tab; label: string; icon: IconName }[] = [
  { tab: 'diary', label: 'Diário', icon: 'book-outline' },
  { tab: 'groups', label: 'Meus grupos', icon: 'people-outline' },
  { tab: 'profile', label: 'Perfil', icon: 'person-outline' },
];

export default function NavigationDrawer(props: Props) {
  const { width } = useWindowDimensions();
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const { t } = useI18n();
  const scale = preferences.textSize === 'large' ? 1.15 : 1;
  const isActiveGroup = (id: string) => props.currentTab === 'home' && props.activeGroupId === id && !props.settingsOpen && !props.goalOpen;
  const pendingAction = useRef<(() => void) | null>(null);
  const [mounted, setMounted] = useState(props.visible);
  const slide = props.slide;
  const origin = useRef({ x: 0, y: 0 });
  const gestureClosing = useRef(false);
  const settlingGesture = useRef(false);
  const suppressPress = useRef(false);
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeAction = useRef(props.onClose);
  closeAction.current = props.onClose;

  const closeGesture = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: event => {
      if (!settlingGesture.current) {
        clearTimeout(suppressTimer.current);
        suppressPress.current = false;
      }
      origin.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      return props.visible && !props.dragging && !settlingGesture.current &&
        event.nativeEvent.touches.length === 1 && origin.current.x >= width - 28;
    },
    onMoveShouldSetPanResponderCapture: (event, gesture) => {
      const horizontal = event.nativeEvent.pageX - origin.current.x;
      const vertical = event.nativeEvent.pageY - origin.current.y;
      return props.visible && !props.dragging && !settlingGesture.current &&
        gesture.numberActiveTouches === 1 && horizontal < -8 &&
        -horizontal > Math.abs(vertical) * 1.5;
    },
    onPanResponderGrant: () => {
      suppressPress.current = true;
      slide.stopAnimation();
    },
    onPanResponderMove: (_event, gesture) => {
      const distance = Math.max(0, origin.current.x - gesture.moveX);
      slide.setValue(Math.max(0, 1 - distance / Math.min(width - 34, 344)));
    },
    onPanResponderRelease: (event, gesture) => {
      const lastX = gesture.moveX || event.nativeEvent.pageX;
      const horizontal = origin.current.x - lastX;
      const vertical = Math.abs(event.nativeEvent.pageY - origin.current.y);
      const tappedBackdrop = origin.current.x >= width - 28 && Math.abs(horizontal) < 10 && vertical < 10;
      const closingDistance = Math.min(Math.min(width - 34, 344) * 0.5, Math.max(8, origin.current.x * 0.5));
      const shouldClose = tappedBackdrop || (horizontal >= closingDistance && horizontal > vertical * 1.5);
      settlingGesture.current = true;
      Animated.timing(slide, {
        toValue: shouldClose ? 0 : 1,
        duration: preferences.reduceMotion ? 0 : shouldClose ? 180 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => {
        settlingGesture.current = false;
        suppressTimer.current = setTimeout(() => { suppressPress.current = false; }, 100);
        if (finished && shouldClose) {
          gestureClosing.current = true;
          closeAction.current();
        }
      });
    },
    onPanResponderTerminate: () => {
      settlingGesture.current = true;
      Animated.timing(slide, {
        toValue: 1,
        duration: preferences.reduceMotion ? 0 : 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        settlingGesture.current = false;
        suppressTimer.current = setTimeout(() => { suppressPress.current = false; }, 100);
      });
    },
    onPanResponderTerminationRequest: () => false,
  }), [props.visible, props.dragging, width, preferences.reduceMotion, slide]);
  const go = (action: () => void) => {
    if (suppressPress.current || settlingGesture.current) return;
    pendingAction.current = action;
    props.onClose();
  };
  const close = () => {
    if (!suppressPress.current && !settlingGesture.current) props.onClose();
  };
  useEffect(() => () => clearTimeout(suppressTimer.current), []);
  const finishDismiss = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  };
  useEffect(() => {
    if (!props.visible || Platform.OS !== 'android') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      props.onClose();
      return true;
    });
    return () => listener.remove();
  }, [props.visible, props.onClose]);
  useEffect(() => {
    if (props.dragging) return;
    if (props.visible) setMounted(true);
    else if (!mounted) return;
    if (!props.visible && gestureClosing.current) {
      gestureClosing.current = false;
      setMounted(false);
      finishDismiss();
      return;
    }
    const animation = Animated.timing(slide, {
      toValue: props.visible ? 1 : 0,
      duration: preferences.reduceMotion ? 0 : (props.visible ? 300 : 240),
      easing: props.visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished && !props.visible) {
        setMounted(false);
        finishDismiss();
      }
    });
    return () => animation.stop();
  }, [props.visible, props.dragging, preferences.reduceMotion, slide]);

  if (!mounted && !props.visible && !props.dragging) return null;
  const interactive = (mounted || props.visible) && !props.dragging;
  return <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]} pointerEvents={interactive ? 'auto' : 'none'} {...closeGesture.panHandlers}
    accessibilityElementsHidden={!interactive} importantForAccessibility={interactive ? 'auto' : 'no-hide-descendants'}
    aria-hidden={!interactive}>
    <View style={s.overlay}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim, opacity: slide }]}><Pressable onPress={close} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('Fechar menu')} /></Animated.View>
      <Animated.View style={[s.panel, { width: Math.min(width - 34, 344), backgroundColor: C.surface, borderRightColor: C.line, transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [-Math.min(width - 34, 344), 0] }) }] }]} accessibilityViewIsModal>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.top}><View style={s.brand}><View style={[s.logo, { backgroundColor: C.lilac }]}><Icon name="leaf" size={20} color={C.purple} /></View><Text style={[s.brandText, { color: C.ink }]}>prato a prato.</Text></View><IconButton name="close" label={t('Fechar menu')} onPress={close} /></View>
          <Pressable onPress={() => go(() => props.onNavigate('profile'))} accessibilityRole="button" accessibilityLabel={t('Gerenciar meu perfil')} style={({ pressed }) => [s.profile, { borderBottomColor: C.line }, pressed && s.pressed]}>
            <Avatar initials="EF" size={58} /><View style={s.flex}><Text style={[s.name, { color: C.ink, fontSize: 18 * scale }]}>Enzo Fraga</Text><Text style={[s.subtext, { color: C.textSecondary, fontSize: 12 * scale }]}>{t('Gerenciar meu perfil')}</Text></View><Icon name="chevron-forward" size={18} color={C.muted} />
          </Pressable>
          <View style={[s.stats, { backgroundColor: C.surfaceSubtle }]}><View style={s.stat}><Text style={[s.statValue, { color: C.purple }]}>{props.points}</Text><Text style={[s.statLabel, { color: C.textSecondary }]}>{t('pontos')}</Text></View><View style={[s.statDivider, { backgroundColor: C.line }]} /><View style={s.stat}><View style={s.inline}><Icon name="flame" size={17} color={C.orange} /><Text style={[s.statValue, { color: C.purple }]}>{props.streak}</Text></View><Text style={[s.statLabel, { color: C.textSecondary }]}>{t('dias de sequência')}</Text></View></View>
          <View style={s.links}>{links.map(link => {
            const selected = !props.settingsOpen && !props.goalOpen && props.currentTab === link.tab;
            return <Pressable key={link.tab} onPress={() => go(() => props.onNavigate(link.tab))} accessibilityRole="button" accessibilityLabel={t(link.label)} accessibilityState={{ selected }} aria-pressed={selected} aria-current={selected ? 'page' : undefined} style={({ pressed }) => [s.link, selected && { backgroundColor: C.lilac }, pressed && s.pressed]}><Icon name={link.icon} size={21} color={selected ? C.purple : C.textSecondary} /><Text style={[s.linkText, { color: selected ? C.purple : C.ink, fontSize: 14 * scale }]}>{t(link.label)}</Text></Pressable>;
          })}</View>
          <Text style={[s.section, { color: C.muted }]}>{t('MEU CAMINHO')}</Text>
          <Pressable onPress={() => go(props.onOpenGoal)} accessibilityRole="button" accessibilityLabel={t('Minha meta pessoal')} accessibilityState={{ selected: props.goalOpen }} aria-pressed={props.goalOpen} aria-current={props.goalOpen ? 'page' : undefined} style={({ pressed }) => [s.goal, { backgroundColor: C.lilac }, pressed && s.pressed]}><Icon name="flag-outline" size={23} color={C.purple} /><View style={s.flex}><Text style={[s.linkText, { color: C.purple, fontSize: 14 * scale }]}>{t('Minha meta pessoal')}</Text><Text style={[s.goalDescription, { color: C.textSecondary, fontSize: 11 * scale }]} numberOfLines={2}>{t(props.goal)}</Text></View><Icon name="chevron-forward" size={16} color={C.purple} /></Pressable>
          <Text style={[s.section, { color: C.muted }]}>{t('MEUS GRUPOS')}</Text>
          <Pressable onPress={() => go(() => props.onSelectGroup('raiz'))} accessibilityRole="button" accessibilityLabel={t('Grupo Raiz')} accessibilityState={{ selected: isActiveGroup('raiz') }} aria-pressed={isActiveGroup('raiz')} aria-current={isActiveGroup('raiz') ? 'page' : undefined} style={({ pressed }) => [s.group, isActiveGroup('raiz') && { backgroundColor: C.lilac }, pressed && s.pressed]}><View style={[s.groupIcon, { backgroundColor: C.greenLight }]}><Icon name="leaf-outline" size={20} color={C.green} /></View><View style={s.flex}><Text style={[s.linkText, { color: isActiveGroup('raiz') ? C.purple : C.ink, fontSize: 13 * scale }]}>{t('Grupo Raiz')}</Text><Text style={[s.subtext, { color: C.muted, fontSize: 11 * scale }]}>{t('4 pessoas · grupo privado')}</Text></View>{isActiveGroup('raiz') && <Icon name="checkmark-circle" size={18} color={C.purple} />}</Pressable>
          {props.groups.map(group => {
            const selected = isActiveGroup(group.id);
            return <Pressable key={group.id} onPress={() => go(() => props.onSelectGroup(group.id))} accessibilityRole="button" accessibilityLabel={group.name} accessibilityState={{ selected }} aria-pressed={selected} aria-current={selected ? 'page' : undefined} style={({ pressed }) => [s.group, selected && { backgroundColor: C.lilac }, pressed && s.pressed]}><View style={[s.groupIcon, { backgroundColor: C.lilac }]}><Icon name="people-outline" size={19} color={C.purple} /></View><View style={s.flex}><Text style={[s.linkText, { color: selected ? C.purple : C.ink, fontSize: 13 * scale }]} numberOfLines={2}>{group.name}</Text><Text style={[s.subtext, { color: C.muted, fontSize: 11 * scale }]}>{t('Criado nesta sessão')}</Text></View>{selected && <Icon name="checkmark-circle" size={18} color={C.purple} />}</Pressable>;
          })}
          <Pressable onPress={() => go(props.onCreateGroup)} accessibilityRole="button" accessibilityLabel={t('Criar grupo')} style={({ pressed }) => [s.createGroup, { borderColor: C.accentLine, backgroundColor: C.surfaceSubtle }, pressed && s.pressed]}><Icon name="add-circle-outline" size={21} color={C.purple} /><Text style={[s.linkText, { color: C.purple, fontSize: 13 * scale }]}>{t('Criar grupo')}</Text></Pressable>
          <View style={[s.footer, { borderTopColor: C.line }]}><Pressable onPress={() => go(props.onOpenSettings)} accessibilityRole="button" accessibilityLabel={t('Abrir configurações')} accessibilityState={{ selected: props.settingsOpen }} aria-pressed={props.settingsOpen} aria-current={props.settingsOpen ? 'page' : undefined} style={({ pressed }) => [s.link, props.settingsOpen && { backgroundColor: C.lilac }, pressed && s.pressed]}><Icon name="settings-outline" size={22} color={C.textSecondary} /><Text style={[s.linkText, { color: C.ink, fontSize: 14 * scale }]}>{t('Configurações')}</Text></Pressable><Text style={[s.footerText, { color: C.muted }]}>{t('Seu ritmo. Seu objetivo. Sua comunidade.')}</Text></View>
        </ScrollView>
      </SafeAreaView>
      </Animated.View>
    </View>
  </View>;
}

const s = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' }, panel: { height: '100%', borderRightWidth: 1, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 30, elevation: 18 }, content: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 32, flexGrow: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 23 }, brand: { flexDirection: 'row', gap: 8, alignItems: 'center' }, logo: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, brandText: { fontSize: 17, letterSpacing: -0.7, fontWeight: '700' },
  flex: { flex: 1, minWidth: 0 }, inline: { flexDirection: 'row', alignItems: 'center', gap: 5 }, pressed: { opacity: 0.65 }, profile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 23, borderBottomWidth: 1 }, name: { fontWeight: '600', letterSpacing: -0.3 }, subtext: { marginTop: 5, lineHeight: 17 },
  stats: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderRadius: 17, marginTop: 19, marginBottom: 22 }, stat: { flex: 1, alignItems: 'center', gap: 6 }, statValue: { fontSize: 22, fontWeight: '600' }, statLabel: { fontSize: 10 }, statDivider: { height: 30, width: 1 }, links: { gap: 4 }, link: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, minHeight: 48, paddingVertical: 12, borderRadius: 13 }, linkText: { fontWeight: '500', lineHeight: 21 }, section: { fontSize: 9, letterSpacing: 1.3, fontWeight: '600', marginTop: 25, marginBottom: 12, paddingLeft: 4 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 80, borderRadius: 16, paddingHorizontal: 15, paddingVertical: 14 }, goalDescription: { marginTop: 5, lineHeight: 17 }, group: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 13, minHeight: 64 }, groupIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, createGroup: { flexDirection: 'row', alignItems: 'center', gap: 9, justifyContent: 'center', borderRadius: 13, borderWidth: 1, minHeight: 46, marginTop: 9, padding: 12 },
  footer: { borderTopWidth: 1, paddingTop: 14, marginTop: 24 }, footerText: { fontSize: 10, textAlign: 'center', lineHeight: 18, marginTop: 22 },
});
