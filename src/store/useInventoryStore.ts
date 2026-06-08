import { create } from 'zustand';
import type { Inventory, ReplenishRequest, PutawayTask, ABCClass, ReplenishStatus, PutawayTaskStatus } from '../types';

const skuNames = ['手机壳', '数据线', '蓝牙耳机', '充电宝', '手机膜', '充电器', '平板支架', '手表带', '键盘', '鼠标', '显示器', '硬盘', '内存条', '显卡', '主板'];
const categories = ['手机配件', '电脑配件', '数码产品', '外设设备', '存储设备'];
const locations = ['A-01-01', 'A-01-02', 'A-02-01', 'A-02-03', 'B-01-02', 'B-02-01', 'B-03-02', 'C-01-01', 'C-02-02', 'C-03-01'];
const abcClasses: ABCClass[] = ['A', 'B', 'C'];
const replenishStatuses: ReplenishStatus[] = ['pending_supervisor', 'pending_manager', 'pending_director', 'approved', 'rejected'];
const putawayStatuses: PutawayTaskStatus[] = ['pending', 'assigned', 'in_progress', 'completed'];
const reasons = ['库存低于安全线', '即将促销备货', '季节性需求增加', '常规补货', '紧急补货'];
const applicantNames = ['张三', '李四', '王五', '赵六', '钱七'];
const approverNames = ['李主管', '王经理', '赵总监'];

const STORAGE_KEY = 'wms_inventory_state_v1';

interface PersistedState {
  replenishRequests: ReplenishRequest[];
  putawayTasks: PutawayTask[];
}

const loadPersisted = (): PersistedState | null => {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
};

const savePersisted = (state: PersistedState) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    /* ignore */
  }
};

const generateInventory = (count: number): Inventory[] => {
  return Array.from({ length: count }, (_, i) => {
    const safeStock = Math.floor(Math.random() * 200) + 50;
    return {
      id: `inv${i + 1}`,
      skuId: `SKU${String(1000 + i).padStart(4, '0')}`,
      skuName: skuNames[i % skuNames.length],
      category: categories[i % categories.length],
      quantity: Math.floor(Math.random() * 500) + 20,
      safeStock,
      location: locations[i % locations.length],
      abcClass: abcClasses[i % abcClasses.length],
      lastRestockAt: new Date(Date.now() - i * 86400000).toISOString()
    };
  });
};

const generateReplenishRequests = (count: number): ReplenishRequest[] => {
  return Array.from({ length: count }, (_, i) => {
    const status = replenishStatuses[i % replenishStatuses.length];
    const approvalsCount = status === 'pending_supervisor' ? 0 :
                          status === 'pending_manager' ? 1 :
                          status === 'pending_director' ? 2 :
                          status === 'approved' ? 3 :
                          Math.floor(Math.random() * 3) + 1;
    const approvals = Array.from({ length: approvalsCount }, (_, j) => ({
      level: (j + 1) as 1 | 2 | 3,
      approverId: `a${j + 1}`,
      approverName: approverNames[j],
      action: (j === approvalsCount - 1 && status === 'rejected') ? 'reject' : 'approve' as 'approve' | 'reject',
      comment: j === approvalsCount - 1 && status === 'rejected' ? '库存充足，暂缓补货' : '同意补货',
      approvedAt: new Date(Date.now() - (i + j) * 3600000).toISOString()
    }));
    return {
      id: `rr${i + 1}`,
      requestNo: `REP${String(i + 1).padStart(5, '0')}`,
      skuId: `SKU${String(1000 + i).padStart(4, '0')}`,
      skuName: skuNames[i % skuNames.length],
      quantity: Math.floor(Math.random() * 500) + 100,
      reason: reasons[i % reasons.length],
      currentStock: Math.floor(Math.random() * 50) + 10,
      safeStock: Math.floor(Math.random() * 100) + 50,
      approvals,
      status,
      createdAt: new Date(Date.now() - i * 7200000).toISOString(),
      applicantId: `u${(i % 5) + 1}`,
      applicantName: applicantNames[i % applicantNames.length],
      putawayTaskId: status === 'approved' ? `pwt${i + 1}` : undefined
    };
  });
};

const generatePutawayTasks = (count: number, requests: ReplenishRequest[]): PutawayTask[] => {
  return Array.from({ length: count }, (_, i) => {
    const status = putawayStatuses[i % putawayStatuses.length];
    const hasAssignee = status !== 'pending';
    const request = requests.find(r => r.id === `rr${i + 1}`);
    return {
      id: `pwt${i + 1}`,
      taskNo: `PUT${String(i + 1).padStart(5, '0')}`,
      replenishRequestId: `rr${i + 1}`,
      skuId: `SKU${String(1000 + i).padStart(4, '0')}`,
      skuName: skuNames[i % skuNames.length],
      quantity: Math.floor(Math.random() * 500) + 100,
      targetLocation: locations[i % locations.length],
      assigneeId: hasAssignee ? `u${(i % 5) + 1}` : undefined,
      assigneeName: hasAssignee ? applicantNames[i % applicantNames.length] : undefined,
      status,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      completedAt: status === 'completed' ? new Date(Date.now() - i * 1800000).toISOString() : undefined,
      sourceRequestNo: request?.requestNo,
      sourceApplicantName: request?.applicantName,
      sourceApprovedAt: request?.approvals?.[request.approvals.length - 1]?.approvedAt,
      sourceApprovals: request?.approvals,
    };
  });
};

