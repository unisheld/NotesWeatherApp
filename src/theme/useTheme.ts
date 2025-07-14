import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { lightTheme, darkTheme } from './themes';

export function useTheme() {
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const theme = themeMode === 'light' ? lightTheme : darkTheme;
  return theme;
}
