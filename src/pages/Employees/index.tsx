import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  Search,
  ArrowRight,
  Sun,
  Moon,
  Sunset,
  Coffee,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { usePermission } from '@/hooks/usePermission';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { getRoleName, getRoleColor } from '@/utils/permission';
import type { User, Attendance, UserRole, AttendanceStatus, ShiftType } from '@/types';

type StatusBadgeType = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'running' | 'idle' | 'fault' | 'completed' | 'processing';

const attendanceStatusConfig: Record<AttendanceStatus, { label: string; type: StatusBadgeType }> = {
  normal: { label: '正常', type: 'success' },
  late: { label: '迟到', type: 'warning' },
  early_leave: { label: '早退', type: 'warning' },
  absent: { label: '缺勤', type: 'danger' },
};

const shiftConfig: Record<ShiftType, { label: string; icon: LucideIcon; color: string; time: string }> = {
  morning: { label: '早班', icon: Sun, color: 'bg-warning/15 text-warning border-warning/30', time: '08:00-16:00' },
  afternoon: { label: '中班', icon: Sunset, color: 'bg-primary-500/15 text-primary-500 border-primary-500/30', time: '14:00-22:00' },
  night: { label: '晚班', icon: Moon, color: 'bg-accent-500/15 text-accent-500 border-accent-500/30', time: '22:00-06:00' },
  off: { label: '休息', icon: Coffee, color: 'bg-dark-500/15 text-dark-400 border-dark-500/30', time: '-' },
};

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-sm';
  const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold text-white', sizeClass)}
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 1)}
    </div>
  );
}

