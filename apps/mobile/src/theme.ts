import { usePreferences } from './preferences';

export type Palette = {
  bg: string; white: string; surface: string; surfaceSubtle: string;
  ink: string; muted: string; textSecondary: string; textFaint: string;
  purple: string; purpleDark: string; lilac: string; accentSurface: string; accentLine: string;
  onAccent: string; line: string; green: string; greenLight: string; feedbackIcon: string;
  orange: string; neutralSurface: string; ringTrack: string; photoOverlay: string;
  navBackground: string; navBorder: string; scrim: string; shadow: string;
  like: string; inactiveIcon: string;
};

export const lightColors: Palette = {
  bg: '#F7F7FA', white: '#FFFFFF', surface: '#FFFFFF', surfaceSubtle: '#F9F7FC',
  ink: '#25232D', muted: '#77717F', textSecondary: '#746780', textFaint: '#81738D',
  purple: '#7960B5', purpleDark: '#65469C', lilac: '#EEE9F7', accentSurface: '#E5DCF3', accentLine: '#DFD6EC',
  onAccent: '#FFFFFF', line: '#EFEEF3', green: '#487758', greenLight: '#EDF5EF', feedbackIcon: '#DAEADC',
  orange: '#C9814D', neutralSurface: '#EDECF2', ringTrack: '#DCD3ED', photoOverlay: '#FFFFFFE8',
  navBackground: '#FFFFFFC9', navBorder: '#FFFFFFD9', scrim: '#28203566', shadow: '#30203F',
  like: '#B66980', inactiveIcon: '#908B9B',
};

export const darkColors: Palette = {
  bg: '#111015', white: '#1E1C24', surface: '#1E1C24', surfaceSubtle: '#24212C',
  ink: '#F2EDF7', muted: '#AAA2B6', textSecondary: '#C0B5CD', textFaint: '#A69AB4',
  purple: '#BDA5F2', purpleDark: '#D6C5F8', lilac: '#2C253A', accentSurface: '#3A304D', accentLine: '#463957',
  onAccent: '#21172F', line: '#34303C', green: '#A4D1B0', greenLight: '#20312A', feedbackIcon: '#304A3B',
  orange: '#E6AE7F', neutralSurface: '#292631', ringTrack: '#493B5C', photoOverlay: '#211C2BE8',
  navBackground: '#211D2AE8', navBorder: '#51465D99', scrim: '#09070DB8', shadow: '#000000',
  like: '#E3A3B8', inactiveIcon: '#B8ABC8',
};

export function useAppTheme() {
  const { colorScheme } = usePreferences();
  const isDark = colorScheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
