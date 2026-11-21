$file='C:\Users\Enzo Fraga\Documents\projeto app nutrição\apps\mobile\src\styles.ts'
$code=[System.IO.File]::ReadAllText($file)
$code=$code.Replace("import { Platform, StyleSheet } from 'react-native';", "import { useMemo } from 'react';`nimport { Platform, StyleSheet, TextStyle } from 'react-native';")
$code=$code.Replace("import { colors as C } from './ui';", "import { lightColors, Palette, useAppTheme } from './theme';`nimport { usePreferences } from './preferences';")
$code=$code.Replace("const shadow = { shadowColor: '#30203F', shadowOpacity: 0.035, shadowRadius: 18, shadowOffset: { width: 0, height: 5 }, elevation: 1 };", "")
$code=$code.Replace('export const styles = StyleSheet.create({', "function createStyles(C: Palette, textScale = 1, compactFeed = false) {`nconst shadow = { shadowColor: C.shadow, shadowOpacity: 0.035, shadowRadius: 18, shadowOffset: { width: 0, height: 5 }, elevation: 1 };`nconst definitions = StyleSheet.create({")
$groups=@{
  'ink'='#3E344A #4F465A #53425F #554C62 #574061 #5B436D #5B4E68'
  'purpleDark'='#5F487A #70527F #74598D #78558B #7E5E92 #866496'
  'textSecondary'='#5D5162 #665770 #675072 #6A5B77 #745C83 #746780 #796586 #7A6588 #7A6788 #7A6D84 #80738C #80758A #81768B #82758E #887791 #8A6F9B #8A789E #8A7A96 #8D7A98'
  'purple'='#8A73A4 #8B75A7 #8E739D #9074AC #A18AB9'
  'muted'='#9991A1 #A08AAF #A08BAD #A091B1 #A095AD #A18BB7 #A199AC #A29AAA #A398AC #A39BAF #A499AE #AB99BC #AB9AB7 #ADA2B8 #AE9AB8 #AE9AB9 #AF9CBE #B09EBD #B2A4BF #B2A8BD #B6A8C2 #B7ACBF #B9A6CD #BAAFC5 #BCAFCA #C0B6CC'
  'green'='#487758 #64816C #A2B49F'
  'accentLine'='#B1A0C8 #C6B6D9 #C9C1D0 #CBB8DD #D7C2E6 #D9C9E9 #D9D0E2 #DFD6EC'
  'feedbackIcon'='#DAEADC'
  'accentSurface'='#E5DCF3 #E6DEF2 #ECE5F7 #EDE5F7'
  'line'='#E7E2ED #E9E0F0 #EAE4F0 #EFE8F5 #F0EAF6 #F2EDF7 #F3EEF8 #F4EFF8'
  'neutralSurface'='#E9E2D8 #EFE7E0 #EDECF2'
  'lilac'='#EFEBF7 #F0ECF7 #F1EBF8 #F2EBF8 #F2ECF8 #F2EDF8 #F3EEF9 #F3EFF9 #F4F0F9 #F5F0FA'
  'surfaceSubtle'='#F6F2FB #F6F3FA #F8F5FB #F8F5FC #F8F6FA #F9F7FC #FAF8FC #FCFAFD'
  'photoOverlay'='#FFFFFFE8'
  'navBackground'='#FFFFFFC9'
  'navBorder'='#FFFFFFD9'
  'surface'='#FFFFFFF5'
  'scrim'='#28203566'
  'shadow'='#21152C #493951 #544264'
}
foreach($token in $groups.Keys){ foreach($hex in $groups[$token].Split(' ')){ $code=$code.Replace("'$hex'", "C.$token") } }
$code=$code.Replace('primaryText: { ...type, color: C.white,','primaryText: { ...type, color: C.onAccent,')
$code=$code.Replace("aspectRatio: 1.7", "aspectRatio: compactFeed ? 2.5 : 1.7")
$tail=@'

  if (textScale === 1) return definitions;
  return Object.fromEntries(Object.entries(definitions).map(([name, style]) => {
    const text = style as TextStyle;
    return [name, {
      ...style,
      ...(typeof text.fontSize === 'number' ? { fontSize: Math.round(text.fontSize * textScale * 10) / 10 } : {}),
      ...(typeof text.lineHeight === 'number' ? { lineHeight: Math.round(text.lineHeight * textScale * 10) / 10 } : {}),
    }];
  })) as typeof definitions;
}

export const styles = createStyles(lightColors);

export function useStyles() {
  const { colors } = useAppTheme();
  const { preferences } = usePreferences();
  return useMemo(() => createStyles(colors, preferences.textSize === 'large' ? 1.18 : 1, preferences.compactFeed),
    [colors, preferences.textSize, preferences.compactFeed]);
}
'@
$code=$code.TrimEnd()+$tail
[System.IO.File]::WriteAllText($file,$code,[System.Text.UTF8Encoding]::new($false))
