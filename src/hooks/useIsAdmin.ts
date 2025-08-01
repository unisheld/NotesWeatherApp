
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

export const useIsAdmin = () => {
  return useSelector((state: RootState) => state.auth.user?.role === 'admin');
};
