import { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Trophy,
  TrendingUp,
  Package,
  Wrench,
  Target,
  Gauge,
} from 'lucide-react';
import { useReportStore } from '@/store/useReportStore';
import { usePermission } from '@/hooks/usePermission';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LineChart } from '@/components/Charts/LineChart';
import { BarChart } from '@/components/Charts/BarChart';
import { GaugeChart } from '@/components/Charts/GaugeChart';
import { cn } from '@/lib/utils';
import { exportToExcel } from '@/utils/export';
import type { EmployeePerformance } from '@/types';

const areas = ['全场', 'A区', 'B区', 'C区', 'D区'];

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

function RankBadge({ rank }: { rank: number }) {
  const gradients: Record<number, string> = {
    1: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    2: 'bg-gradient-to-br from-gray-300 to-gray-500',
    3: 'bg-gradient-to-br from-amber-600 to-amber-800',
  };
  const gradient = gradients[rank] || 'bg-dark-600';
  return (
    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow', gradient)}>
      {rank}
    </div>
  );
}

export default function ReportsIndex() {
  const { canAccess } = usePermission();
  const { report, loading, fetchReport } = useReportStore();
  const [selectedArea, setSelectedArea] = useState('全场');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (canAccess('manager')) {
      fetchReport(selectedMonth, selectedArea);
    }
  }, [canAccess, fetchReport, selectedMonth, selectedArea]);

  const handleExport = async () => {
    if (!report) return;
    setExporting(true);

    const topEmployeesData = report.topEmployees.map((e) => ({
      排名: e.ranking,
      姓名: e.userName,
      工号: e.employeeNo,
      角色: e.role,
      拣货数量: e.pickingCount,
      分拣数量: e.sortingCount,
      准确率: `${e.accuracy}%`,
      工时: `${e.workHours}h`,
      效率得分: e.efficiencyScore,
    }));

    const dailyData = report.dailyTrend.map((d) => ({
      日期: d.date,
      订单量: d.orders,
      效率: `${d.efficiency}%`,
      准时率: `${d.onTimeRate}%`,
    }));

    exportToExcel(topEmployeesData, `${selectedMonth}_Top员工绩效榜`, [
      { key: '排名', title: '排名' },
      { key: '姓名', title: '姓名' },
      { key: '工号', title: '工号' },
      { key: '角色', title: '角色' },
      { key: '拣货数量', title: '拣货数量' },
      { key: '分拣数量', title: '分拣数量' },
      { key: '准确率', title: '准确率' },
      { key: '工时', title: '工时' },
      { key: '效率得分', title: '效率得分' },
    ]);

    setTimeout(() => {
      exportToExcel(dailyData, `${selectedMonth}_每日运营数据`, [
        { key: '日期', title: '日期' },
        { key: '订单量', title: '订单量' },
        { key: '效率', title: '效率' },
        { key: '准时率', title: '准时率' },
      ]);
      setExporting(false);
    }, 500);
  };

  if (!canAccess('manager')) {
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">运营报告</h1>
          <p className="text-sm text-dark-400 mt-1">多维度数据分析，洞察仓储运营效率</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-500" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-dark-200 text-sm focus:outline-none focus:border-primary-500/50"
            >
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-dark-200 text-sm focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <Button
            variant="primary"
            loading={exporting}
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExport}
          >
            导出Excel
          </Button>
        </div>
      </div>

      {loading && !report ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="月度总订单"
              value={report.totalOrders.toLocaleString()}
              icon={Package}
              iconColor="text-primary-500 bg-primary-500/10"
              glowColor="#3B82F6"
            />
            <StatCard
              title="订单准时率"
              value={`${report.onTimeRate}%`}
              icon={Target}
              iconColor="text-success bg-success/10"
              glowColor="#10B981"
            />
            <StatCard
              title="分拣效率"
              value={`${report.sortingEfficiency}%`}
              icon={TrendingUp}
              iconColor="text-accent-500 bg-accent-500/10"
              glowColor="#F97316"
            />
            <StatCard
              title="设备健康率"
              value={`${report.equipmentHealthRate}%`}
              icon={Wrench}
              iconColor="text-warning bg-warning/10"
              glowColor="#F59E0B"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-dark-700 bg-dark-800/30 p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                订单趋势与效率
              </h2>
              <LineChart
                xAxisData={report.dailyTrend.map((d) => d.date.slice(5))}
                series={[
                  { name: '订单量', data: report.dailyTrend.map((d) => d.orders), smooth: true, areaStyle: true, color: '#3B82F6' },
                  { name: '效率(%)', data: report.dailyTrend.map((d) => d.efficiency * 100), smooth: true, color: '#10B981' },
                ]}
                height={300}
                yAxisFormatter={(v) => `${v}`}
              />
            </div>

            <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-success" />
                关键指标
              </h2>
              <div className="space-y-6">
                <div>
                  <GaugeChart
                    value={report.onTimeRate}
                    min={0}
                    max={100}
                    height={160}
                    centerTitle="准时率"
                    centerValue={report.onTimeRate}
                    centerSubtitle="%"
                    color="#10B981"
                  />
                </div>
                <div>
                  <GaugeChart
                    value={report.equipmentHealthRate}
                    min={0}
                    max={100}
                    height={160}
                    centerTitle="设备健康"
                    centerValue={report.equipmentHealthRate}
                    centerSubtitle="%"
                    color="#F59E0B"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-dark-700 bg-dark-800/30 p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-500" />
                每日效率分析
              </h2>
              <BarChart
                xAxisData={report.dailyTrend.slice(-15).map((d) => d.date.slice(5))}
                series={[
                  { name: '效率(%)', data: report.dailyTrend.slice(-15).map((d) => d.efficiency), color: '#F97316' },
                  { name: '准时率(%)', data: report.dailyTrend.slice(-15).map((d) => d.onTimeRate), color: '#10B981' },
                ]}
                height={280}
              />
            </div>

            <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Top10 员工榜单
              </h2>
              {report.topEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-dark-500">
                  <Trophy className="w-10 h-10 opacity-50" />
                  <span className="text-sm">暂无数据</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {report.topEmployees.map((emp: EmployeePerformance) => (
                    <div
                      key={emp.userId}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200',
                        'hover:bg-dark-700/40'
                      )}
                    >
                      <RankBadge rank={emp.ranking || 0} />
                      <UserAvatar name={emp.userName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{emp.userName}</p>
                        <p className="text-xs text-dark-500">{emp.employeeNo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-primary-400">{emp.efficiencyScore}</p>
                        <p className="text-xs text-dark-500">效率分</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
