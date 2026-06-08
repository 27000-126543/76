import { create } from 'zustand';
import type { DashboardMetrics, Region } from '../types';
import { REGION_OPTIONS } from '../types';

const hours24 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const sortingLineNames = ['1号线', '2号线', '3号线', '4号线', '5号线', '6号线'];

const generateMetrics = (): DashboardMetrics => {
  const orderOnTime = Math.round((Math.random() * 10 + 90) * 10) / 10;
  const onTimeCount = Math.floor(orderOnTime * 50);
  const delayedCount = 500 - onTimeCount;

  return {
    todayOrders: Math.floor(Math.random() * 2000) + 3000,
    yesterdayOrders: Math.floor(Math.random() * 2000) + 2800,
    sortingEfficiency: Math.round((Math.random() * 15 + 85) * 10) / 10,
    sortingEfficiencyTrend: Array.from({ length: 24 }, () => Math.round((Math.random() * 20 + 80) * 10) / 10),
    sortingEfficiencyTrendHours: hours24,
    equipmentHealthRate: Math.round((Math.random() * 10 + 90) * 10) / 10,
    orderOnTimeRate: orderOnTime,
    orderOnTimeBreakdown: [
      { name: '准时', value: onTimeCount },
      { name: '延迟', value: delayedCount },
    ],
    pendingExceptions: Math.floor(Math.random() * 15) + 3,
    activeEmployees: Math.floor(Math.random() * 30) + 50,
    waveInProgress: Math.floor(Math.random() * 8) + 2,
    sortingLineThroughput: sortingLineNames.map((name) => ({
      lineName: name,
      throughput: Math.floor(Math.random() * 500) + 200,
    })),
  };
};

interface DashboardState {
  metrics: DashboardMetrics;
  loading: boolean;
  region: Region;
  regionOptions: typeof REGION_OPTIONS;
  fetchMetrics: () => Promise<void>;
  startRealTimeUpdate: () => () => void;
  setRegion: (region: Region) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  metrics: generateMetrics(),
  loading: false,
  region: 'east',
  regionOptions: REGION_OPTIONS,
  fetchMetrics: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ metrics: generateMetrics(), loading: false });
  },
  startRealTimeUpdate: () => {
    const interval = setInterval(() => {
      set({ metrics: generateMetrics() });
    }, 5000);
    return () => clearInterval(interval);
  },
  setRegion: (region) => {
    set({ region });
    get().fetchMetrics();
  },
}));
