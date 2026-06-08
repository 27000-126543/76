import type { UserRole } from '@/types';

const roleHierarchy: Record<UserRole, number> = {
  picker: 1,
  leader: 2,
  manager: 3,
  director: 4,
};

const roleNames: Record<UserRole, string> = {
  picker: '分拣员',
  leader: '组长',
  manager: '经理',
  director: '总监',
};

const roleColors: Record<UserRole, string> = {
  picker: '#10B981',
  leader: '#3B82F6',
  manager: '#8B5CF6',
  director: '#F59E0B',
};

export function hasPermission(role: UserRole, required: UserRole): boolean {
  return roleHierarchy[role] >= roleHierarchy[required];
}

export function getRoleName(role: UserRole): string {
  return roleNames[role];
}

export function getRoleColor(role: UserRole): string {
  return roleColors[role];
}
