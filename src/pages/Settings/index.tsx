import { useEffect, useState } from 'react';
import {
  Settings,
  Users,
  Shield,
  Plus,
  Edit3,
  Trash2,
  Search,
  Check,
  X,
  Eye,
} from 'lucide-react';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { usePermission } from '@/hooks/usePermission';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';
import { getRoleName, getRoleColor } from '@/utils/permission';
import type { User, UserRole } from '@/types';

type StatusBadgeType = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'running' | 'idle' | 'fault' | 'completed' | 'processing';

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-sm';
  const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold text-white shadow', sizeClass)}
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 1)}
    </div>
  );
}

interface RolePermission {
  key: string;
  label: string;
  permissions: { key: string; label: string }[];
}

const rolePermissions: RolePermission[] = [
  {
    key: 'dashboard',
    label: '数据看板',
    permissions: [
      { key: 'view', label: '查看' },
    ],
  },
  {
    key: 'orders',
    label: '订单管理',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'edit', label: '编辑' },
      { key: 'delete', label: '删除' },
    ],
  },
  {
    key: 'waves',
    label: '波次调度',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'create', label: '创建' },
      { key: 'assign', label: '分配' },
    ],
  },
  {
    key: 'picking',
    label: '拣货作业',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'operate', label: '操作' },
    ],
  },
  {
    key: 'sorting',
    label: '分拣中心',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'manage', label: '管理' },
    ],
  },
  {
    key: 'inventory',
    label: '库存管理',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'edit', label: '编辑' },
      { key: 'replenish', label: '补货审批' },
    ],
  },
  {
    key: 'equipment',
    label: '设备监控',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'maintenance', label: '维修管理' },
    ],
  },
  {
    key: 'statistics',
    label: '数据分析',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'export', label: '导出' },
    ],
  },
  {
    key: 'employees',
    label: '人员管理',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'edit', label: '编辑' },
      { key: 'schedule', label: '排班' },
      { key: 'performance', label: '绩效' },
    ],
  },
  {
    key: 'approval',
    label: '审批中心',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'approve', label: '审批' },
    ],
  },
  {
    key: 'settings',
    label: '系统设置',
    permissions: [
      { key: 'view', label: '查看' },
      { key: 'manage', label: '管理' },
    ],
  },
];

const rolePermissionMatrix: Record<UserRole, Record<string, string[]>> = {
  picker: {
    dashboard: ['view'],
    picking: ['view', 'operate'],
    employees: ['performance'],
  },
  leader: {
    dashboard: ['view'],
    orders: ['view'],
    waves: ['view', 'create', 'assign'],
    picking: ['view', 'operate'],
    sorting: ['view', 'manage'],
    inventory: ['view'],
    exceptions: ['view'],
    equipment: ['view'],
    employees: ['view', 'schedule', 'performance'],
    approval: ['view'],
  },
  manager: {
    dashboard: ['view'],
    orders: ['view', 'edit'],
    waves: ['view', 'create', 'assign'],
    picking: ['view', 'operate'],
    sorting: ['view', 'manage'],
    inventory: ['view', 'edit', 'replenish'],
    exceptions: ['view', 'edit'],
    equipment: ['view', 'maintenance'],
    statistics: ['view', 'export'],
    employees: ['view', 'edit', 'schedule', 'performance'],
    approval: ['view', 'approve'],
  },
  director: {
    dashboard: ['view'],
    orders: ['view', 'edit', 'delete'],
    waves: ['view', 'create', 'assign'],
    picking: ['view', 'operate'],
    sorting: ['view', 'manage'],
    inventory: ['view', 'edit', 'replenish'],
    exceptions: ['view', 'edit'],
    equipment: ['view', 'maintenance'],
    statistics: ['view', 'export'],
    employees: ['view', 'edit', 'schedule', 'performance'],
    approval: ['view', 'approve'],
    settings: ['view', 'manage'],
  },
};

