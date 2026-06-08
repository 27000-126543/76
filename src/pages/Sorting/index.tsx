import { useEffect, useState } from 'react';
import { Box, Package, AlertTriangle, TrendingUp, Activity, Layers } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { StatCard } from '@/components/common/StatCard';
import { StatusBadge, type StatusType } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/date';
import type { ExceptionOrder, ExceptionType, ExceptionStatus } from '@/types';

const exceptionTypeLabels: Record<ExceptionType, string> = {
  package_drop: '包裹掉落',
  label_unclear: '标签模糊',
  wrong_sort: '错分拣',
  damage: '包裹破损',
};

const mockExceptions: ExceptionOrder[] = [
  {
    id: 'ex1',
    exceptionNo: 'EXC20240608001',
    type: 'package_drop',
    orderId: 'o1',
    orderNo: 'ORD20240608001',
    description: '包裹在分拣过程中掉落',
    photos: [],
    status: 'pending',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'ex2',
    exceptionNo: 'EXC20240608002',
    type: 'label_unclear',
    orderId: 'o2',
    orderNo: 'ORD20240608002',
    description: '标签模糊无法识别',
    photos: [],
    handlerId: 'u2',
    handlerName: '李四',
    status: 'processing',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ex3',
    exceptionNo: 'EXC20240608003',
    type: 'wrong_sort',
    orderId: 'o3',
    orderNo: 'ORD20240608003',
    description: '包裹被错误分拣到其他道口',
    photos: [],
    handlerId: 'u2',
    handlerName: '李四',
    status: 'resolved',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    resolvedAt: new Date(Date.now() - 5400000).toISOString(),
    resolution: '已重新分拣到正确道口',
  },
  {
    id: 'ex4',
    exceptionNo: 'EXC20240608004',
    type: 'damage',
    orderId: 'o4',
    orderNo: 'ORD20240608004',
    description: '包裹外包装有明显破损',
    photos: [],
    status: 'pending',
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
];

function exceptionStatusToBadge(status: ExceptionStatus): StatusType {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'processing':
      return 'processing';
    case 'resolved':
      return 'success';
    default:
      return 'pending';
  }
}

