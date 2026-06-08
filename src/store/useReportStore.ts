import { create } from 'zustand';
import type { MonthlyReport, EmployeePerformance, DailyMetric } from '../types';

const userNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二'];
const roles = ['picker', 'picker', 'picker', 'leader', 'manager'];

const generateTopEmployees = (): EmployeePerformance[] => {
  return Array.from({ length: 10 }, (_, i) => ({
    userId: `u${i + 1}`,
    userName: userNames[i],
    employeeNo: `EMP${String(1000 + i).padStart(4, '0')}`,
    role: roles[i % roles.length],
    date: new Date().toISOString().split('T')[0],
    pickingCount: Math.floor(Math.random() * 500) + 500,
    sortingCount: Math.floor(Math.random() * 800) + 800,
    accuracy: Math.round((Math.random() * 5 + 95) * 100) / 100,
    workHours: Math.round((Math.random() * 20 + 160) * 10) / 10,
    efficiencyScore: Math.round(Math.random() * 20 + 80),
    ranking: i + 1
  }));
};

const generateDailyTrend = (days: number): DailyMetric[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split('T')[0],
      orders: Math.floor(Math.random() * 2000) + 3000,
      efficiency: Math.round((Math.random() * 15 + 85) * 10) / 10,
      onTimeRate: Math.round((Math.random() * 10 + 90) * 10) / 10
    };
  });
};

const generateReport = (month: string, area: string): MonthlyReport => ({
  month,
  totalOrders: Math.floor(Math.random() * 50000) + 80000,
  onTimeRate: Math.round((Math.random() * 8 + 92) * 10) / 10,
  sortingEfficiency: Math.round((Math.random() * 10 + 88) * 10) / 10,
  equipmentHealthRate: Math.round((Math.random() * 8 + 92) * 10) / 10,
  topEmployees: generateTopEmployees(),
  dailyTrend: generateDailyTrend(30)
});

interface ReportState {
  report: MonthlyReport | null;
  loading: boolean;
  fetchReport: (month: string, area: string) => Promise<void>;
}

export const useReportStore = create<ReportState>((set) => ({
  report: null,
  loading: false,
  fetchReport: async (month, area) => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 800));
    set({ report: generateReport(month, area), loading: false });
  }
}));
