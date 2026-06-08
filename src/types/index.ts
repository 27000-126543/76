export type UserRole = 'picker' | 'leader' | 'manager' | 'director';

export interface User {
  id: string;
  name: string;
  employeeNo: string;
  role: UserRole;
  area: string;
  avatar?: string;
  phone: string;
  status: 'on' | 'off' | 'break';
  createdAt: string;
}

export interface OrderItem {
  skuId: string;
  skuName: string;
  quantity: number;
  location: string;
}

export type OrderStatus = 'pending' | 'picking' | 'sorting' | 'shipped' | 'exception';

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  address: string;
  province: string;
  city: string;
  district: string;
  items: OrderItem[];
  status: OrderStatus;
  priority: 'normal' | 'urgent';
  waveId?: string;
  createdAt: string;
  promisedTime: string;
}

export interface RoutePoint {
  location: string;
  skuIds: string[];
  sequence: number;
}

export type WaveStatus = 'created' | 'assigned' | 'picking' | 'completed';

export interface Wave {
  id: string;
  waveNo: string;
  area: string;
  orderIds: string[];
  orderCount: number;
  skuCount: number;
  route: RoutePoint[];
  status: WaveStatus;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  estimatedDistance: number;
}

export interface TaskItem {
  skuId: string;
  skuName: string;
  location: string;
  quantity: number;
  picked: boolean;
}

export type PickingTaskStatus = 'pending' | 'accepted' | 'picking' | 'completed' | 'exception';

export interface PickingTask {
  id: string;
  taskNo: string;
  waveId: string;
  orderIds: string[];
  assigneeId: string;
  assigneeName: string;
  status: PickingTaskStatus;
  items: TaskItem[];
  pickedAt?: string;
  completedAt?: string;
}

export interface SortingStation {
  id: string;
  stationNo: string;
  destination: string;
  throughput: number;
  status: 'running' | 'idle' | 'fault';
  todayCount: number;
}

export type ExceptionType = 'package_drop' | 'label_unclear' | 'wrong_sort' | 'damage';
export type ExceptionStatus = 'pending' | 'processing' | 'resolved';

export interface ExceptionOrder {
  id: string;
  exceptionNo: string;
  type: ExceptionType;
  orderId: string;
  orderNo: string;
  description: string;
  photos: string[];
  handlerId?: string;
  handlerName?: string;
  status: ExceptionStatus;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export type ABCClass = 'A' | 'B' | 'C';

export interface Inventory {
  id: string;
  skuId: string;
  skuName: string;
  category: string;
  quantity: number;
  safeStock: number;
  location: string;
  abcClass: ABCClass;
  lastRestockAt?: string;
}

export type ReplenishStatus = 'pending_supervisor' | 'pending_manager' | 'pending_director' | 'approved' | 'rejected';

export interface ApprovalRecord {
  level: 1 | 2 | 3;
  approverId: string;
  approverName: string;
  action: 'approve' | 'reject';
  comment?: string;
  approvedAt: string;
}

export interface ReplenishRequest {
  id: string;
  requestNo: string;
  skuId: string;
  skuName: string;
  quantity: number;
  reason: string;
  currentStock: number;
  safeStock: number;
  approvals: ApprovalRecord[];
  status: ReplenishStatus;
  createdAt: string;
  applicantId: string;
  applicantName: string;
}

export type PutawayTaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed';

export interface PutawayTask {
  id: string;
  taskNo: string;
  replenishRequestId: string;
  skuId: string;
  skuName: string;
  quantity: number;
  targetLocation: string;
  assigneeId?: string;
  assigneeName?: string;
  status: PutawayTaskStatus;
  createdAt: string;
  completedAt?: string;
}

export type EquipmentType = 'conveyor' | 'sorter' | 'scanner' | 'scale';
export type EquipmentStatus = 'running' | 'idle' | 'fault' | 'maintenance';

export interface EquipmentParams {
  temperature?: number;
  speed?: number;
  vibration?: number;
  voltage?: number;
  throughput?: number;
}

export interface Equipment {
  id: string;
  equipmentNo: string;
  name: string;
  type: EquipmentType;
  area: string;
  status: EquipmentStatus;
  params: EquipmentParams;
  lastMaintenanceAt?: string;
  runningHours: number;
}

export type MaintenanceUrgency = 'critical' | 'normal' | 'low';
export type MaintenanceStatus = 'pending' | 'accepted' | 'repairing' | 'completed' | 'escalated';

export interface MaintenanceOrder {
  id: string;
  orderNo: string;
  equipmentId: string;
  equipmentName: string;
  faultDescription: string;
  urgency: MaintenanceUrgency;
  teamId?: string;
  teamName?: string;
  assigneeId?: string;
  assigneeName?: string;
  status: MaintenanceStatus;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  escalatedAt?: string;
  resolution?: string;
}

export interface EmployeePerformance {
  userId: string;
  userName: string;
  employeeNo: string;
  role: string;
  date: string;
  pickingCount: number;
  sortingCount: number;
  accuracy: number;
  workHours: number;
  efficiencyScore: number;
  ranking?: number;
}

export type AttendanceStatus = 'normal' | 'late' | 'early_leave' | 'absent';

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: AttendanceStatus;
  workHours: number;
}

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'off';

export interface Schedule {
  id: string;
  userId: string;
  userName: string;
  date: string;
  shift: ShiftType;
  startTime?: string;
  endTime?: string;
}

export interface DailyMetric {
  date: string;
  orders: number;
  efficiency: number;
  onTimeRate: number;
}

export interface MonthlyReport {
  month: string;
  totalOrders: number;
  onTimeRate: number;
  sortingEfficiency: number;
  equipmentHealthRate: number;
  topEmployees: EmployeePerformance[];
  dailyTrend: DailyMetric[];
}

export type Region = 'east' | 'south' | 'north' | 'southwest';

export const REGION_OPTIONS: { value: Region; label: string }[] = [
  { value: 'east', label: '华东' },
  { value: 'south', label: '华南' },
  { value: 'north', label: '华北' },
  { value: 'southwest', label: '西南' },
];

export interface SortingLineThroughput {
  lineName: string;
  throughput: number;
}

export interface DashboardMetrics {
  todayOrders: number;
  yesterdayOrders: number;
  sortingEfficiency: number;
  sortingEfficiencyTrend: number[];
  sortingEfficiencyTrendHours: string[];
  equipmentHealthRate: number;
  orderOnTimeRate: number;
  orderOnTimeBreakdown: { name: string; value: number }[];
  pendingExceptions: number;
  activeEmployees: number;
  waveInProgress: number;
  sortingLineThroughput: SortingLineThroughput[];
}
