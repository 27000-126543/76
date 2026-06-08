import { useAuthStore } from '@/store/useAuthStore';
import { hasPermission, getRoleName, getRoleColor } from '@/utils/permission';
import type { UserRole } from '@/types';

export function usePermission() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const canAccess = (required: UserRole): boolean => {
    if (!user || !isAuthenticated) return false;
    return hasPermission(user.role, required);
  };

  const roleName = user ? getRoleName(user.role) : '';
  const roleColor = user ? getRoleColor(user.role) : '';

  return {
    user,
    isAuthenticated,
    canAccess,
    roleName,
    roleColor,
  };
}