export default function EmployeesIndex() {
  const navigate = useNavigate();
  const { canAccess } = usePermission();
  const { users, attendances, schedules, loading, fetchUsers, fetchAttendances, fetchSchedules } = useEmployeeStore();
  const [activeTab, setActiveTab] = useState<'list' | 'attendance' | 'schedule'>('list');
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleWeek, setScheduleWeek] = useState(0);

  useEffect(() => {
    if (canAccess('leader')) {
      fetchUsers();
      fetchAttendances();
      fetchSchedules();
    }
  }, [canAccess, fetchUsers, fetchAttendances, fetchSchedules]);

  const tabs = [
    { key: 'list' as const, label: '员工列表', icon: Users },
    { key: 'attendance' as const, label: '出勤管理', icon: Calendar },
    { key: 'schedule' as const, label: '智能排班', icon: Clock },
  ];

  const filteredUsers = users.filter((u) => {
    const matchSearch = !searchText || u.name.includes(searchText) || u.employeeNo.includes(searchText);
    const matchRole = selectedRole === 'all' || u.role === selectedRole;
    return matchSearch && matchRole;
  });

  const userColumns: Column<User>[] = [
    {
      key: 'name',
      title: '姓名',
      dataIndex: 'name',
      render: (val, record) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={val} />
          <div>
            <p className="text-sm font-medium text-white">{val}</p>
            <p className="text-xs text-dark-500 font-mono">{record.employeeNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: '角色',
      dataIndex: 'role',
      render: (val: UserRole) => (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border"
          style={{ color: getRoleColor(val), backgroundColor: `${getRoleColor(val)}15`, borderColor: `${getRoleColor(val)}30` }}
        >
          {getRoleName(val)}
        </span>
      ),
    },
    {
      key: 'area',
      title: '区域',
      dataIndex: 'area',
      render: (val) => <span className="text-sm text-dark-300">{val}</span>,
    },
    {
      key: 'phone',
      title: '联系方式',
      dataIndex: 'phone',
      render: (val) => <span className="text-sm text-dark-300 font-mono">{val}</span>,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      render: (val: 'on' | 'off' | 'break') => {
        const statusMap: Record<'on' | 'off' | 'break', { type: StatusBadgeType; text: string }> = {
          on: { type: 'running', text: '在岗' },
          off: { type: 'idle', text: '离岗' },
          break: { type: 'pending', text: '休息' },
        };
        return <StatusBadge status={statusMap[val].type} text={statusMap[val].text} pulse={val === 'on'} />;
      },
    },
  ];

  const filteredAttendances = attendances.filter((a) => a.date === attendanceDate);

  const attendanceColumns: Column<Attendance>[] = [
    {
      key: 'userName',
      title: '姓名',
      dataIndex: 'userName',
      render: (val) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={val} size="sm" />
          <span className="text-sm font-medium text-white">{val}</span>
        </div>
      ),
    },
    {
      key: 'date',
      title: '日期',
      dataIndex: 'date',
      render: (val) => <span className="text-sm text-dark-300">{val}</span>,
    },
    {
      key: 'checkInAt',
      title: '签到时间',
      dataIndex: 'checkInAt',
      render: (val) => val ? <span className="text-sm text-dark-300 font-mono">{new Date(val).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span> : <span className="text-sm text-dark-500">-</span>,
    },
    {
      key: 'checkOutAt',
      title: '签退时间',
      dataIndex: 'checkOutAt',
      render: (val) => val ? <span className="text-sm text-dark-300 font-mono">{new Date(val).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span> : <span className="text-sm text-dark-500">-</span>,
    },
    {
      key: 'workHours',
      title: '工时(h)',
      dataIndex: 'workHours',
      align: 'right',
      render: (val) => <span className="text-sm text-dark-200 font-medium">{val}</span>,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      render: (val: AttendanceStatus) => {
        const cfg = attendanceStatusConfig[val];
        return <StatusBadge status={cfg.type} text={cfg.label} />;
      },
    },
  ];

  const getWeekDates = (offset: number) => {
    const dates = [];
    const now = new Date();
    now.setDate(now.getDate() + offset * 7);
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates(scheduleWeek);
  const weekdayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const getScheduleForUser = (userId: string, date: string) => {
    return schedules.find((s) => s.userId === userId && s.date === date);
  };

  if (!canAccess('leader')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-xl font-semibold text-white">无访问权限</h2>
        <p className="text-dark-400">您没有权限查看此页面，请联系管理员</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">人员管理</h1>
          <p className="text-sm text-dark-400 mt-1">管理员工信息、出勤记录和排班计划</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/employees/performance')} rightIcon={<ArrowRight className="w-4 h-4" />}>
          绩效考核
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-dark-700 bg-dark-800/30 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              activeTab === tab.key
                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/30'
                : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                <input
                  type="text"
                  placeholder="搜索员工姓名或工号..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-dark-700/50 border border-dark-600 text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-primary-500/50"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                className="h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-dark-200 text-sm focus:outline-none focus:border-primary-500/50"
              >
                <option value="all">全部角色</option>
                <option value="picker">分拣员</option>
                <option value="leader">组长</option>
                <option value="manager">经理</option>
                <option value="director">总监</option>
              </select>
            </div>
          </div>
          <DataTable
            columns={userColumns}
            data={filteredUsers}
            rowKey="id"
            loading={loading}
          />
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-dark-400">选择日期：</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-dark-200 text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>
          <DataTable
            columns={attendanceColumns}
            data={filteredAttendances}
            rowKey="id"
            loading={loading}
          />
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setScheduleWeek((w) => w - 1)}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm font-medium text-white">
                  {weekDates[0]} ~ {weekDates[6]}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setScheduleWeek((w) => w + 1)}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setScheduleWeek(0)}>
                  本周
                </Button>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {Object.entries(shiftConfig).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={cn('w-2.5 h-2.5 rounded-sm border', cfg.color.split(' ')[0], cfg.color.split(' ')[2])} />
                    <span className="text-dark-400">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="rounded-xl border border-dark-700 bg-dark-800/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-dark-700 bg-dark-800/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-dark-300 uppercase tracking-wider sticky left-0 bg-dark-800/80 z-10 w-40">
                        员工
                      </th>
                      {weekDates.map((date, idx) => (
                        <th key={date} className="px-3 py-3 text-center text-xs font-semibold text-dark-300 uppercase tracking-wider min-w-[100px]">
                          <div>{weekdayNames[idx]}</div>
                          <div className="text-dark-500 font-normal mt-0.5">{date.slice(5)}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/60">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-dark-700/30">
                        <td className="px-4 py-3 sticky left-0 bg-dark-800/80 z-10">
                          <div className="flex items-center gap-2">
                            <UserAvatar name={user.name} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-white">{user.name}</p>
                              <p className="text-xs text-dark-500">{getRoleName(user.role)}</p>
                            </div>
                          </div>
                        </td>
                        {weekDates.map((date) => {
                          const sch = getScheduleForUser(user.id, date);
                          const shift = sch?.shift || 'off';
                          const cfg = shiftConfig[shift];
                          const Icon = cfg.icon;
                          return (
                            <td key={date} className="px-3 py-3">
                              <div className={cn('flex flex-col items-center gap-1 py-2 rounded-lg border', cfg.color)}>
                                <Icon className="w-4 h-4" />
                                <span className="text-xs font-medium">{cfg.label}</span>
                                <span className="text-[10px] opacity-70">{cfg.time}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
