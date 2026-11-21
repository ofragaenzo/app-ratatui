import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { lightColors, useAppTheme } from './theme';
import { usePreferences } from './preferences';
import { useI18n } from './i18n';

// Kept for modules that need a palette outside a component. Screen UI uses useAppTheme.
export const colors = lightColors;
export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color?: string }) {
  const { colors: C } = useAppTheme();
  return <Ionicons name={name} size={size} color={color ?? C.ink} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden />;
}

export function Avatar({ initials, color, size = 40 }: { initials: string; color?: string; size?: number }) {
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const textScale = preferences.textSize === 'large' ? 1.15 : 1;
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? C.lilac, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: color ? '#65596A' : C.purpleDark, fontSize: size * 0.29 * textScale, fontWeight: '600' }}>{initials}</Text>
  </View>;
}

export function IconButton({ name, label, onPress, active = false }: { name: IconName; label: string; onPress: () => void; active?: boolean }) {
  const { colors: C } = useAppTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [{ width: 46, height: 46, borderRadius: 15, backgroundColor: active ? C.lilac : C.surfaceSubtle, borderWidth: 1, borderColor: active ? C.accentLine : C.line, alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.7 }]}>
    <Icon name={name} color={active ? C.purple : C.ink} size={21} />
  </Pressable>;
}

export function AccountMenuButton({ onPress }: { onPress: () => void }) {
  const { colors: C } = useAppTheme();
  const { t } = useI18n();
  return <Pressable accessibilityRole="button" accessibilityLabel={t('Abrir menu lateral')} onPress={onPress}
    style={({ pressed }) => [{ flexDirection: 'row', gap: 2, minHeight: 46, alignItems: 'center', justifyContent: 'center' }, pressed && { opacity: 0.7 }]}>
    <Avatar initials="EF" size={34} /><Icon name="chevron-down" size={13} color={C.textSecondary} />
  </Pressable>;
}

export function ProgressRing({ completed = 3, target = 5 }: { completed?: number; target?: number }) {
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const { t } = useI18n();
  const textScale = preferences.textSize === 'large' ? 1.15 : 1;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  return <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={t('progressA11y', { completed, target })}>
    <Svg width={88} height={88} style={StyleSheet.absoluteFill}>
      <Circle cx={44} cy={44} r={radius} stroke={C.ringTrack} strokeWidth={6} fill="none" />
      <Circle cx={44} cy={44} r={radius} stroke={C.purple} strokeWidth={6} fill="none"
        strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - Math.min(completed / target, 1))}
        strokeLinecap="round" transform="rotate(-90 44 44)" />
    </Svg>
    <Text style={{ color: C.purpleDark, fontSize: 24 * textScale, fontWeight: '600', letterSpacing: -1 }}>{completed}<Text style={{ fontSize: 15 * textScale, color: C.textFaint, fontWeight: '400' }}>/{target}</Text></Text>
    <Text style={{ fontSize: 10 * textScale, color: C.textSecondary, marginTop: 1 }}>{t('days')}</Text>
  </View>;
}
