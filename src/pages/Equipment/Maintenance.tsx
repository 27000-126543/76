import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  Clock,
  User,
  CheckCircle2,
  PlayCircle,
  PlusCircle,
  type LucideIcon,
} from 'lucide-react';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { usePermission } from '@/hooks/usePermission';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { cn } from '@/lib/utils';
import type { MaintenanceOrder, MaintenanceUrgency, MaintenanceStatus } from '@/types';

const urgencyConfig: Record<MaintenanceUrgency, { label: string; color: string; bgColor: string }> = {
  critical: { label: '紧急', color: 'text-danger', bgColor: 'bg-danger/10 border-danger/30' },
  normal: { label: '普通', color: 'text-warning', bgColor: 'bg-warning/10 border-warning/30' },
  low: { label: '低', color: 'text-primary-500', bgColor: 'bg-primary-500/10 border-primary-500/30' },
};

type StatusBadgeType = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'running' | 'idle' | 'fault' | 'completed' | 'processing';

const statusConfig: Record<MaintenanceStatus, { label: string; type: StatusBadgeType }> = {
  pending: { label: '待接单', type: 'pending' },
  accepted: { label: '已接单', type: 'processing' },
  repairing: { label: '维修中', type: 'processing' },
  completed: { label: '已完成', type: 'completed' },
  escalated: { label: '已升级', type: 'danger' },
};

