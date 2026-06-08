import { create } from 'zustand';
import type { User, EmployeePerformance, Attendance, Schedule, ExceptionOrder, UserRole, AttendanceStatus, ShiftType, ExceptionType, ExceptionStatus } from '../types';

const roles: UserRole[] = ['picker', 'picker', 'picker', 'leader', 'manager', 'director'];
const userNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二', '陈十三', '褚十四', '卫十五', '蒋十六', '沈十七'];
const areas = ['A区', 'B区', 'C区', 'D区'];
const statuses: Array<'on' | 'off' | 'break'> = ['on', 'on', 'on', 'break', 'off'];
const attendanceStatuses: AttendanceStatus[] = ['normal', 'normal', 'normal', 'late', 'early_leave', 'absent'];
const shifts: ShiftType[] = ['morning', 'morning', 'afternoon', 'afternoon', 'night', 'off'];
const exceptionTypes: ExceptionType[] = ['package_drop', 'label_unclear', 'wrong_sort', 'damage'];
const exceptionStatuses: ExceptionStatus[] = ['pending', 'processing', 'resolved'];
const exceptionDescriptions = ['包裹掉落，外包装损坏', '面单模糊，无法识别收件信息', '分拣错误，发往错误站点', '商品破损，客户拒收'];

const generateUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `u${i + 1}`,
    name: userNames[i % userNames.length],
    employeeNo: `EMP${String(1000 + i).padStart(4, '0')}`,
    role: roles[i % roles.length],
    area: areas[i % areas.length],
    phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
    status: statuses[i % statuses.length],
    createdAt: new Date(Date.now() - i * 86400000 * 30).toISOString()
  }));
};

const generatePerformances = (count: number): EmployeePerformance[] => {
  return Array.from({ length: count }, (_, i) => ({
    userId: `u${(i % 15) + 1}`,
    userName: userNames[i % userNames.length],
    employeeNo: `EMP${String(1000 + (i % 15)).padStart(4, '0')}`,
    role: roles[i % roles.length],
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    pickingCount: Math.floor(Math.random() * 300) + 100,
    sortingCount: Math.floor(Math.random() * 500) + 200,
    accuracy: Math.round((Math.random() * 8 + 92) * 100) / 100,
    workHours: Math.round((Math.random() * 4 + 6) * 10) / 10,
    efficiencyScore: Math.round(Math.random() * 30 + 70),
    ranking: i + 1
  }));
};

const generateAttendances = (count: number): Attendance[] => {
  return Array.from({ length: count }, (_, i) => {
    const status = attendanceStatuses[i % attendanceStatuses.length];
    const baseDate = new Date(Date.now() - i * 86400000);
    const checkInHour = status === 'late' ? 9 : status === 'absent' ? undefined : 8;
    const checkOutHour = status === 'early_leave' ? 15 : status === 'absent' ? undefined : 18;
    return {
      id: `att${i + 1}`,
      userId: `u${(i % 15) + 1}`,
      userName: userNames[i % userNames.length],
      date: baseDate.toISOString().split('T')[0],
      checkInAt: checkInHour !== undefined ? new Date(baseDate.setHours(checkInHour, Math.floor(Math.random() * 30))).toISOString() : undefined,
      checkOutAt: checkOutHour !== undefined ? new Date(baseDate.setHours(checkOutHour, Math.floor(Math.random() * 30))).toISOString() : undefined,
      status,
      workHours: status === 'absent' ? 0 : Math.round((Math.random() * 3 + 6) * 10) / 10
    };
  });
};

const generateSchedules = (count: number): Schedule[] => {
  return Array.from({ length: count }, (_, i) => {
    const shift = shifts[i % shifts.length];
    const timeMap: Record<ShiftType, { start: string; end: string } | {}> = {
      morning: { start: '08:00', end: '16:00' },
      afternoon: { start: '14:00', end: '22:00' },
      night: { start: '22:00', end: '06:00' },
      off: {}
    };
    return {
      id: `sch${i + 1}`,
      userId: `u${(i % 15) + 1}`,
      userName: userNames[i % userNames.length],
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      shift,
      ...timeMap[shift]
    };
  });
};

const generateExceptions = (count: number): ExceptionOrder[] => {
  return Array.from({ length: count }, (_, i) => {
    const status = exceptionStatuses[i % exceptionStatuses.length];
    const hasHandler = status !== 'pending';
    return {
      id: `ex${i + 1}`,
      exceptionNo: `EXC${String(i + 1).padStart(5, '0')}`,
      type: exceptionTypes[i % exceptionTypes.length],
      orderId: `o${i + 1}`,
      orderNo: `ORD${Date.now()}${String(i).padStart(4, '0')}`,
      description: exceptionDescriptions[i % exceptionDescriptions.length],
      photos: [`/images/exception${i % 4 + 1}.jpg`],
      handlerId: hasHandler ? `u${(i % 5) + 1}` : undefined,
      handlerName: hasHandler ? userNames[i % userNames.length] : undefined,
      status,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      resolvedAt: status === 'resolved' ? new Date(Date.now() - i * 1800000).toISOString() : undefined,
      resolution: status === 'resolved' ? '已重新包装并更换面单，正常发出' : undefined
    };
  });
};

interface EmployeeState {
  users: User[];
  performances: EmployeePerformance[];
  attendances: Attendance[];
  schedules: Schedule[];
  exceptions: ExceptionOrder[];
  loading: boolean;
  fetchUsers: () => Promise<void>;
  fetchPerformances: () => Promise<void>;
  fetchAttendances: () => Promise<void>;
  fetchSchedules: () => Promise<void>;
  fetchExceptions: () => Promise<void>;
  handleException: (exceptionId: string, handlerId: string, resolution: string, photos: string[]) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  users: [],
  performances: [],
  attendances: [],
  schedules: [],
  exceptions: [],
  loading: false,
  fetchUsers: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ users: generateUsers(15), loading: false });
  },
  fetchPerformances: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ performances: generatePerformances(20), loading: false });
  },
  fetchAttendances: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ attendances: generateAttendances(25), loading: false });
  },
  fetchSchedules: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ schedules: generateSchedules(20), loading: false });
  },
  fetchExceptions: async () => {
    set({ loading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ exceptions: generateExceptions(12), loading: false });
  },
  handleException: async (exceptionId, handlerId, resolution, photos) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const handlerName = userNames[parseInt(handlerId.slice(1)) % userNames.length];
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === exceptionId ? {
          ...e,
          handlerId,
          handlerName,
          status: 'resolved' as ExceptionStatus,
          resolvedAt: new Date().toISOString(),
          resolution,
          photos: [...e.photos, ...photos]
        } : e
      )
    }));
  }
}));
