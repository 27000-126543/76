import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Bell,
  ChevronDown,
  MapPin,
  Clock,
  LogOut,
  User,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { UserRole } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';

export interface AreaOption {
  value: string;
  label: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  read?: boolean;
}

export interface HeaderProps {
  areas?: AreaOption[];
  currentArea?: string;
  onAreaChange?: (area: string) => void;
  notifications?: NotificationItem[];
  onNotificationClick?: (notification: NotificationItem) => void;
  className?: string;
}

const roleLabels: Record<UserRole, string> = {
  picker: '拣货员',
  leader: '组长',
  manager: '经理',
  director: '总监',
};

const defaultAreas: AreaOption[] = [
  { value: 'A', label: 'A区 - 高周转区' },
  { value: 'B', label: 'B区 - 中周转区' },
  { value: 'C', label: 'C区 - 低周转区' },
  { value: 'ALL', label: '全部区域' },
];

export function Header({
  areas = defaultAreas,
  currentArea = 'ALL',
  onAreaChange,
  notifications = [],
  onNotificationClick,
  className,
}: HeaderProps) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAreaSelector, setShowAreaSelector] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
  };

  const selectedArea = areas.find((a) => a.value === currentArea);

  const notificationTypeColor: Record<NotificationItem['type'], string> = {
    info: 'bg-primary-500',
    warning: 'bg-warning',
    danger: 'bg-danger',
    success: 'bg-success',
  };

  return (
    <header
      className={cn(
        'flex items-center justify-between h-16 px-6 bg-dark-900/60 border-b border-dark-700/50 backdrop-blur-xl',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowAreaSelector(!showAreaSelector);
              setShowNotifications(false);
              setShowUserMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/80 border border-dark-700 hover:border-dark-600 transition-colors"
          >
            <MapPin className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-dark-200 font-medium">
              {selectedArea?.label || '选择区域'}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-dark-400 transition-transform duration-200',
                showAreaSelector && 'rotate-180'
              )}
            />
          </button>

          {showAreaSelector && (
            <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-dark-700 bg-dark-800 shadow-xl py-2 z-50">
              {areas.map((area) => (
                <button
                  key={area.value}
                  onClick={() => {
                    onAreaChange?.(area.value);
                    setShowAreaSelector(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left',
                    currentArea === area.value
                      ? 'bg-primary-500/15 text-primary-400'
                      : 'text-dark-200 hover:bg-dark-700/50'
                  )}
                >
                  <MapPin className="w-4 h-4" />
                  {area.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800/50 border border-dark-700/50">
          <Clock className="w-4 h-4 text-accent-500" />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-mono text-white font-semibold tracking-wider">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-dark-400">
              {formatDate(currentTime)}
            </span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowAreaSelector(false);
              setShowUserMenu(false);
            }}
            className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-dark-800/80 border border-dark-700 hover:border-dark-600 transition-colors"
          >
            <Bell className="w-5 h-5 text-dark-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-dark-700 bg-dark-800 shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-dark-700 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  消息通知
                </span>
                {unreadCount > 0 && (
                  <span className="text-xs text-primary-400 cursor-pointer hover:text-primary-300">
                    全部已读
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Bell className="w-8 h-8 text-dark-600 mx-auto mb-2" />
                    <p className="text-sm text-dark-500">暂无消息</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => onNotificationClick?.(notification)}
                      className={cn(
                        'w-full flex gap-3 px-4 py-3 text-left border-b border-dark-700/50 last:border-0 transition-colors hover:bg-dark-700/30',
                        !notification.read && 'bg-dark-700/20'
                      )}
                    >
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                          notificationTypeColor[notification.type]
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowAreaSelector(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-lg bg-dark-800/80 border border-dark-700 hover:border-dark-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm text-white font-medium">
                {user?.name || '未登录'}
              </span>
              {user && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-dark-400 font-mono">
                    {user.employeeNo}
                  </span>
                  <span className="text-xs text-dark-600">·</span>
                  <span className="text-xs text-primary-400">
                    {roleLabels[user.role]}
                  </span>
                  <StatusBadge
                    status={
                      user.status === 'on'
                        ? 'running'
                        : user.status === 'break'
                        ? 'idle'
                        : 'pending'
                    }
                    size="sm"
                  />
                </div>
              )}
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-dark-400 transition-transform duration-200 hidden sm:block',
                showUserMenu && 'rotate-180'
              )}
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-dark-700 bg-dark-800 shadow-xl py-2 z-50">
              <div className="px-4 py-3 border-b border-dark-700">
                <p className="text-sm font-semibold text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-dark-400 mt-0.5">
                  {user?.employeeNo} · {roleLabels[user?.role || 'picker']}
                </p>
              </div>
              <button
                onClick={() => {
                  onUserClick?.();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-200 hover:bg-dark-700/50 transition-colors"
              >
                <User className="w-4 h-4" />
                个人中心
              </button>
              <button
                onClick={() => setShowUserMenu(false)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-200 hover:bg-dark-700/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                账户设置
              </button>
              <div className="border-t border-dark-700 my-1" />
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