function isOverOneHour(dateStr: string): boolean {
  const now = Date.now();
  const createdAt = new Date(dateStr).getTime();
  return now - createdAt > 60 * 60 * 1000;
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Maintenance() {
  const navigate = useNavigate();
  const { canAccess } = usePermission();
  const { maintenanceOrders, loading, fetchMaintenanceOrders, acceptMaintenance, completeMaintenance, startMaintenanceEscalationCheck } = useEquipmentStore();
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (canAccess('manager')) {
      fetchMaintenanceOrders();
      const stopCheck = startMaintenanceEscalationCheck();
      return stopCheck;
    }
  }, [canAccess, fetchMaintenanceOrders, startMaintenanceEscalationCheck]);

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    await acceptMaintenance(orderId);
    setActionLoading(null);
  };

  const handleComplete = async (orderId: string) => {
    setActionLoading(orderId);
    await completeMaintenance(orderId);
    setActionLoading(null);
  };

  const openDetail = (order: MaintenanceOrder) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const columns: Column<MaintenanceOrder>[] = [
    {
      key: 'orderNo',
      title: '工单号',
      dataIndex: 'orderNo',
      render: (val, record) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-dark-200">{val}</span>
          {record.status === 'escalated' && (
            <span className="inline-flex items-center gap-1 rounded-md border border-danger/30 bg-danger/10 px-1.5 py-0.5">
              <AlertTriangle className="w-3 h-3 text-danger" />
              <span className="text-[10px] font-medium text-danger">已升级</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'equipmentName',
      title: '设备',
      dataIndex: 'equipmentName',
      render: (val) => <span className="text-dark-200">{val}</span>,
    },
    {
      key: 'urgency',
      title: '紧急程度',
      dataIndex: 'urgency',
      render: (val: MaintenanceUrgency) => {
        const cfg = urgencyConfig[val];
        return (
          <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', cfg.bgColor, cfg.color)}>
            {val === 'critical' && <AlertTriangle className="w-3 h-3" />}
            {cfg.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      render: (val: MaintenanceStatus) => {
        const cfg = statusConfig[val];
        return <StatusBadge status={cfg.type} text={cfg.label} />;
      },
    },
    {
      key: 'teamName',
      title: '分配班组',
      dataIndex: 'teamName',
      render: (val) => (
        <span className="text-dark-300">{val || '-'}</span>
      ),
    },
    {
      key: 'assigneeName',
      title: '负责人',
      dataIndex: 'assigneeName',
      render: (val) => (
        <span className="text-dark-300">{val || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (val: string) => (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-dark-500" />
          <span className={cn(
            'text-sm',
            selectedOrder?.status === 'pending' && isOverOneHour(val) ? 'text-danger font-medium' : 'text-dark-400'
          )}>
            {formatDateTime(val)}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (_val, record) => (
        <div className="flex items-center gap-2">
          {(record.status === 'pending' || record.status === 'escalated') && (
            <Button
              size="sm"
              variant={record.status === 'escalated' ? 'danger' : 'primary'}
              loading={actionLoading === record.id}
              leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); handleAccept(record.id); }}
            >
              接单
            </Button>
          )}
          {(record.status === 'accepted' || record.status === 'repairing') && (
            <Button
              size="sm"
              variant="success"
              loading={actionLoading === record.id}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              onClick={(e) => { e.stopPropagation(); handleComplete(record.id); }}
            >
              完成
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); openDetail(record); }}
          >
            详情
          </Button>
        </div>
      ),
    },
  ];

  const getTimeline = (order: MaintenanceOrder) => {
    const items: { time: string; title: string; desc?: string; icon: LucideIcon; color: string }[] = [];
    items.push({
      time: formatDateTime(order.createdAt),
      title: '工单创建',
      desc: order.faultDescription,
      icon: PlusCircle,
      color: 'text-primary-500 bg-primary-500/10',
    });
    if (order.escalatedAt) {
      items.push({
        time: formatDateTime(order.escalatedAt),
        title: '自动升级',
        desc: '超过1小时未接单，已自动升级至设备部长处理',
        icon: AlertTriangle,
        color: 'text-danger bg-danger/10',
      });
    }
    if (order.acceptedAt) {
      items.push({
        time: formatDateTime(order.acceptedAt),
        title: '接单确认',
        desc: `${order.assigneeName || order.teamName || '维修人员'} 已接单${order.escalatedAt ? '（升级后）' : ''}`,
        icon: PlayCircle,
        color: 'text-warning bg-warning/10',
      });
    }
    if (order.completedAt) {
      items.push({
        time: formatDateTime(order.completedAt),
        title: '维修完成',
        desc: order.resolution,
        icon: CheckCircle2,
        color: 'text-success bg-success/10',
      });
    }
    return items;
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/equipment')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">维修工单</h1>
          <p className="text-sm text-dark-400 mt-1">管理设备维修工单，跟踪处理进度</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-dark-500/10 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-dark-400" />
            </div>
            <div>
              <p className="text-sm text-dark-400">待接单</p>
              <p className="text-2xl font-bold text-white">
                {maintenanceOrders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-danger/50 bg-danger/5 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger animate-breathe" />
            </div>
            <div>
              <p className="text-sm text-danger">已升级</p>
              <p className="text-2xl font-bold text-white">
                {maintenanceOrders.filter(o => o.status === 'escalated').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-dark-400">进行中</p>
              <p className="text-2xl font-bold text-white">
                {maintenanceOrders.filter(o => o.status === 'accepted' || o.status === 'repairing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-sm text-dark-400">紧急</p>
              <p className="text-2xl font-bold text-white">
                {maintenanceOrders.filter(o => o.urgency === 'critical').length}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-dark-700 bg-dark-800/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-dark-400">已完成</p>
              <p className="text-2xl font-bold text-white">
                {maintenanceOrders.filter(o => o.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={maintenanceOrders}
        rowKey="id"
        loading={loading}
        onRowClick={(record) => openDetail(record)}
        rowClassName={(record) => cn(
          (record.status === 'escalated') && 'bg-danger/5'
        )}
      />

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="工单详情"
        size="lg"
        showFooter={false}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-dark-500 mb-1">工单号</p>
                <p className="text-sm text-dark-200 font-mono">{selectedOrder.orderNo}</p>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">设备</p>
                <p className="text-sm text-dark-200">{selectedOrder.equipmentName}</p>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">紧急程度</p>
                <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', urgencyConfig[selectedOrder.urgency].bgColor, urgencyConfig[selectedOrder.urgency].color)}>
                  {urgencyConfig[selectedOrder.urgency].label}
                </span>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">状态</p>
                <StatusBadge status={statusConfig[selectedOrder.status].type} text={statusConfig[selectedOrder.status].label} />
              </div>
            </div>

            <div>
              <p className="text-xs text-dark-500 mb-1">故障描述</p>
              <p className="text-sm text-dark-200 p-3 rounded-lg bg-dark-700/50">
                {selectedOrder.faultDescription}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-dark-500 mb-1">分配班组</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-dark-500" />
                  <span className="text-sm text-dark-200">{selectedOrder.teamName || '未分配'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">维修人员</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-dark-500" />
                  <span className="text-sm text-dark-200">{selectedOrder.assigneeName || '未分配'}</span>
                </div>
              </div>
            </div>

            {selectedOrder.resolution && (
              <div>
                <p className="text-xs text-dark-500 mb-1">处理结果</p>
                <p className="text-sm text-dark-200 p-3 rounded-lg bg-success/10 border border-success/20">
                  {selectedOrder.resolution}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-dark-500 mb-3">处理时间轴</p>
              <div className="relative pl-6 space-y-4">
                {getTimeline(selectedOrder).map((item, idx) => (
                  <div key={idx} className="relative">
                    <div className={cn('absolute -left-6 top-0.5 w-8 h-8 rounded-full flex items-center justify-center', item.color)}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    {idx < getTimeline(selectedOrder).length - 1 && (
                      <div className="absolute -left-[22px] top-8 bottom-0 w-px bg-dark-700" style={{ height: 'calc(100% + 16px)' }} />
                    )}
                    <div className="ml-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <span className="text-xs text-dark-500">{item.time}</span>
                      </div>
                      {item.desc && <p className="text-sm text-dark-400 mt-0.5">{item.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
