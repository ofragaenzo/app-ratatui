import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useI18n } from './i18n';
import { usePreferences } from './preferences';
import { useStyles } from './styles';
import { useAppTheme } from './theme';
import { IconButton } from './ui';

type Props = {
  title: string;
  closing: boolean;
  onClose: () => void;
  onDismissed: () => void;
  children: React.ReactNode;
};

const useNativeDriver = Platform.OS !== 'web';
const trackDrag = (drag: Animated.Value) =>
  Animated.event([{ nativeEvent: { translationY: drag } }], { useNativeDriver });

export default function BottomSheet({ title, closing, onClose, onDismissed, children }: Props) {
  const s = useStyles();
  const { t } = useI18n();
  const { isDark } = useAppTheme();
  const { preferences: { reduceMotion } } = usePreferences();
  const { width, height: screenHeight } = useWindowDimensions();
  const desktop = width >= 1000;
  const [height, setHeight] = useState(0);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const bodyFits = contentHeight > 0 && contentHeight <= bodyHeight + 1;
  const measured = height > 0;
  const visibility = useRef(new Animated.Value(0)).current;
  const shade = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const gestureActive = useRef(false);
  const headerDrag = useMemo(() => trackDrag(drag), [drag]);
  const bodyDrag = useMemo(() => trackDrag(drag), [drag]);

  useEffect(() => {
    if (!measured && !closing) return;
    const target = closing ? 0 : 1;
    if (reduceMotion) {
      visibility.setValue(target);
      shade.setValue(target);
      if (closing) onDismissed();
      return;
    }
    const animation = Animated.parallel([
      Animated.timing(visibility, {
        toValue: target,
        duration: closing ? 210 : 280,
        easing: closing ? Easing.inOut(Easing.quad) : Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(shade, {
        toValue: target,
        duration: closing ? 190 : 260,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver,
      }),
    ]);
    animation.start(({ finished }) => { if (finished && closing) onDismissed(); });
    return () => animation.stop();
  }, [closing, measured, onDismissed, reduceMotion, shade, visibility]);

  const motion = useMemo(() => {
    const travel = Math.max(1, screenHeight);
    const dragDistance = Math.max(1, height);
    const offset = drag.interpolate({ inputRange: [0, dragDistance], outputRange: [0, dragDistance], extrapolate: 'clamp' });
    const entered = visibility.interpolate({ inputRange: [0, 1], outputRange: [desktop ? 12 : travel, 0] });
    const dim = drag.interpolate({ inputRange: [0, dragDistance], outputRange: [1, 0], extrapolate: 'clamp' });
    return {
      translateY: Animated.add(entered, Animated.multiply(visibility, offset)),
      backdropOpacity: Animated.multiply(shade, dim),
    };
  }, [desktop, drag, height, screenHeight, shade, visibility]);

  function handleDrag({ nativeEvent: { state, translationY, velocityY } }: PanGestureHandlerStateChangeEvent) {
    if (closing) return;
    if (state === State.ACTIVE) {
      gestureActive.current = true;
      Keyboard.dismiss();
      return;
    }
    if (!gestureActive.current || (state !== State.END && state !== State.CANCELLED && state !== State.FAILED)) return;
    gestureActive.current = false;
    const dismissDistance = Math.min(96, Math.max(44, height * 0.2));
    if (state === State.END && (translationY > dismissDistance || (translationY > 28 && velocityY > 600))) {
      onClose();
    } else if (reduceMotion) {
      drag.setValue(0);
    } else {
      Animated.spring(drag, { toValue: 0, tension: 85, friction: 14, overshootClamping: true, useNativeDriver }).start();
    }
  }

  const panProps = {
    activeOffsetY: 8, failOffsetY: -12, failOffsetX: [-28, 28] as [number, number],
    onHandlerStateChange: handleDrag,
  };
  const shadeColor = isDark ? '#09070D' : '#282035';
  return <Modal visible transparent animationType="none" presentationStyle="overFullScreen"
    statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: motion.backdropOpacity }]}>
        <Svg width="100%" height="100%" pointerEvents="none" accessible={false} aria-hidden>
          <Defs>
            <LinearGradient id="sheetShade" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={shadeColor} stopOpacity={isDark ? 0.15 : 0.07} />
              <Stop offset="55%" stopColor={shadeColor} stopOpacity={isDark ? 0.26 : 0.14} />
              <Stop offset="100%" stopColor={shadeColor} stopOpacity={isDark ? 0.36 : 0.21} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#sheetShade)" />
        </Svg>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Fechar janela')} style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.modalOuter, desktop && s.modalDesktop]}>
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={onClose} pointerEvents={closing ? 'none' : 'auto'}
          onLayout={event => setHeight(event.nativeEvent.layout.height)}
          style={[s.sheet, desktop && s.sheetDesktop, {
            opacity: measured ? (desktop ? visibility : 1) : 0,
            transform: [{ translateY: motion.translateY }],
          }]}>
          <PanGestureHandler enabled={!desktop && !closing} onGestureEvent={headerDrag} {...panProps}>
            <Animated.View collapsable={false}>
              {!desktop && <View style={{ paddingBottom: 8 }}><View style={s.sheetHandle} /></View>}
              <View style={s.sheetHeader}><Text accessibilityRole="header" style={s.sheetTitle}>{title}</Text><IconButton name="close" label={t('Fechar')} onPress={onClose} /></View>
            </Animated.View>
          </PanGestureHandler>
          <ScrollView key={title} scrollEnabled={desktop || !bodyFits} alwaysBounceVertical={false}
            onLayout={event => setBodyHeight(event.nativeEvent.layout.height)} onContentSizeChange={(_, h) => setContentHeight(h)}
            keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
            <PanGestureHandler enabled={!desktop && !closing && bodyFits} touchAction={bodyFits ? 'none' : 'pan-y'} onGestureEvent={bodyDrag} {...panProps}>
              <Animated.View collapsable={false} style={s.sheetBody}>{children}</Animated.View>
            </PanGestureHandler>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  </Modal>;
}
