import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Thermometer,
  Gauge,
  Zap,
  Settings as SettingsIcon,
  Wrench,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { usePermission } from '@/hooks/usePermission';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import type { Equipment, EquipmentType, EquipmentStatus } from '@/types';

const equipmentTypeMap: Record<EquipmentType, { label: string; color: string }> = {
  conveyor: { label: '传送带', color: 'text-primary-500 bg-primary-500/10 border-primary-500/30' },
  sorter: { label: '分拣机', color: 'text-accent-500 bg-accent-500/10 border-accent-500/30' },
  scanner: { label: '扫码枪', color: 'text-success bg-success/10 border-success/30' },
  scale: { label: '称重设备', color: 'text-warning bg-warning/10 border-warning/30' },
};

const equipmentStatusMap: Record<EquipmentStatus, 'running' | 'idle' | 'fault' | 'pending'> = {
  running: 'running',
  idle: 'idle',
  fault: 'fault',
  maintenance: 'pending',
};

function EquipmentCard({ equipment, onClick }: { equipment: Equipment; onClick: () => void }) {
  const typeInfo = equipmentTypeMap[equipment.type];
  const isRunning = equipment.status === 'running';
  const isFault = equipment.status === 'fault';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border border-dark-700 bg-dark-800/50 p-5 cursor-pointer transition-all duration-300',
        'hover:border-dark-600 hover:bg-dark-800 hover:shadow-lg',
        isFault && 'border-danger/40 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]'
      )}
    >
      {isRunning && (
        <div className="absolute inset-0 rounded-xl bg-success/5 animate-breathe pointer-events-none" />
      )}
      {isFault && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-danger" />
          </span>
        </div>
      )}

      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center', typeInfo.color)}>
            {equipment.type === 'conveyor' && <Gauge className="w-5 h-5" />}
            {equipment.type === 'sorter' && <SettingsIcon className="w-5 h-5 animate-spin-slow" />}
            {equipment.type === 'scanner' && <Activity className="w-5 h-5" />}
            {equipment.type === 'scale' && <Wrench className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">{equipment.name}</h3>
            <p className="text-xs text-dark-400 font-mono">{equipment.equipmentNo}</p>
          </div>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', typeInfo.color)}>
          {typeInfo.label}
        </span>
      </div>

      <div className="relative flex items-center justify-between mb-4">
        <span className="text-sm text-dark-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-dark-500 mr-1.5" />
          {equipment.area}
        </span>
        <StatusBadge
          status={equipmentStatusMap[equipment.status]}
          pulse={isRunning}
        />
      </div>

      <div className="relative border-t border-dark-700/50 pt-4">
        <p className="text-xs text-dark-500 mb-2">运行参数</p>
        <div className="grid grid-cols-2 gap-3">
          {equipment.params.temperature !== undefined && (
            <div className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-danger" />
              <span className="text-xs text-dark-300">{equipment.params.temperature}°C</span>
            </div>
          )}
          {equipment.params.speed !== undefined && (
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs text-dark-300">{equipment.params.speed} m/s</span>
            </div>
          )}
          {equipment.params.voltage !== undefined && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs text-dark-300">{equipment.params.voltage} V</span>
            </div>
          )}
          {equipment.params.throughput !== undefined && (
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-success" />
              <span className="text-xs text-dark-300">{equipment.params.throughput} 件/h</span>
            </div>
          )}
          {equipment.params.vibration !== undefined && (
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent-500" />
              <span className="text-xs text-dark-300">{equipment.params.vibration} mm/s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EquipmentIndex() {
  const navigate = useNavigate();
  const { canAccess } = usePermission();
  const { equipment, loading, fetchEquipment, fetchMaintenanceOrders } = useEquipmentStore();
  const [selectedType, setSelectedType] = useState<EquipmentType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | 'all'>('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (canAccess('leader')) {
      fetchEquipment();
      fetchMaintenanceOrders();
    }
  }, [canAccess, fetchEquipment, fetchMaintenanceOrders]);

  const filteredEquipment = equipment.filter((eq) => {
    const matchType = selectedType === 'all' || eq.type === selectedType;
    const matchStatus = selectedStatus === 'all' || eq.status === selectedStatus;
    const matchSearch = !searchText || eq.name.includes(searchText) || eq.equipmentNo.includes(searchText);
    return matchType && matchStatus && matchSearch;
  });

  const runningCount = equipment.filter((e) => e.status === 'running').length;
  const idleCount = equipment.filter((e) => e.status === 'idle').length;
  const faultCount = equipment.filter((e) => e.status === 'fault').length;
  const maintenanceCount = equipment.filter((e) => e.status === 'maintenance').length;

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
          <h1 className="text-2xl font-bold text-white">设备总览</h1>
          <p className="text-sm text-dark-400 mt-1">实时监控所有仓储设备运行状态</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/equipment/maintenance')} rightIcon={<ArrowRight className="w-4 h-4" />}>
          维修工单
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="运行中"
          value={runningCount}
          unit="台"
          icon={Activity}
          iconColor="text-success bg-success/10"
          glowColor="#10B981"
        />
        <StatCard
          title="空闲"
          value={idleCount}
          unit="台"
          icon={Gauge}
          iconColor="text-dark-400 bg-dark-500/10"
        />
        <StatCard
          title="故障"
          value={faultCount}
          unit="台"
          icon={Wrench}
          iconColor="text-danger bg-danger/10"
          glowColor={faultCount > 0 ? '#EF4444' : undefined}
        />
        <StatCard
          title="维护中"
          value={maintenanceCount}
          unit="台"
          icon={SettingsIcon}
          iconColor="text-warning bg-warning/10"
        />
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-800/30 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              type="text"
              placeholder="搜索设备名称或编号..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-dark-700/50 border border-dark-600 text-white placeholder:text-dark-500 text-sm focus:outline-none focus:border-primary-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as EquipmentType | 'all')}
              className="h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-dark-200 text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="all">全部类型</option>
              <option value="conveyor">传送带</option>
              <option value="sorter">分拣机</option>
              <option value="scanner">扫码枪</option>
              <option value="scale">称重设备</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as EquipmentStatus | 'all')}
              className="h-10 px-3 rounded-lg bg-dark-700/50 border border-dark-600 text-dark-200 text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="all">全部状态</option>
              <option value="running">运行中</option>
              <option value="idle">空闲</option>
              <option value="fault">故障</option>
              <option value="maintenance">维护中</option>
            </select>

            <Button variant="ghost" size="icon" onClick={() => fetchEquipment()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEquipment.map((eq) => (
            <EquipmentCard key={eq.id} equipment={eq} onClick={() => {}} />
          ))}
        </div>
      )}

      {!loading && filteredEquipment.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-dark-700/50 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-dark-500" />
          </div>
          <p className="text-dark-400">没有找到匹配的设备</p>
        </div>
      )}
    </div>
  );
}
