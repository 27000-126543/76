import { create } from 'zustand';
import type { Order, Wave, PickingTask, OrderStatus, WaveStatus, PickingTaskStatus } from '../types';

const provinces = ['广东省', '浙江省', '江苏省', '上海市', '北京市', '四川省', '湖北省', '山东省'];
const cities = ['广州市', '深圳市', '杭州市', '南京市', '上海市', '北京市', '成都市', '武汉市', '济南市', '青岛市'];
const districts = ['天河区', '南山区', '西湖区', '鼓楼区', '浦东新区', '朝阳区', '武侯区', '洪山区', '历下区'];
const customerNames = ['王小明', '李华', '张三', '陈静', '刘洋', '赵敏', '周杰', '吴芳', '郑强', '孙丽'];
const skuNames = ['手机壳', '数据线', '蓝牙耳机', '充电宝', '手机膜', '充电器', '平板支架', '手表带', '键盘', '鼠标'];
const locations = ['A-01-01', 'A-01-02', 'A-02-01', 'A-02-03', 'B-01-02', 'B-02-01', 'B-03-02', 'C-01-01', 'C-02-02', 'C-03-01'];
const orderStatuses: OrderStatus[] = ['pending', 'picking', 'sorting', 'shipped', 'exception'];
const waveStatuses: WaveStatus[] = ['created', 'assigned', 'picking', 'completed'];
const pickingStatuses: PickingTaskStatus[] = ['pending', 'accepted', 'picking', 'completed', 'exception'];
const areas = ['A区', 'B区', 'C区', 'D区'];
const pickerNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八'];

const generateOrders = (count: number): Order[] => {
  return Array.from({ length: count }, (_, i) => {
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const items = Array.from({ length: itemCount }, (_, j) => ({
      skuId: `SKU${String(1000 + (i * 10 + j) % 50).padStart(4, '0')}`,
      skuName: skuNames[(i + j) % skuNames.length],
      quantity: Math.floor(Math.random() * 5) + 1,
      location: locations[(i + j) % locations.length]
    }));
    return {
      id: `o${i + 1}`,
      orderNo: `ORD${Date.now()}${String(i).padStart(4, '0')}`,
      customerName: customerNames[i % customerNames.length],
      address: `某某街道${i + 1}号`,
      province: provinces[i % provinces.length],
      city: cities[i % cities.length],
      district: districts[i % districts.length],
      items,
      status: orderStatuses[i % orderStatuses.length],
      priority: Math.random() > 0.7 ? 'urgent' : 'normal',
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      promisedTime: new Date(Date.now() + (24 - i) * 3600000).toISOString()
    };
  });
};

const generateWaves = (count: number): Wave[] => {
  return Array.from({ length: count }, (_, i) => {
    const orderCount = Math.floor(Math.random() * 10) + 5;
    const orderIds = Array.from({ length: orderCount }, (_, j) => `o${i * 10 + j + 1}`);
    const routeCount = Math.floor(Math.random() * 5) + 3;
    const route = Array.from({ length: routeCount }, (_, j) => ({
      location: locations[(i + j) % locations.length],
      skuIds: Array.from({ length: 2 }, (_, k) => `SKU${String(1000 + (i * 5 + j + k) % 50).padStart(4, '0')}`),
      sequence: j + 1
    }));
    const status = waveStatuses[i % waveStatuses.length];
    const hasAssignee = status !== 'created';
    return {
      id: `w${i + 1}`,
      waveNo: `WAVE${String(i + 1).padStart(5, '0')}`,
      area: areas[i % areas.length],
      orderIds,
      orderCount,
      skuCount: Math.floor(Math.random() * 30) + 15,
      route,
      status,
      assigneeId: hasAssignee ? `u${(i % 6) + 1}` : undefined,
      assigneeName: hasAssignee ? pickerNames[i % pickerNames.length] : undefined,
      createdAt: new Date(Date.now() - i * 7200000).toISOString(),
      estimatedDistance: Math.round((Math.random() * 500 + 100) * 10) / 10
    };
  });
};

const generatePickingTasks = (count: number): PickingTask[] => {
  return Array.from({ length: count }, (_, i) => {
    const itemCount = Math.floor(Math.random() * 8) + 3;
    const items = Array.from({ length: itemCount }, (_, j) => ({
      skuId: `SKU${String(1000 + (i * 8 + j) % 50).padStart(4, '0')}`,
      skuName: skuNames[(i + j) % skuNames.length],
      location: locations[(i + j) % locations.length],
      quantity: Math.floor(Math.random() * 5) + 1,
      picked: Math.random() > 0.5
    }));
    const status = pickingStatuses[i % pickingStatuses.length];
    const orderIds = Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, j) => `o${i * 5 + j + 1}`);
    return {
      id: `pt${i + 1}`,
      taskNo: `TASK${String(i + 1).padStart(5, '0')}`,
      waveId: `w${Math.floor(i / 3) + 1}`,
      orderIds,
      assigneeId: `u${(i % 6) + 1}`,
      assigneeName: pickerNames[i % pickerNames.length],
      status,
      items,
      pickedAt: status !== 'pending' ? new Date(Date.now() - i * 1800000).toISOString() : undefined,
      completedAt: status === 'completed' ? new Date(Date.now() - i * 900000).toISOString() : undefined
    };
  });
};

interface OrderState {
  orders: Order[];
  waves: Wave[];
  tasks: PickingTask[];
  loading: boolean;
  fetchOrders: () => Promise<void>;
  fetchWaves: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  createWave: (orderIds: string[]) => Promise<Wave>;
  assignTask: (waveId: string, userId: string) => Promise<void>;
  acceptTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  waves: [],
  tasks: [],
  loading: false,
  fetchOrders: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ orders: generateOrders(20), loading: false });
  },
  fetchWaves: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ waves: generateWaves(15), loading: false });
  },
  fetchTasks: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ tasks: generatePickingTasks(18), loading: false });
  },
  createWave: async (orderIds: string[]) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newWave: Wave = {
      id: `w${Date.now()}`,
      waveNo: `WAVE${String(Date.now()).slice(-5)}`,
      area: areas[Math.floor(Math.random() * areas.length)],
      orderIds,
      orderCount: orderIds.length,
      skuCount: orderIds.length * 2,
      route: [
        { location: 'A-01-01', skuIds: ['SKU0001'], sequence: 1 },
        { location: 'A-02-02', skuIds: ['SKU0002'], sequence: 2 }
      ],
      status: 'created',
      createdAt: new Date().toISOString(),
      estimatedDistance: 250.5
    };
    set((state) => ({ waves: [newWave, ...state.waves] }));
    return newWave;
  },
  assignTask: async (waveId, userId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const userName = pickerNames[parseInt(userId.slice(1)) % pickerNames.length];
    set((state) => ({
      waves: state.waves.map((w) =>
        w.id === waveId ? { ...w, status: 'assigned', assigneeId: userId, assigneeName: userName } : w
      ),
      tasks: state.tasks.map((t) =>
        t.waveId === waveId ? { ...t, assigneeId: userId, assigneeName: userName } : t
      )
    }));
  },
  acceptTask: async (taskId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'accepted', pickedAt: new Date().toISOString() } : t
      )
    }));
  },
  completeTask: async (taskId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'completed', completedAt: new Date().toISOString(), items: t.items.map((i) => ({ ...i, picked: true })) } : t
        ),
        waves: task ? state.waves.map((w) =>
          w.id === task.waveId ? { ...w, status: 'completed' as WaveStatus } : w
        ) : state.waves
      };
    });
  }
}));