interface InventoryState {
  inventory: Inventory[];
  replenishRequests: ReplenishRequest[];
  putawayTasks: PutawayTask[];
  loading: boolean;
  fetchInventory: () => Promise<void>;
  fetchReplenishRequests: () => Promise<void>;
  fetchPutawayTasks: () => Promise<void>;
  approveReplenish: (requestId: string, level: 1 | 2 | 3, approverId: string, comment: string, action: 'approve' | 'reject') => Promise<void>;
  createPutawayTask: (requestId: string) => Promise<void>;
  claimPutawayTask: (taskId: string, userId: string, userName: string) => Promise<void>;
  startPutaway: (taskId: string) => Promise<void>;
  completePutaway: (taskId: string) => Promise<void>;
}

const persisted = loadPersisted();
const initialReplenishRequests: ReplenishRequest[] = persisted?.replenishRequests ?? [];
const initialPutawayTasks: PutawayTask[] = persisted?.putawayTasks ?? [];

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventory: [],
  replenishRequests: initialReplenishRequests,
  putawayTasks: initialPutawayTasks,
  loading: false,
  fetchInventory: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => ({
      inventory: state.inventory.length > 0 ? state.inventory : generateInventory(25),
      loading: false,
    }));
  },
  fetchReplenishRequests: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => {
      if (state.replenishRequests.length > 0) {
        return { loading: false };
      }
      const requests = generateReplenishRequests(18);
      return { replenishRequests: requests, loading: false };
    });
  },
  fetchPutawayTasks: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => {
      if (state.putawayTasks.length > 0) {
        return { loading: false };
      }
      let requests = state.replenishRequests;
      if (requests.length === 0) {
        requests = generateReplenishRequests(18);
      }
      const tasks = generatePutawayTasks(15, requests);
      return { replenishRequests: requests, putawayTasks: tasks, loading: false };
    });
  },
  approveReplenish: async (requestId, level, approverId, comment, action) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const approverName = approverNames[level - 1];
    const newApproval = {
      level,
      approverId,
      approverName,
      action,
      comment,
      approvedAt: new Date().toISOString()
    };
    set((state) => {
      const replenishRequests = state.replenishRequests.map((r) => {
        if (r.id !== requestId) return r;
        let newStatus: ReplenishStatus = r.status;
        if (action === 'reject') {
          newStatus = 'rejected';
        } else if (level === 1) {
          newStatus = 'pending_manager';
        } else if (level === 2) {
          newStatus = 'pending_director';
        } else if (level === 3) {
          newStatus = 'approved';
        }
        return {
          ...r,
          approvals: [...r.approvals, newApproval],
          status: newStatus
        };
      });
      savePersisted({ replenishRequests, putawayTasks: state.putawayTasks });
      return { replenishRequests };
    });
    if (action === 'approve' && level === 3) {
      await get().createPutawayTask(requestId);
    }
  },
  createPutawayTask: async (requestId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => {
      const request = state.replenishRequests.find((r) => r.id === requestId);
      if (!request) return state;
      const exists = state.putawayTasks.some(t => t.replenishRequestId === requestId);
      if (exists) return state;
      const now = new Date().toISOString();
      const newTask: PutawayTask = {
        id: `pwt${Date.now()}`,
        taskNo: `PUT${String(Date.now()).slice(-5)}`,
        replenishRequestId: requestId,
        skuId: request.skuId,
        skuName: request.skuName,
        quantity: request.quantity,
        targetLocation: locations[Math.floor(Math.random() * locations.length)],
        status: 'pending',
        createdAt: now,
        sourceRequestNo: request.requestNo,
        sourceApplicantName: request.applicantName,
        sourceApprovedAt: now,
        sourceApprovals: [...request.approvals],
      };
      const replenishRequests = state.replenishRequests.map(r =>
        r.id === requestId ? { ...r, putawayTaskId: newTask.id } : r
      );
      const putawayTasks = [newTask, ...state.putawayTasks];
      savePersisted({ replenishRequests, putawayTasks });
      return { replenishRequests, putawayTasks };
    });
  },
  claimPutawayTask: async (taskId, userId, userName) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    set((state) => {
      const putawayTasks: PutawayTask[] = state.putawayTasks.map((t) =>
        t.id === taskId && t.status === 'pending'
          ? { ...t, status: 'assigned' as PutawayTaskStatus, assigneeId: userId, assigneeName: userName }
          : t
      );
      savePersisted({ replenishRequests: state.replenishRequests, putawayTasks });
      return { putawayTasks };
    });
  },
  startPutaway: async (taskId) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    set((state) => {
      const putawayTasks: PutawayTask[] = state.putawayTasks.map((t) =>
        t.id === taskId && t.status === 'assigned'
          ? { ...t, status: 'in_progress' as PutawayTaskStatus }
          : t
      );
      savePersisted({ replenishRequests: state.replenishRequests, putawayTasks });
      return { putawayTasks };
    });
  },
  completePutaway: async (taskId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    set((state) => {
      const putawayTasks: PutawayTask[] = state.putawayTasks.map((t) =>
        t.id === taskId && t.status === 'in_progress'
          ? { ...t, status: 'completed' as PutawayTaskStatus, completedAt: new Date().toISOString() }
          : t
      );
      savePersisted({ replenishRequests: state.replenishRequests, putawayTasks });
      return { putawayTasks };
    });
  }
}));