export default function SettingsIndex() {
  const { canAccess } = usePermission();
  const { users, loading, fetchUsers } = useEmployeeStore();
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [searchText, setSearchText] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('manager');
  const [permissions, setPermissions] = useState<Record<string, string[]>>(rolePermissionMatrix['manager']);
  const [formData, setFormData] = useState({
    name: '',
    employeeNo: '',
    role: 'picker' as UserRole,
    area: 'A区',
    phone: '',
    status: 'on' as 'on' | 'off' | 'break',
  });

  useEffect(() => {
    if (canAccess('director')) {
      fetchUsers();
    }
  }, [canAccess, fetchUsers]);

  useEffect(() => {
    setPermissions({ ...rolePermissionMatrix[selectedRole] });
  }, [selectedRole]);

  const tabs = [
    { key: 'users' as const, label: '用户管理', icon: Users },
    { key: 'roles' as const, label: '角色权限配置', icon: Shield },
  ];

  const filteredUsers = users.filter((u) => {
    return !searchText || u.name.includes(searchText) || u.employeeNo.includes(searchText);
  });

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', employeeNo: '', role: 'picker', area: 'A区', phone: '', status: 'on' });
    setUserModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      employeeNo: user.employeeNo,
      role: user.role,
      area: user.area,
      phone: user.phone,
      status: user.status,
    });
    setUserModalOpen(true);
  };

  const togglePermission = (moduleKey: string, permKey: string) => {
    setPermissions((prev) => {
      const modulePerms = prev[moduleKey] || [];
      const hasPerm = modulePerms.includes(permKey);
      return {
        ...prev,
        [moduleKey]: hasPerm ? modulePerms.filter((p) => p !== permKey) : [...modulePerms, permKey],
      };
    });
  };

  const hasPermission = (moduleKey: string, permKey: string) => {
    return (permissions[moduleKey] || []).includes(permKey);
  };

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
        return <StatusBadge status={statusMap[val].type} text={statusMap[val].text} />;
      },
    },
    {
      key: 'actions',
      title: '操作',
      render: (_val, record) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEditModal(record); }}>
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const roles: { key: UserRole; label: string; desc: string }[] = [
    { key: 'picker', label: '分拣员', desc: '基础操作角色，负责拣货和分拣作业' },
    { key: 'leader', label: '组长', desc: '基层管理角色，负责现场调度和人员管理' },
    { key: 'manager', label: '经理', desc: '中层管理角色，负责运营管理和数据分析' },
    { key: 'director', label: '总监', desc: '高级管理角色，拥有所有系统权限' },
  ];

  if (!canAccess('director')) {
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary-500" />
            系统设置
          </h1>
          <p className="text-sm text-dark-400 mt-1">管理用户账户和角色权限配置</p>
        </div>
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

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="搜索用户姓名或工号..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-dark-700/50 border border-dark-600 text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
              新增用户
            </Button>
          </div>

          <DataTable
            columns={userColumns}
            data={filteredUsers}
            rowKey="id"
            loading={loading}
          />

          <Modal
            open={userModalOpen}
            onClose={() => setUserModalOpen(false)}
            title={editingUser ? '编辑用户' : '新增用户'}
            onOk={() => setUserModalOpen(false)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">姓名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-white text-sm focus:outline-none focus:border-primary-500/50"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">工号</label>
                  <input
                    type="text"
                    value={formData.employeeNo}
                    onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-white text-sm focus:outline-none focus:border-primary-500/50"
                    placeholder="请输入工号"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">角色</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  >
                    <option value="picker">分拣员</option>
                    <option value="leader">组长</option>
                    <option value="manager">经理</option>
                    <option value="director">总监</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-dark-300 mb-1.5">负责区域</label>
                  <select
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-white text-sm focus:outline-none focus:border-primary-500/50"
                  >
                    <option value="A区">A区</option>
                    <option value="B区">B区</option>
                    <option value="C区">C区</option>
                    <option value="D区">D区</option>
                    <option value="全场">全场</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-dark-300 mb-1.5">联系电话</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-white text-sm focus:outline-none focus:border-primary-500/50"
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <p className="text-sm text-dark-400 mb-2">选择角色</p>
            {roles.map((role) => (
              <div
                key={role.key}
                onClick={() => setSelectedRole(role.key)}
                className={cn(
                  'p-4 rounded-xl border cursor-pointer transition-all duration-200',
                  selectedRole === role.key
                    ? 'bg-primary-500/10 border-primary-500/40'
                    : 'bg-dark-800/30 border-dark-700 hover:border-dark-600'
                )}
              >
                <div className="flex items-center gap-3 mb-1">
                  <Shield
                    className={cn('w-5 h-5', selectedRole === role.key ? 'text-primary-400' : 'text-dark-400')}
                  />
                  <span
                    className={cn('font-semibold', selectedRole === role.key ? 'text-white' : 'text-dark-200')}
                    style={{ color: selectedRole === role.key ? getRoleColor(role.key) : undefined }}
                  >
                    {role.label}
                  </span>
                </div>
                <p className="text-xs text-dark-500 ml-8">{role.desc}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3 rounded-xl border border-dark-700 bg-dark-800/30 p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary-500" />
                {getRoleName(selectedRole)} - 权限配置
              </h2>
              <div className="flex items-center gap-2 text-xs text-dark-400">
                <Check className="w-3.5 h-3.5 text-success" />
                <span>已启用</span>
                <X className="w-3.5 h-3.5 text-dark-500 ml-3" />
                <span>未启用</span>
              </div>
            </div>

            <div className="space-y-4">
              {rolePermissions.map((module) => (
                <div key={module.key} className="border-b border-dark-700/50 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded-full bg-primary-500" />
                    <p className="text-sm font-semibold text-white">{module.label}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 ml-3">
                    {module.permissions.map((perm) => {
                      const isEnabled = hasPermission(module.key, perm.key);
                      return (
                        <button
                          key={perm.key}
                          onClick={() => togglePermission(module.key, perm.key)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all duration-200',
                            isEnabled
                              ? 'bg-primary-500/15 border-primary-500/40 text-primary-400'
                              : 'bg-dark-700/30 border-dark-600 text-dark-400 hover:border-dark-500 hover:text-dark-300'
                          )}
                        >
                          {isEnabled ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          {perm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-dark-700/50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPermissions({ ...rolePermissionMatrix[selectedRole] })}>
                重置
              </Button>
              <Button variant="primary" leftIcon={<Check className="w-4 h-4" />}>
                保存配置
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
