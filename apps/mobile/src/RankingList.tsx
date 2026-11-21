import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WorkspaceGroup } from './GroupWorkspace';
import { useI18n } from './i18n';
import { usePreferences } from './preferences';
import { useAppTheme } from './theme';
import { Icon } from './ui';

export default function RankingList({ groups, onOpen }: { groups: WorkspaceGroup[]; onOpen: (id: string) => void }) {
  const { colors: C } = useAppTheme();
  const { preferences } = usePreferences();
  const { t } = useI18n();
  const scale = preferences.textSize === 'large' ? 1.15 : 1;
  return <View>
    <Text style={[styles.intro, { color: C.textSecondary, fontSize: 12 * scale }]}>{t('Escolha um grupo para ver o ranking.')}</Text>
    <View style={[styles.list, { backgroundColor: C.surface, borderColor: C.line }]}>
      {groups.map((group, index) => <Pressable key={group.id} accessibilityRole="button" accessibilityLabel={t('Ver ranking de {name}', { name: group.name })} onPress={() => onOpen(group.id)} style={({ pressed }) => [styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: C.line }, pressed && { opacity: 0.65 }]}>
        <View style={[styles.icon, { backgroundColor: group.id === 'raiz' ? C.greenLight : C.lilac }]}><Icon name={group.id === 'raiz' ? 'leaf-outline' : 'people-outline'} size={22} color={group.id === 'raiz' ? C.green : C.purple} /></View>
        <View style={styles.content}><Text numberOfLines={2} style={[styles.name, { color: C.ink, fontSize: 14 * scale }]}>{group.name}</Text><Text numberOfLines={2} style={[styles.detail, { color: C.textSecondary, fontSize: 11 * scale }]}>{group.challengeStart && group.challengeEnd ? t('{start} a {end}', { start: group.challengeStart, end: group.challengeEnd }) : t('Grupo de demonstração')}</Text></View>
        <Icon name="chevron-forward" size={18} color={C.inactiveIcon} />
      </Pressable>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  intro: { lineHeight: 20, marginBottom: 18 }, list: { borderWidth: 1, borderRadius: 21, overflow: 'hidden' },
  row: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 16, paddingVertical: 14 },
  icon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, content: { flex: 1, minWidth: 0 },
  name: { fontWeight: '600', lineHeight: 21 }, detail: { lineHeight: 18, marginTop: 4 },
});