export default function SortingPage() {
  const { canAccess } = usePermission();
  const { sortingStations, loading, fetchEquipment } = useEquipmentStore();
  const [flowParticles, setFlowParticles] = useState<number[]>([]);

  useEffect(() => {
    if (canAccess('leader')) {
      fetchEquipment();
    }
  }, [canAccess, fetchEquipment]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFlowParticles((prev) => {
        const newParticles = [...prev, Date.now()];
        if (newParticles.length > 8) newParticles.shift();
        return newParticles;
      });
    }, 600);
    return () => clearInterval(interval);
  }, []);

  if (!canAccess('leader')) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">权限不足</h2>
          <p className="text-dark-400">您没有权限访问该页面</p>
        </div>
      </div>
    );
  }

  const runningCount = sortingStations.filter((s) => s.status === 'running').length;
  const totalThroughput = sortingStations.reduce((sum, s) => sum + s.throughput, 0);
  const todayTotal = sortingStations.reduce((sum, s) => sum + s.todayCount, 0);
  const pendingExceptions = mockExceptions.filter((e) => e.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-primary-500" />
            智能分拣监控
          </h1>
          <p className="text-dark-400 mt-1">实时监控分拣线运行状态与异常告警</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="运行中分拣口"
          value={`${runningCount}/${sortingStations.length || 12}`}
          icon={Activity}
          iconColor="text-primary-500"
          glowColor="#3B82F6"
        />
        <StatCard
          title="实时吞吐量"
          value={totalThroughput}
          unit="件/小时"
          icon={TrendingUp}
          iconColor="text-success"
          glowColor="#10B981"
          trend={12}
          trendDirection="up"
          trendLabel="较上小时"
        />
        <StatCard
          title="今日分拣总量"
          value={todayTotal.toLocaleString()}
          unit="件"
          icon={Package}
          iconColor="text-accent-500"
          glowColor="#F97316"
        />
        <StatCard
          title="待处理异常"
          value={pendingExceptions}
          unit="条"
          icon={AlertTriangle}
          iconColor="text-danger"
          glowColor="#EF4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-dark-700 bg-dark-800/30 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-primary-500" />
              分拣线实时状态
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-dark-400">数据流实时更新</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              <div className="relative mb-6 p-4 rounded-lg bg-dark-900/50 border border-dark-700 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                  {flowParticles.map((id, i) => (
                    <div
                      key={id}
                      className={cn(
                        'absolute w-2 h-2 rounded-full bg-primary-500',
                        'animate-[flow_2s_linear_forwards] opacity-80'
                      )}
                      style={{
                        top: `${15 + (i % 4) * 22}%`,
                        left: '-10px',
                        animationDelay: `${i * 0.1}s`,
                        boxShadow: '0 0 10px #3B82F6',
                      }}
                    />
                  ))}
                </div>
                <div className="relative z-10 flex items-center justify-between px-8 py-3">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg bg-primary-600/20 border border-primary-500/50 flex items-center justify-center">
                      <Package className="w-5 h-5 text-primary-500" />
                    </div>
                    <span className="text-xs text-dark-400">入口</span>
                  </div>
                  <div className="flex-1 mx-4 h-1 bg-dark-700 rounded-full relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-success rounded-full w-3/4 animate-pulse" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg bg-success/20 border border-success/50 flex items-center justify-center">
                      <Box className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-xs text-dark-400">分拣完成</span>
                  </div>
                </div>
                <style>{`
                  @keyframes flow {
                    0% { transform: translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateX(calc(100vw - 80px)); opacity: 0; }
                  }
                `}</style>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sortingStations.map((station) => (
                  <div
                    key={station.id}
                    className={cn(
                      'relative rounded-lg border p-4 transition-all duration-300',
                      'bg-dark-800/50 hover:bg-dark-800',
                      station.status === 'running' && 'border-primary-500/50 hover:border-primary-500',
                      station.status === 'idle' && 'border-dark-600',
                      station.status === 'fault' && 'border-danger/50 hover:border-danger'
                    )}
                  >
                    {station.status === 'running' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_#10B981]" />
                    )}
                    {station.status === 'fault' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-danger animate-pulse shadow-[0_0_8px_#EF4444]" />
                    )}
                    {station.status === 'idle' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-dark-500" />
                    )}

                    <div className="text-lg font-bold text-white mb-1">{station.stationNo}</div>
                    <div className="text-sm text-dark-400 mb-3">{station.destination}</div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-500">吞吐量</span>
                        <span className="text-dark-200 font-medium">{station.throughput} 件/时</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-dark-500">今日</span>
                        <span className="text-white font-medium">{station.todayCount.toLocaleString()} 件</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <StatusBadge
                        status={station.status}
                        size="sm"
                        pulse={station.status === 'running'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger" />
              异常告警
            </h2>
            <span className="text-xs px-2 py-1 rounded-md bg-danger/10 text-danger border border-danger/30">
              {pendingExceptions} 条待处理
            </span>
          </div>

          <div className="space-y-3">
            {mockExceptions.map((ex) => (
              <div
                key={ex.id}
                className="rounded-lg border border-dark-700 bg-dark-800/50 p-4 hover:bg-dark-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {exceptionTypeLabels[ex.type]}
                    </div>
                    <div className="text-xs text-dark-500 mt-0.5">{ex.exceptionNo}</div>
                  </div>
                  <StatusBadge status={exceptionStatusToBadge(ex.status)} size="sm" pulse={ex.status === 'processing'} />
                </div>
                <p className="text-xs text-dark-400 mb-2 line-clamp-2">{ex.description}</p>
                <div className="flex items-center justify-between text-xs text-dark-500">
                  <span>订单: {ex.orderNo}</span>
                  <span>{formatDateTime(ex.createdAt)}</span>
                </div>
                {ex.handlerName && (
                  <div className="text-xs text-dark-500 mt-1">处理人: {ex.handlerName}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
