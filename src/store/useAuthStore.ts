import { create } from 'zustand';
import type { User } from '../types';

const mockUsers: Record<string, { password: string; user: User }> = {
  picker: {
    password: '123456',
    user: {
      id: 'u1',
      name: '张三',
      employeeNo: 'EMP001',
      role: 'picker',
      area: 'A区',
      phone: '13800138001',
      status: 'on',
      createdAt: '2024-01-15T09:00:00Z'
    }
  },
  leader: {
    password: '123456',
    user: {
      id: 'u2',
      name: '李四',
      employeeNo: 'EMP002',
      role: 'leader',
      area: 'A区',
      phone: '13800138002',
      status: 'on',
      createdAt: '2024-01-10T09:00:00Z'
    }
  },
  manager: {
    password: '123456',
    user: {
      id: 'u3',
      name: '王五',
      employeeNo: 'EMP003',
      role: 'manager',
      area: '全场',
      phone: '13800138003',
      status: 'on',
      createdAt: '2023-12-01T09:00:00Z'
    }
  },
  director: {
    password: '123456',
    user: {
      id: 'u4',
      name: '赵六',
      employeeNo: 'EMP004',
      role: 'director',
      area: '全场',
      phone: '13800138004',
      status: 'on',
      createdAt: '2023-06-01T09:00:00Z'
    }
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async (username, password) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const account = mockUsers[username];
    if (!account || account.password !== password) {
      throw new Error('用户名或密码错误');
    }
    const token = 'mock-token-' + Date.now();
    set({ user: account.user, token, isAuthenticated: true });
    return account.user;
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
