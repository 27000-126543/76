import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Package,
  Target,
  Clock,
  BarChart3,
} from 'lucide-react';
import { useEmployeeStore } from '@/store/useEmployeeStore';
import { usePermission } from '@/hooks/usePermission';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LineChart } from '@/components/Charts/LineChart';
import { cn } from '@/lib/utils';
import { getRoleName } from '@/utils/permission';
import type { EmployeePerformance, UserRole } from '@/types';

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-base' : size === 'xl' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';
  const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EF4444', '#F59E0B', '#06B6D4'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold text-white shadow-lg', sizeClass)}
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 1)}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="relative">
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
          <Trophy className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow">
        <Medal className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow">
        <Award className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-dark-300">
      {rank}
    </div>
  );
}

function PodiumCard({ perf, position }: { perf: EmployeePerformance; position: 1 | 2 | 3 }) {
  const heights = position === 1 ? 'h-32' : position === 2 ? 'h-24' : 'h-20';
  const gradients = position === 1
    ? 'bg-gradient-to-t from-yellow-600/40 to-yellow-400/10 border-yellow-500/40'
    : position === 2
    ? 'bg-gradient-to-t from-gray-500/40 to-gray-400/10 border-gray-400/40'
    : 'bg-gradient-to-t from-amber-700/40 to-amber-600/10 border-amber-600/40';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <UserAvatar name={perf.userName} size="lg" />
        <div className="absolute -bottom-1 -right-1">
          <RankBadge rank={position} />
        </div>
      </div>
      <div className="text-center">
        <p className="font-semibold text-white text-sm">{perf.userName}</p>
        <p className="text-xs text-dark-400">{getRoleName(perf.role as UserRole)}</p>
      </div>
      <div className={cn('w-24 rounded-t-xl border-t border-x flex flex-col items-center justify-end pb-3', heights, gradients)}>
        <p className="text-2xl font-bold text-white">{perf.efficiencyScore}</p>
        <p className="text-xs text-dark-300">效率分</p>
      </div>
    </div>
  );
}

export default function Performance() {
  const navigate = useNavigate();
  const { user } = usePermission();
  const { performances, loading, fetchPerformances } = useEmployeeStore();
  const [selectedUser, setSelectedUser] = useState<EmployeePerformance | null>(null);

  useEffect(() => {
    fetchPerformances();
  }, [fetchPerformances]);

  const sortedPerformances = [...performances].sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  const visiblePerformances = user?.role === 'picker'
    ? sortedPerformances.filter(p => p.userId === user.id)
    : sortedPerformances;

  const top3 = sortedPerformances.slice(0, 3);

  const avgEfficiency = sortedPerformances.length > 0
    ? Math.round(sortedPerformances.reduce((sum, p) => sum + p.efficiencyScore, 0) / sortedPerformances.length * 10) / 10
    : 0;
  const totalPicking = sortedPerformances.reduce((sum, p) => sum + p.pickingCount, 0);
  const totalSorting = sortedPerformances.reduce((sum, p) => sum + p.sortingCount, 0);
  const avgAccuracy = sortedPerformances.length > 0
    ? Math.round(sortedPerformances.reduce((sum, p) => sum + p.accuracy, 0) / sortedPerformances.length * 100) / 100
    : 0;

  const trendDates = sortedPerformances.slice(0, 10).reverse().map(p => p.date.slice(5));
  const trendScores = sortedPerformances.slice(0, 10).reverse().map(p => p.efficiencyScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">绩效考核</h1>
          <p className="text-sm text-dark-400 mt-1">
            {user?.role === 'picker' ? '查看您的个人绩效数据' : '查看全员绩效排名与效率分析'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="平均效率分"
          value={avgEfficiency}
          icon={TrendingUp}
          iconColor="text-primary-500 bg-primary-500/10"
          glowColor="#3B82F6"
        />
        <StatCard
          title="拣货总量"
          value={totalPicking.toLocaleString()}
          icon={Package}
          iconColor="text-success bg-success/10"
        />
        <StatCard
          title="分拣总量"
          value={totalSorting.toLocaleString()}
          icon={Target}
          iconColor="text-accent-500 bg-accent-500/10"
        />
        <StatCard
          title="平均准确率"
          value={`${avgAccuracy}%`}
          icon={BarChart3}
          iconColor="text-warning bg-warning/10"
        />
      </div>

      {user?.role !== 'picker' && (
        <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            绩效排行榜 TOP3
          </h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : top3.length >= 3 ? (
            <div className="flex items-end justify-center gap-8">
              <div className="flex flex-col items-center">
                <PodiumCard perf={top3[1]} position={2} />
              </div>
              <div className="flex flex-col items-center">
                <PodiumCard perf={top3[0]} position={1} />
              </div>
              <div className="flex flex-col items-center">
                <PodiumCard perf={top3[2]} position={3} />
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-dark-700 bg-dark-800/30 p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            效率趋势
          </h2>
          <LineChart
            xAxisData={trendDates}
            series={[{ name: '效率分', data: trendScores, smooth: true, areaStyle: true }]}
            height={260}
            showLegend={false}
            yAxisFormatter={(v) => `${v}`}
          />
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-warning" />
            完整排行
          </h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-2">
              {visiblePerformances.map((perf, idx) => {
                const rank = idx + 1;
                const isSelected = selectedUser?.userId === perf.userId;
                return (
                  <div
                    key={`${perf.userId}-${perf.date}`}
                    onClick={() => setSelectedUser(perf)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
                      isSelected ? 'bg-primary-500/15 border border-primary-500/30' : 'hover:bg-dark-700/50 border border-transparent'
                    )}
                  >
                    <RankBadge rank={rank} />
                    <UserAvatar name={perf.userName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{perf.userName}</p>
                      <p className="text-xs text-dark-500">{perf.employeeNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-white">{perf.efficiencyScore}</p>
                      <p className="text-xs text-dark-500">效率分</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {(selectedUser || (user?.role === 'picker' && visiblePerformances[0])) && (
        <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-6">
          {(() => {
            const perf = selectedUser || visiblePerformances[0];
            return (
              <>
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-dark-700/50">
                  <UserAvatar name={perf.userName} size="xl" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{perf.userName}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-dark-400 font-mono">{perf.employeeNo}</span>
                      <span className="text-sm text-dark-400">{getRoleName(perf.role as UserRole)}</span>
                      <span className="text-sm text-dark-400">{perf.date}</span>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-3xl font-bold text-primary-400">{perf.efficiencyScore}</p>
                    <p className="text-sm text-dark-400">综合效率分</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-lg bg-dark-700/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-primary-500" />
                      <span className="text-xs text-dark-400">拣货数量</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{perf.pickingCount}</p>
                  </div>
                  <div className="rounded-lg bg-dark-700/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-success" />
                      <span className="text-xs text-dark-400">分拣数量</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{perf.sortingCount}</p>
                  </div>
                  <div className="rounded-lg bg-dark-700/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-warning" />
                      <span className="text-xs text-dark-400">准确率</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{perf.accuracy}%</p>
                  </div>
                  <div className="rounded-lg bg-dark-700/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-accent-500" />
                      <span className="text-xs text-dark-400">工时</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{perf.workHours}h</p>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
