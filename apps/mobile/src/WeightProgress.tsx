import React, { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Journal } from './journal';
import { useStyles } from './styles';
import { useAppTheme } from './theme';
import { Icon } from './ui';

type Props = {
  weights: Journal['weights'];
  ready: boolean;
  onBack: () => void;
  onSave: (kg: number, index?: number) => void;
};

function WeightForm({ initial, onSave, onCancel }: { initial?: number; onSave: (kg: number) => void; onCancel?: () => void }) {
  const s = useStyles();
  const { colors: C } = useAppTheme();
  const [value, setValue] = useState(initial?.toLocaleString('pt-BR') ?? '');
  const [error, setError] = useState('');
  const submitted = useRef(false);
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  function save() {
    if (submitted.current) return;
    const trimmed = value.trim();
    const kg = Number(trimmed.replace(',', '.'));
    if (!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(trimmed) || kg <= 0 || kg > 500) {
      setError('Informe o peso em quilos, por exemplo 72,5.');
      input.current?.focus();
      return;
    }
    submitted.current = true;
    Keyboard.dismiss();
    onSave(kg);
    setValue('');
  }
  return <View>
    <Text style={s.fieldLabel}>{onCancel ? 'Corrigir peso (kg)' : 'Peso de hoje (kg)'}</Text>
    <TextInput ref={input} accessibilityLabel={onCancel ? 'Corrigir peso em quilos' : 'Peso de hoje em quilos'} accessibilityHint={error || undefined}
      value={value} onChangeText={text => { submitted.current = false; setValue(text); setError(''); }}
      keyboardType="decimal-pad" returnKeyType="done" onSubmitEditing={save} maxLength={7} autoFocus={!!onCancel}
      placeholder="Ex.: 72,5" placeholderTextColor={C.textFaint}
      style={[s.input, styles.input, !!error && { borderColor: C.orange }]} />
    {!!error && <Text accessibilityRole="alert" style={[s.caption, styles.error]}>{error}</Text>}
    <View style={styles.actions}>
      {onCancel && <Pressable accessibilityRole="button" onPress={onCancel} style={({ pressed }) => [s.backLink, pressed && s.pressed]}><Text style={s.smallPurple}>Cancelar</Text></Pressable>}
      <Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [s.primaryButton, s.flex, pressed && s.pressed]}><Text style={s.primaryText}>{onCancel ? 'Salvar correção' : 'Registrar peso'}</Text></Pressable>
    </View>
  </View>;
}

export default function WeightProgress({ weights, ready, onBack, onSave }: Props) {
  const s = useStyles();
  const { colors: C } = useAppTheme();
  const [editing, setEditing] = useState<number | null>(null);
  return <View style={s.panel}>
    <Pressable accessibilityRole="button" onPress={onBack} style={({ pressed }) => [s.backLink, pressed && s.pressed]}><Icon name="chevron-back" size={19} color={C.purple} /><Text style={s.smallPurple}>Voltar</Text></Pressable>
    <Text accessibilityRole="header" style={s.pageTitle}>Meu progresso</Text>
    {ready ? <>
      <View style={styles.form}><WeightForm onSave={kg => onSave(kg)} /></View>
      <Text style={s.sheetFootnote}>O primeiro registro em sete dias ganha 5 pontos.</Text>
      <Text accessibilityRole="header" style={[s.panelTitle, styles.heading]}>Histórico de peso</Text>
      {!weights.length && <Text style={s.caption}>Sua primeira pesagem aparecerá aqui.</Text>}
      {weights.map((entry, index) => {
        const date = new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR');
        const kg = entry.kg.toLocaleString('pt-BR');
        return <View key={`${entry.date}-${index}`} style={[styles.entry, { borderColor: C.line }]}>
          <View style={s.sectionRow}><View style={s.flex}><Text style={s.panelTitle}>{kg} kg</Text><Text style={s.meta}>{date}</Text></View>
            {editing !== index && <Pressable accessibilityRole="button" accessibilityLabel={`Corrigir peso de ${kg} kg em ${date}`} onPress={() => setEditing(index)} style={({ pressed }) => [styles.edit, pressed && s.pressed]}><Text style={s.smallPurple}>Corrigir</Text></Pressable>}
          </View>
          {editing === index && <WeightForm initial={entry.kg} onSave={value => { onSave(value, index); setEditing(null); }} onCancel={() => { Keyboard.dismiss(); setEditing(null); }} />}
        </View>;
      }).reverse()}
    </> : <Text accessibilityLiveRegion="polite" style={s.caption}>Carregando o histórico…</Text>}
  </View>;
}

const styles = StyleSheet.create({
  input: { minHeight: 50, textAlignVertical: 'center', marginBottom: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 }, error: { marginBottom: 10 },
  form: { marginTop: 18 }, heading: { marginTop: 24, marginBottom: 8 },
  entry: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 8 }, edit: { minWidth: 52, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
});
