import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChatMessage, chatMessageText, WorkspaceGroup } from './GroupWorkspace';
import { useI18n } from './i18n';
import { usePreferences } from './preferences';
import { useAppTheme } from './theme';
import { Icon } from './ui';

type Props = {
  groups: WorkspaceGroup[];
  messages: Record<string, ChatMessage[]>;
  drafts?: Record<string, string>;
  onOpen: (groupId: string) => void;
};

export default function ChatList({ groups, messages, drafts = {}, onOpen }: Props) {
  const { colors } = useAppTheme();
  const { preferences } = usePreferences();
  const { t, locale } = useI18n();
  const scale = preferences.textSize === 'large' ? 1.15 : 1;
  const orderedGroups = [...groups].sort((first, second) => {
    const firstMessages = messages[first.id] ?? [];
    const secondMessages = messages[second.id] ?? [];
    return (secondMessages[secondMessages.length - 1]?.time ?? 0) -
      (firstMessages[firstMessages.length - 1]?.time ?? 0);
  });

  return <View>
    <Text style={[styles.intro, { color: colors.muted, fontSize: 12 * scale }]}>
      {t('Suas conversas em grupo')}
    </Text>
    <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {orderedGroups.map((group, index) => {
        const groupMessages = messages[group.id] ?? [];
        const last = groupMessages[groupMessages.length - 1];
        const lastText = last
          ? `${last.mine ? t('Você') : last.author}: ${chatMessageText(last, preferences.language)}`
          : t('Comece uma conversa');
        const draft = drafts[group.id]?.trim();
        const date = last?.time !== undefined ? new Date(last.time) : null;
        const time = date
          ? date.toDateString() === new Date().toDateString()
            ? date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
          : last?.seed ? t('Exemplo') : '';

        return <Pressable key={group.id} accessibilityRole="button"
          accessibilityLabel={t('Abrir conversa de {name}', { name: group.name })}
          accessibilityHint={draft ? `${t('Rascunho')}: ${draft}` : lastText}
          onPress={() => onOpen(group.id)}
          style={({ pressed }) => [styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }, pressed && { opacity: 0.7 }]}>
          <View style={[styles.avatar, { backgroundColor: group.id === 'raiz' ? colors.greenLight : colors.lilac }]}>
            <Icon name={group.id === 'raiz' ? 'leaf-outline' : 'people-outline'} size={22} color={group.id === 'raiz' ? colors.green : colors.purple} />
          </View>
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text numberOfLines={1} style={[styles.name, { color: colors.ink, fontSize: 14 * scale }]}>{group.name}</Text>
              {!!time && <Text style={[styles.time, { color: colors.muted, fontSize: 10 * scale }]}>{time}</Text>}
            </View>
            <Text numberOfLines={2} style={[styles.message, { color: colors.textSecondary, fontSize: 12 * scale }]}>{draft ? <><Text style={{ color: colors.purple, fontWeight: '600' }}>{t('Rascunho')} · </Text>{draft}</> : lastText}</Text>
          </View>
          <Icon name="chevron-forward" size={17} color={colors.inactiveIcon} />
        </Pressable>;
      })}
    </View>
    <Text style={[styles.footnote, { color: colors.muted, fontSize: 10 * scale }]}>
      {t('Conversa de demonstração. As mensagens ficam apenas nesta sessão.')}
    </Text>
  </View>;
}

const styles = StyleSheet.create({
  intro: { lineHeight: 20, marginBottom: 18 },
  list: { borderWidth: 1, borderRadius: 21, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 84, gap: 13, paddingHorizontal: 16, paddingVertical: 14 },
  avatar: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontWeight: '600', lineHeight: 21 },
  time: { lineHeight: 16 },
  message: { lineHeight: 19, marginTop: 4 },
  footnote: { textAlign: 'center', marginTop: 15, lineHeight: 18 },
});
