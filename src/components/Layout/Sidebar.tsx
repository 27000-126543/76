import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  type LucideIcon,
  Package,
  ClipboardList,
  Warehouse,
  BarChart3,
  Users,
  Settings,
  AlertTriangle,
  Wrench,
  LayoutDashboard,
  Truck,
  ShieldCheck,
  FileUp,
  Trophy,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface MenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  path?: string;
  roles?: UserRole[];
  children?: MenuItem[];
  badge?: number | string;
  badgeColor?: 'primary' | 'danger' | 'warning' | 'success';
}

export interface SidebarProps {
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  menuItems?: MenuItem[];
  className?: string;
  logo?: ReactNode;
  logoText?: string;
}

const defaultMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    label: '数据看板',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['picker', 'leader', 'manager', 'director'],
  },
  {
    key: 'picking',
    label: '拣货任务',
    icon: Truck,
    path: '/orders/tasks',
    roles: ['picker', 'leader', 'manager', 'director'],
  },
  {
    key: 'exceptions',
    label: '异常处理',
    icon: AlertTriangle,
    path: '/sorting/exceptions',
    roles: ['picker', 'leader', 'manager', 'director'],
    badge: 3,
    badgeColor: 'danger',
  },
  {
    key: 'orders',
    label: '订单管理',
    icon: ClipboardList,
    path: '/orders',
    roles: ['leader', 'manager', 'director'],
    badge: 12,
    badgeColor: 'primary',
  },
  {
    key: 'waves',
    label: '波次调度',
    icon: Package,
    path: '/orders?tab=waves',
    roles: ['leader', 'manager', 'director'],
  },
  {
    key: 'sorting',
    label: '分拣中心',
    icon: Warehouse,
    path: '/sorting',
    roles: ['leader', 'manager', 'director'],
  },
  {
    key: 'inventory',
    label: '库存监控',
    icon: Package,
    path: '/inventory',
    roles: ['leader', 'manager', 'director'],
  },
  {
    key: 'replenish',
    label: '补货审批',
    icon: ShieldCheck,
    path: '/inventory/replenish',
    roles: ['leader', 'manager', 'director'],
  },
  {
    key: 'putaway',
    label: '上架任务',
    icon: FileUp,
    path: '/inventory/putaway',
    roles: ['picker', 'leader', 'manager', 'director'],
  },
  {
    key: 'equipment',
    label: '设备监控',
    icon: Wrench,
    roles: ['leader', 'manager', 'director'],
    children: [
      { key: 'equipment-overview', label: '设备总览', path: '/equipment', roles: ['leader', 'manager', 'director'] },
      { key: 'equipment-maintenance', label: '维修工单', path: '/equipment/maintenance', roles: ['manager', 'director'] },
    ],
  },
  {
    key: 'employees',
    label: '人员管理',
    icon: Users,
    roles: ['leader', 'manager', 'director'],
    children: [
      { key: 'employees-list', label: '员工管理', path: '/employees', roles: ['leader', 'manager', 'director'] },
    ],
  },
  {
    key: 'performance',
    label: '绩效考核',
    icon: Trophy,
    path: '/employees/performance',
    roles: ['picker', 'leader', 'manager', 'director'],
  },
  {
    key: 'reports',
    label: '运营报告',
    icon: BarChart3,
    path: '/reports',
    roles: ['manager', 'director'],
  },
  {
    key: 'settings',
    label: '系统设置',
    icon: Settings,
    path: '/settings',
    roles: ['director'],
  },
];

const badgeColorClass: Record<string, string> = {
  primary: 'bg-primary-500 text-white',
  danger: 'bg-danger text-white',
  warning: 'bg-warning text-dark-900',
  success: 'bg-success text-white',
};

export function Sidebar({
  collapsed: externalCollapsed,
  onCollapseChange,
  menuItems = defaultMenuItems,
  className,
  logo,
  logoText = '智能仓储',
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const role = user?.role || 'picker';

  const collapsed = externalCollapsed ?? internalCollapsed;

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setInternalCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const filteredMenuItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  const isActivePath = (item: MenuItem): boolean => {
    if (item.path) {
      const basePath = item.path.split('?')[0];
      if (location.pathname === basePath) return true;
      if (item.path.includes('?') && location.pathname + location.search === item.path) return true;
    }
    if (item.children) {
      return item.children.some((child) => {
        if (!child.path) return false;
        const basePath = child.path.split('?')[0];
        return location.pathname === basePath;
      });
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const isVisible = !item.roles || item.roles.includes(role);
    if (!isVisible) return null;

    const isActive = isActivePath(item);
    const isExpanded = expandedKeys.includes(item.key);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.key}>
          <button
            onClick={() => !collapsed && toggleExpand(item.key)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              'text-dark-300 hover:text-white hover:bg-dark-700/50',
              collapsed && 'justify-center',
              isActive && 'text-primary-400',
              level > 0 && 'pl-10'
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0',
                  isActive && 'text-primary-400'
                )}
              />
            )}
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
                      badgeColorClass[item.badgeColor || 'primary']
                    )}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-dark-500 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </>
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="mt-1 space-y-0.5">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    const content = (
      <>
        {Icon && (
          <Icon
            className={cn(
              'w-5 h-5 flex-shrink-0 transition-colors duration-200',
              isActive
                ? 'text-primary-400'
                : 'text-dark-400 group-hover:text-white'
            )}
          />
        )}
        {!collapsed && (
          <>
            <span
              className={cn(
                'transition-colors duration-200',
                isActive ? 'text-white' : 'text-dark-300 group-hover:text-white'
              )}
            >
              {item.label}
            </span>
            {item.badge !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ml-auto',
                  badgeColorClass[item.badgeColor || 'primary']
                )}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </>
    );

    return (
      <NavLink
        key={item.key}
        to={item.path || '#'}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          collapsed && 'justify-center',
          level > 0 && !collapsed && 'pl-10',
          isActive
            ? 'bg-primary-500/15 text-white border border-primary-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]'
            : 'hover:bg-dark-700/50 border border-transparent'
        )}
      >
        {content}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-dark-900/80 border-r border-dark-700/50 backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-64',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-dark-700/50 flex-shrink-0',
          collapsed && 'justify-center px-2'
        )}
      >
        {logo ?? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold bg-gradient-to-r from-white to-dark-300 bg-clip-text text-transparent whitespace-nowrap">
                {logoText}
              </span>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-1">
        {filteredMenuItems.map((item) => renderMenuItem(item))}
      </nav>

      <div className="flex-shrink-0 px-3 py-3 border-t border-dark-700/50">
        <button
          onClick={toggleCollapsed}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>收起菜单</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
