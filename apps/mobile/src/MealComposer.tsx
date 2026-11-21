import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { photos } from './data';
import { useStyles } from './styles';
import { useAppTheme } from './theme';
import { Icon } from './ui';

export type MealDraft = {
  photo: { example: number } | { uri: string } | null;
  category: string;
  ingredients: string;
  caption: string;
  diaryGroupId: string | null;
};

export const emptyMealDraft: MealDraft = {
  photo: null, category: 'Almoço', ingredients: '', caption: '', diaryGroupId: null,
};

export function draftPhoto({ photo, category }: MealDraft) {
  if (!photo) return null;
  if ('example' in photo) return photos[photo.example];
  return { image: { uri: photo.uri }, label: `Meu ${category.toLocaleLowerCase('pt-BR')}` };
}

function releaseUnusedPhoto(uri: string) {
  if (Platform.OS === 'web' && uri.startsWith('blob:')) URL.revokeObjectURL(uri);
}

type Props = {
  draft: MealDraft;
  groups: { id: string; name: string }[];
  inDiary: boolean;
  groupName: string;
  ready: boolean;
  onChange: (changes: Partial<MealDraft>) => void;
  onPublish: () => void;
};

export default function MealComposer({ draft, groups, inDiary, groupName, ready, onChange, onPublish }: Props) {
  const s = useStyles();
  const { colors: C } = useAppTheme();
  const selectedPhoto = draftPhoto(draft);
  const [photoError, setPhotoError] = useState('');
  const pickerRequest = useRef(0);
  useEffect(() => () => { pickerRequest.current++; }, []);
  const action = inDiary && draft.diaryGroupId === null ? 'Registrar no diário' : 'Publicar no grupo';

  function changePhoto(photo: NonNullable<MealDraft['photo']>) {
    pickerRequest.current++;
    if (draft.photo && 'uri' in draft.photo) releaseUnusedPhoto(draft.photo.uri);
    setPhotoError('');
    onChange({ photo });
  }

  async function choosePhoto() {
    const request = ++pickerRequest.current;
    setPhotoError('');
    try {
      const result = await launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (request !== pickerRequest.current) {
        releaseUnusedPhoto(asset.uri);
        return;
      }
      if (Platform.OS === 'web' && !asset.width) {
        releaseUnusedPhoto(asset.uri);
        setPhotoError('O navegador não conseguiu ler essa imagem. Escolha uma foto em JPG ou PNG.');
        return;
      }
      changePhoto({ uri: asset.uri });
    } catch {
      if (request === pickerRequest.current) setPhotoError('Não foi possível abrir a foto. Tente novamente ou escolha um exemplo abaixo.');
    }
  }

  function option(label: string, selected: boolean, onPress: () => void, key: string) {
    return <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected }}
      onPress={onPress} style={({ pressed }) => [s.category, { maxWidth: '100%' }, selected && s.categoryActive, pressed && s.pressed]}>
      <Text style={[s.categoryText, selected && { color: C.purple }]}>{label}</Text>
    </Pressable>;
  }

  return <>
    <Text style={s.fieldLabel}>Foto da refeição</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={selectedPhoto ? 'Trocar foto na galeria' : 'Escolher foto da galeria'}
      onPress={choosePhoto} style={({ pressed }) => [s.composePhoto, s.galleryPicker, pressed && s.pressed]}>
      {selectedPhoto && <Image source={selectedPhoto.image} style={s.galleryPreview} resizeMode="cover" fadeDuration={0} />}
      <View style={[s.galleryAction, selectedPhoto && s.changePhotoAction]}>
        <Icon name="images-outline" size={20} color={C.purple} />
        <Text style={s.smallPurple}>{selectedPhoto ? 'Trocar foto' : 'Escolher da galeria'}</Text>
      </View>
    </Pressable>
    {!!photoError && <Text accessibilityRole="alert" style={[s.caption, { marginBottom: 14 }]}>{photoError}</Text>}
    <Text style={s.fieldLabel}>Ou use uma foto de exemplo</Text>
    <View style={s.photoPicker}>
      {photos.map((item, index) => {
        const selected = !!draft.photo && 'example' in draft.photo && draft.photo.example === index;
        return <Pressable key={item.label} onPress={() => changePhoto({ example: index })}
          accessibilityRole="button" accessibilityLabel={`Escolher ${item.label}`} accessibilityState={{ selected }}
          style={({ pressed }) => [s.photoOption, selected && s.photoSelected, pressed && s.pressed]}>
          <Image source={item.image} style={s.photoThumbnail} />
          {selected && <View style={s.photoCheck}><Icon name="checkmark" size={13} color={C.onAccent} /></View>}
        </Pressable>;
      })}
    </View>
    <Text style={s.fieldLabel}>Momento do dia</Text>
    <View style={s.categories}>
      {['Café da manhã', 'Almoço', 'Lanche', 'Jantar'].map(item =>
        option(item, draft.category === item, () => onChange({ category: item }), item))}
    </View>
    <Text style={s.fieldLabel}>Alimentos e quantidades (opcional)</Text>
    <TextInput accessibilityLabel="Alimentos e quantidades" value={draft.ingredients} onChangeText={ingredients => onChange({ ingredients })}
      maxLength={1000} placeholder="Ex.: 120 g de arroz, 1 concha de feijão e 150 g de frango" placeholderTextColor={C.textFaint} multiline style={s.input} />
    <Text style={s.fieldLabel}>Legenda (opcional)</Text>
    <TextInput accessibilityLabel="Legenda da refeição" value={draft.caption} onChangeText={caption => onChange({ caption })}
      maxLength={240} placeholder="O que você quer lembrar sobre esta refeição?" placeholderTextColor={C.textFaint} multiline style={s.input} />
    {inDiary ? <>
      <Text style={s.fieldLabel}>Onde registrar?</Text>
      <View style={s.categories}>
        {option('Só no diário', draft.diaryGroupId === null, () => onChange({ diaryGroupId: null }), 'diary')}
        {groups.map(group => option(group.name, draft.diaryGroupId === group.id, () => onChange({ diaryGroupId: group.id }), group.id))}
      </View>
    </> : <View style={s.postAudience}>
      <Icon name="people-outline" size={18} color={C.purple} />
      <Text style={[s.meta, s.flex]}>Visível no grupo <Text style={{ color: C.ink }}>{groupName}</Text> e no seu diário.</Text>
    </View>}
    <Pressable accessibilityRole="button" disabled={!ready || !selectedPhoto} accessibilityState={{ disabled: !ready || !selectedPhoto }} onPress={onPublish}
      style={({ pressed }) => [s.primaryButton, (!ready || !selectedPhoto || pressed) && s.pressed]}>
      <Icon name="checkmark" size={19} color={C.onAccent} />
      <Text style={s.primaryText}>{!ready ? 'Carregando diário…' : selectedPhoto ? action : 'Escolha uma foto para registrar'}</Text>
    </Pressable>
    <Text style={s.sheetFootnote}>A refeição fica nesta sessão. A análise automática da foto ainda não está disponível.</Text>
  </>;
}
