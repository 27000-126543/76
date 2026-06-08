import { create } from 'zustand';
import type { Equipment, MaintenanceOrder, SortingStation, EquipmentType, EquipmentStatus, MaintenanceUrgency, MaintenanceStatus } from '../types';

const equipmentTypes: EquipmentType[] = ['conveyor', 'sorter', 'scanner', 'scale'];
const equipmentStatuses: EquipmentStatus[] = ['running', 'idle', 'fault', 'maintenance'];
const urgencyLevels: MaintenanceUrgency[] = ['critical', 'normal', 'low'];
const maintenanceStatuses: MaintenanceStatus[] = ['pending', 'accepted', 'repairing', 'completed', 'escalated'];
const areas = ['A区', 'B区', 'C区', 'D区'];
const equipmentNames = ['主传送带', '分拣机1号', '扫码枪A', '电子秤B', '传送带2号', '分拣机2号', '扫码枪B', '电子秤A', '传送带3号', '分拣机3号'];
const destinations = ['华北仓', '华东仓', '华南仓', '西南仓', '西北仓', '东北仓'];
const faultDescriptions = ['电机异响', '传感器故障', '传送带卡顿', '扫码失败', '称重不准', '触摸屏失灵', '输送带断裂', '气缸漏气'];
const teamNames = ['维修一组', '维修二组', '维修三组'];
const assigneeNames = ['陈师傅', '刘师傅', '周师傅', '吴师傅'];

const generateEquipment = (count: number): Equipment[] => {
  return Array.from({ length: count }, (_, i) => {
    const type = equipmentTypes[i % equipmentTypes.length];
    const status = equipmentStatuses[i % equipmentStatuses.length];
    const params: Equipment['params'] = {};
    if (type === 'conveyor') {
      params.speed = Math.floor(Math.random() * 50) + 50;
      params.temperature = Math.floor(Math.random() * 30) + 40;
    } else if (type === 'sorter') {
      params.throughput = Math.floor(Math.random() * 500) + 1000;
      params.vibration = Math.round(Math.random() * 5 * 10) / 10;
    } else if (type === 'scanner') {
      params.voltage = Math.round((Math.random() * 0.5 + 4.5) * 10) / 10;
    } else if (type === 'scale') {
      params.voltage = Math.round((Math.random() * 0.5 + 9) * 10) / 10;
    }
    return {
      id: `eq${i + 1}`,
      equipmentNo: `EQ${String(i + 1).padStart(4, '0')}`,
      name: equipmentNames[i % equipmentNames.length],
      type,
      area: areas[i % areas.length],
      status,
      params,
      lastMaintenanceAt: new Date(Date.now() - i * 86400000 * 15).toISOString(),
      runningHours: Math.floor(Math.random() * 5000) + 1000
    };
  });
};

const generateMaintenanceOrders = (count: number): MaintenanceOrder[] => {
  return Array.from({ length: count }, (_, i) => {
    const status = maintenanceStatuses[i % maintenanceStatuses.length];
    const hasTeam = status !== 'pending';
    const hasAssignee = status === 'accepted' || status === 'repairing' || status === 'completed';
    return {
      id: `mo${i + 1}`,
      orderNo: `MAINT${String(i + 1).padStart(5, '0')}`,
      equipmentId: `eq${(i % 10) + 1}`,
      equipmentName: equipmentNames[i % equipmentNames.length],
      faultDescription: faultDescriptions[i % faultDescriptions.length],
      urgency: urgencyLevels[i % urgencyLevels.length],
      teamId: hasTeam ? `team${(i % 3) + 1}` : undefined,
      teamName: hasTeam ? teamNames[i % teamNames.length] : undefined,
      assigneeId: hasAssignee ? `maint${(i % 4) + 1}` : undefined,
      assigneeName: hasAssignee ? assigneeNames[i % assigneeNames.length] : undefined,
      status,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      acceptedAt: status !== 'pending' ? new Date(Date.now() - i * 3000000).toISOString() : undefined,
      completedAt: status === 'completed' ? new Date(Date.now() - i * 1800000).toISOString() : undefined,
      escalatedAt: status === 'escalated' ? new Date(Date.now() - i * 600000).toISOString() : undefined,
      resolution: status === 'completed' ? '已更换故障部件，设备恢复正常运行' : undefined
    };
  });
};

const generateSortingStations = (count: number): SortingStation[] => {
  return Array.from({ length: count }, (_, i) => {
    const statuses: Array<'running' | 'idle' | 'fault'> = ['running', 'running', 'idle', 'fault'];
    return {
      id: `ss${i + 1}`,
      stationNo: `STATION${String(i + 1).padStart(2, '0')}`,
      destination: destinations[i % destinations.length],
      throughput: Math.floor(Math.random() * 200) + 500,
      status: statuses[i % statuses.length],
      todayCount: Math.floor(Math.random() * 2000) + 1000
    };
  });
};

const checkAndEscalate = (orders: MaintenanceOrder[]): MaintenanceOrder[] => {
  const now = Date.now();
  return orders.map((order) => {
    if (order.status === 'pending') {
      const createdAt = new Date(order.createdAt).getTime();
      if (now - createdAt > 60 * 60 * 1000) {
        return {
          ...order,
          status: 'escalated' as MaintenanceStatus,
          escalatedAt: order.escalatedAt || new Date().toISOString(),
          teamName: '设备部长',
          teamId: 'minister'
        };
      }
    }
    return order;
  });
};

interface EquipmentState {
  equipment: Equipment[];
  maintenanceOrders: MaintenanceOrder[];
  sortingStations: SortingStation[];
  loading: boolean;
  fetchEquipment: () => Promise<void>;
  fetchMaintenanceOrders: () => Promise<void>;
  acceptMaintenance: (orderId: string) => Promise<void>;
  completeMaintenance: (orderId: string) => Promise<void>;
  startMaintenanceEscalationCheck: () => () => void;
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: [],
  maintenanceOrders: [],
  sortingStations: [],
  loading: false,
  fetchEquipment: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ equipment: generateEquipment(20), sortingStations: generateSortingStations(12), loading: false });
  },
  fetchMaintenanceOrders: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const orders = checkAndEscalate(generateMaintenanceOrders(15));
    set({ maintenanceOrders: orders, loading: false });
  },
  acceptMaintenance: async (orderId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      maintenanceOrders: state.maintenanceOrders.map((m) =>
        m.id === orderId ? {
          ...m,
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
          assigneeName: m.assigneeName || '当前维修人员'
        } : m
      )
    }));
  },
  completeMaintenance: async (orderId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      maintenanceOrders: state.maintenanceOrders.map((m) =>
        m.id === orderId ? {
          ...m,
          status: 'completed',
          completedAt: new Date().toISOString(),
          resolution: '维修完成，设备恢复正常运行'
        } : m
      ),
      equipment: state.equipment.map((e) => {
        const order = state.maintenanceOrders.find((m) => m.id === orderId);
        return order && e.id === order.equipmentId ? { ...e, status: 'running' as EquipmentStatus } : e;
      })
    }));
  },
  startMaintenanceEscalationCheck: () => {
    const interval = setInterval(() => {
      set((state) => ({
        maintenanceOrders: checkAndEscalate(state.maintenanceOrders)
      }));
    }, 30000);
    return () => clearInterval(interval);
  }
}));
