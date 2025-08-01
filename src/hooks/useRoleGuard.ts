import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

const ROLE_PRIORITY = {
  user: 1,
  editor: 2,
  admin: 3,
};

export function useRoleGuard(requiredRole: 'admin' | 'editor' | 'user') {
  const role = useSelector((state: RootState) => state.auth.user?.role ?? 'user');
  return ROLE_PRIORITY[role] >= ROLE_PRIORITY[requiredRole];
}
