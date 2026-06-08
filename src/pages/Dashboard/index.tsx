import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Zap,
  Cpu,
  Clock,
  Layers,
  Users,
  AlertTriangle,
  ChevronDown,
  RefreshCw,
  MapPin,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { LineChart } from '@/components/Charts/LineChart';
import { GaugeChart } from '@/components/Charts/GaugeChart';
import { PieChart } from '@/components/Charts/PieChart';
import { BarChart } from '@/components/Charts/BarChart';
import { useCountUp } from '@/hooks/useCountUp';
import { useDashboardStore } from '@/store/useDashboardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';
import type { Region } from '@/types';

function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1000,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const displayValue = useCountUp(value, { decimals, duration });
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      prevValue.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span
      className={cn(
        'inline-block transition-all',
        isAnimating && 'animate-count-up',
        className
      )}
    >
      {decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString()}
    </span>
  );
}

function PulseCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const [pulseKey, setPulseKey] = useState(0);
  const metrics = useDashboardStore((s) => s.metrics);

  useEffect(() => {
    setPulseKey((k) => k + 1);
  }, [metrics]);

  return (
    <motion.div
      key={pulseKey}
      initial={{ boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(59, 130, 246, 0)',
          '0 0 0 4px rgba(59, 130, 246, 0.15)',
          '0 0 0 0 rgba(59, 130, 246, 0)',
        ],
      }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { metrics, loading, region, regionOptions, setRegion, startRealTimeUpdate, fetchMetrics } =
    useDashboardStore();
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    const cleanup = startRealTimeUpdate();
    return cleanup;
  }, [isAuthenticated, navigate, startRealTimeUpdate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMetrics();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleRegionChange = (r: Region) => {
    setRegion(r);
    setRegionDropdownOpen(false);
  };

  const todayOrdersCount = useCountUp(metrics.todayOrders);
  const orderGrowth =
    metrics.yesterdayOrders > 0
      ? Math.round(((metrics.todayOrders - metrics.yesterdayOrders) / metrics.yesterdayOrders) * 100)
      : 0;

  const currentRegionLabel = regionOptions.find((o) => o.value === region)?.label || '';

  if (!isAuthenticated || !user) return null;

  return (
    <div className="relative min-h-screen w-full">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-dark-950/80 border-b border-dark-700/50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-xl font-bold text-white">数据大屏</h1>
                <p className="text-xs text-dark-400 mt-0.5">
                  {user.name} · {user.employeeNo} · 实时监控中
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30">
                <Activity className="w-3.5 h-3.5 text-success animate-breathe" />
                <span className="text-xs font-medium text-success">实时同步</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setRegionDropdownOpen((s) => !s)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800/80 border border-dark-600 hover:border-dark-500 transition-all text-sm"
                >
                  <MapPin className="w-4 h-4 text-primary-400" />
                  <span className="text-white font-medium">{currentRegionLabel}</span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-dark-400 transition-transform',
                      regionDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                <AnimatePresence>
                  {regionDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-40 py-1 rounded-lg bg-dark-800 border border-dark-600 shadow-xl z-50"
                    >
                      {regionOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleRegionChange(opt.value)}
                          className={cn(
                            'w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors',
                            region === opt.value
                              ? 'text-primary-400 bg-primary-500/10'
                              : 'text-dark-200 hover:bg-dark-700/50'
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800/80 border border-dark-600 hover:border-dark-500 transition-all text-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={cn('w-4 h-4 text-dark-300', refreshing && 'animate-spin')}
                />
                <span className="text-dark-200">刷新</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <PulseCard>
            <StatCard
              title="今日订单量"
              value={<AnimatedNumber value={metrics.todayOrders} />}
              unit="单"
              icon={ShoppingCart}
              iconColor="text-primary-400"
              trend={orderGrowth}
              trendDirection={orderGrowth >= 0 ? 'up' : 'down'}
              trendLabel="较昨日"
              glowColor="rgba(59, 130, 246, 0.4)"
              className="h-full"
            />
          </PulseCard>

          <PulseCard>
            <StatCard
              title="分拣效率"
              value={<AnimatedNumber value={metrics.sortingEfficiency} decimals={1} />}
              unit="%"
              icon={Zap}
              iconColor="text-accent-500"
              trend={2.4}
              trendDirection="up"
              trendLabel="较昨日"
              glowColor="rgba(249, 115, 22, 0.4)"
              className="h-full"
            />
          </PulseCard>

          <PulseCard>
            <StatCard
              title="设备完好率"
              value={<AnimatedNumber value={metrics.equipmentHealthRate} decimals={1} />}
              unit="%"
              icon={Cpu}
              iconColor="text-success"
              trend={0.8}
              trendDirection="up"
              trendLabel="较昨日"
              glowColor="rgba(16, 185, 129, 0.4)"
              className="h-full"
            />
          </PulseCard>

          <PulseCard>
            <StatCard
              title="订单及时率"
              value={<AnimatedNumber value={metrics.orderOnTimeRate} decimals={1} />}
              unit="%"
              icon={Clock}
              iconColor="text-warning"
              trend={1.2}
              trendDirection="up"
              trendLabel="较昨日"
              glowColor="rgba(245, 158, 11, 0.4)"
              className="h-full"
            />
          </PulseCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <PulseCard className="lg:col-span-5">
            <div className="tech-card p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">分拣效率趋势</h3>
                  <p className="text-xs text-dark-400 mt-0.5">24小时分拣效率变化</p>
                </div>
              </div>
              <LineChart
                xAxisData={metrics.sortingEfficiencyTrendHours}
                series={[
                  {
                    name: '分拣效率',
                    data: metrics.sortingEfficiencyTrend,
                    color: '#3B82F6',
                    smooth: true,
                    areaStyle: true,
                  },
                ]}
                height={280}
                showLegend={false}
                yAxisName="效率(%)"
                yAxisFormatter={(value) => `${value}%`}
              />
            </div>
          </PulseCard>

          <PulseCard className="lg:col-span-3">
            <div className="tech-card p-5 h-full flex flex-col">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-white">设备完好率</h3>
                <p className="text-xs text-dark-400 mt-0.5">当前设备运行状态</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <GaugeChart
                  value={metrics.equipmentHealthRate}
                  max={100}
                  min={0}
                  height={260}
                  color={
                    metrics.equipmentHealthRate >= 95
                      ? '#10B981'
                      : metrics.equipmentHealthRate >= 85
                        ? '#F59E0B'
                        : '#EF4444'
                  }
                  centerTitle="完好率"
                  centerValue={metrics.equipmentHealthRate.toFixed(1)}
                  centerSubtitle="%"
                  splitNumber={5}
                />
              </div>
            </div>
          </PulseCard>

          <PulseCard className="lg:col-span-4">
            <div className="tech-card p-5 h-full flex flex-col">
              <div className="mb-2">
                <h3 className="text-base font-semibold text-white">订单及时率</h3>
                <p className="text-xs text-dark-400 mt-0.5">准时/延迟订单分布</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <PieChart
                  data={metrics.orderOnTimeBreakdown.map((item) => ({
                    ...item,
                    color: item.name === '准时' ? '#10B981' : '#EF4444',
                  }))}
                  height={260}
                  showLegend={true}
                  legendPosition="bottom"
                  centerTitle="及时率"
                  centerValue={metrics.orderOnTimeRate.toFixed(1)}
                  centerSubtitle="%"
                />
              </div>
            </div>
          </PulseCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <PulseCard className="lg:col-span-5">
            <div className="tech-card p-5 h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-semibold text-white">运营概览</h3>
                  <p className="text-xs text-dark-400 mt-0.5">关键运营指标</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50 p-5 text-center"
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-primary-500/10 blur-2xl" />
                  <div className="relative">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      <AnimatedNumber value={metrics.waveInProgress} />
                    </div>
                    <p className="text-xs text-dark-400 mt-1">进行中波次</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50 p-5 text-center"
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-success/10 blur-2xl" />
                  <div className="relative">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-success/10 border border-success/20 flex items-center justify-center mb-3">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      <AnimatedNumber value={metrics.activeEmployees} />
                    </div>
                    <p className="text-xs text-dark-400 mt-1">在岗员工</p>
                    <p className="text-[10px] text-dark-500 mt-0.5">人</p>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="relative overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50 p-5 text-center"
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-danger/10 blur-2xl" />
                  <div className="relative">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center mb-3">
                      <AlertTriangle className="w-5 h-5 text-danger" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      <AnimatedNumber value={metrics.pendingExceptions} />
                    </div>
                    <p className="text-xs text-dark-400 mt-1">待处理异常</p>
                    <p className="text-[10px] text-dark-500 mt-0.5">单</p>
                  </div>
                </motion.div>
              </div>

              <div className="mt-5 pt-5 border-t border-dark-700/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-400">今日订单</span>
                    <span className="text-sm font-semibold text-white">
                      {todayOrdersCount.toLocaleString()} 单
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-400">昨日订单</span>
                    <span className="text-sm font-semibold text-dark-200">
                      {metrics.yesterdayOrders.toLocaleString()} 单
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </PulseCard>

          <PulseCard className="lg:col-span-7">
            <div className="tech-card p-5 h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">实时分拣线吞吐量</h3>
                  <p className="text-xs text-dark-400 mt-0.5">各分拣线每小时处理量</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-dark-400">
                  <span className="w-2 h-2 rounded-full bg-success animate-breathe" />
                  实时更新
                </div>
              </div>
              <BarChart
                xAxisData={metrics.sortingLineThroughput.map((l) => l.lineName)}
                series={[
                  {
                    name: '吞吐量',
                    data: metrics.sortingLineThroughput.map((l) => l.throughput),
                    color: '#F97316',
                  },
                ]}
                height={280}
                showLegend={false}
                yAxisName="件/小时"
                labelFormatter={(params) => params.value}
              />
            </div>
          </PulseCard>
        </div>
      </div>
    </div>
  );
}
