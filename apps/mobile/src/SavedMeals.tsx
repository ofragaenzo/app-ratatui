import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Meal } from './data';
import { useStyles } from './styles';
import { useAppTheme } from './theme';
import { Icon, IconButton } from './ui';

export default function SavedMeals({ meals, onRemove }: { meals: Meal[]; onRemove: (id: string) => void }) {
  const s = useStyles();
  const { colors: C } = useAppTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (!meals.length) return <View style={s.empty}>
    <Icon name="bookmark-outline" size={44} color={C.purple} />
    <Text style={s.emptyTitle}>Nenhuma refeição salva</Text>
    <Text style={[s.sheetIntro, { textAlign: 'center' }]}>Toque no marcador de uma refeição para consultá-la aqui.</Text>
  </View>;

  return <>{meals.map(meal => {
    const expanded = meal.id === expandedId;
    return <View key={meal.id}>
      <View style={s.savedRow}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }}
          accessibilityLabel={`${expanded ? 'Recolher' : 'Ver'} refeição: ${meal.title}`}
          onPress={() => setExpandedId(expanded ? null : meal.id)}
          style={({ pressed }) => [s.inline, s.flex, pressed && s.pressed]}>
          <Image source={meal.image} style={s.savedImage} />
          <View style={s.flex}><Text style={s.author}>{meal.title}</Text><Text style={s.meta}>{meal.author} · {meal.category}</Text></View>
          <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.muted} />
        </Pressable>
        <IconButton name="bookmark" label={`Remover ${meal.title} dos salvos`} onPress={() => onRemove(meal.id)} active />
      </View>
      {expanded && <View style={{ paddingVertical: 14 }}>
        <View style={[s.composePhoto, { marginBottom: 4 }]}>
          <Image source={meal.image} accessibilityLabel={meal.title} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        {!!meal.caption && <Text style={s.caption}>{meal.caption}</Text>}
        {!!meal.ingredients && <><Text style={[s.fieldLabel, { marginTop: 14, marginBottom: 0 }]}>Alimentos e quantidades</Text><Text style={s.caption}>{meal.ingredients}</Text></>}
      </View>}
    </View>;
  })}</>;
}
