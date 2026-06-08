import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Package,
  User,
  Clock,
  CheckCircle2,
  MapPin,
  QrCode,
  ScanLine,
  ArrowRight,
  Warehouse,
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/store/useAuthStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge, type StatusType } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/date';
import type { PutawayTask, PutawayTaskStatus } from '@/types';

const putawayStatusLabels: Record<PutawayTaskStatus, string> = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '上架中',
  completed: '已完成',
};

function putawayStatusToBadge(status: PutawayTaskStatus): StatusType {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'assigned':
      return 'info';
    case 'in_progress':
      return 'processing';
    case 'completed':
      return 'success';
    default:
      return 'pending';
  }
}

const statusFlow: PutawayTaskStatus[] = ['pending', 'assigned', 'in_progress', 'completed'];

export default function InventoryPutawayPage() {
  const { canAccess } = usePermission();
  const user = useAuthStore((state) => state.user);
  const { putawayTasks, loading, fetchReplenishRequests, fetchInventory } = useInventoryStore();

  const [selectedTask, setSelectedTask] = useState<PutawayTask | null>(null);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localTasks, setLocalTasks] = useState<PutawayTask[]>([]);

  useEffect(() => {
    if (canAccess('picker')) {
      fetchReplenishRequests();
      fetchInventory();
    }
  }, [canAccess, fetchReplenishRequests, fetchInventory]);

  useEffect(() => {
    setLocalTasks(putawayTasks);
  }, [putawayTasks]);

  if (!canAccess('picker')) {
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

  const openScan = (task: PutawayTask) => {
    setSelectedTask(task);
    setScanCode('');
    setScanSuccess(false);
    setScanModalOpen(true);
  };

  const startScan = () => {
    setScanning(true);
    setScanSuccess(false);
    setTimeout(() => {
      const mockCode = `SKU${String(Math.floor(Math.random() * 9000) + 1000)}`;
      setScanCode(mockCode);
      setScanning(false);
      setScanSuccess(true);
    }, 1500);
  };

  const openComplete = (task: PutawayTask) => {
    setSelectedTask(task);
    setCompleteModalOpen(true);
  };

  const acceptTask = (taskId: string) => {
    if (!user) return;
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'assigned' as PutawayTaskStatus, assigneeId: user.id, assigneeName: user.name }
          : t
      )
    );
  };

  const startTask = (taskId: string) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' as PutawayTaskStatus } : t))
    );
  };

  const completeTask = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLocalTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id
          ? { ...t, status: 'completed' as PutawayTaskStatus, completedAt: new Date().toISOString() }
          : t
      )
    );
    setSubmitting(false);
    setCompleteModalOpen(false);
    setScanModalOpen(false);
    setSelectedTask(null);
  };

  const isMyTask = (task: PutawayTask) => {
    if (task.status === 'pending') return canAccess('picker');
    return task.assigneeId === user?.id || canAccess('leader');
  };

  const canAccept = (task: PutawayTask) => task.status === 'pending' && canAccess('picker');
  const canStart = (task: PutawayTask) =>
    (task.status === 'assigned' && task.assigneeId === user?.id) ||
    (task.status === 'assigned' && canAccess('leader'));
  const canComplete = (task: PutawayTask) =>
    task.status === 'in_progress' &&
    (task.assigneeId === user?.id || canAccess('leader'));

  const pendingCount = localTasks.filter((t) => t.status !== 'completed').length;
  const myTaskCount = localTasks.filter((t) => t.assigneeId === user?.id && t.status !== 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-primary-500" />
            上架任务
          </h1>
          <p className="text-dark-400 mt-1">扫码确认商品上架到指定库位</p>
        </div>
        <div className="flex items-center gap-3">
          {myTaskCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 border border-primary-500/30">
              <User className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-primary-500 font-medium">
                我的任务: {myTaskCount}
              </span>
            </div>
          )}
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-sm text-warning font-medium">
                待处理: {pendingCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {localTasks.map((task) => {
            const currentIndex = statusFlow.indexOf(task.status);
            const myTask = isMyTask(task);

            return (
              <div
                key={task.id}
                className={cn(
                  'rounded-xl border p-5 transition-all',
                  'bg-dark-800/50 hover:bg-dark-800',
                  myTask && task.status !== 'completed'
                    ? 'border-primary-500/50 hover:border-primary-500'
                    : 'border-dark-700 hover:border-dark-600'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="font-semibold text-white text-lg">{task.skuName}</div>
                      <span className="text-xs text-dark-500 font-mono">{task.skuId}</span>
                      <StatusBadge
                        status={putawayStatusToBadge(task.status)}
                        size="sm"
                        pulse={task.status === 'in_progress'}
                        text={putawayStatusLabels[task.status]}
                      />
                      {task.assigneeId === user?.id && task.status !== 'completed' && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-primary-500/20 text-primary-500 border border-primary-500/30">
                          我的任务
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">任务单号</div>
                        <div className="text-sm text-dark-200 font-mono">{task.taskNo}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">上架数量</div>
                        <div className="text-sm text-white font-semibold">{task.quantity} 件</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          目标库位
                        </div>
                        <div className="text-sm text-accent-500 font-mono font-semibold">
                          {task.targetLocation}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          创建时间
                        </div>
                        <div className="text-sm text-dark-200">{formatDateTime(task.createdAt)}</div>
                      </div>
                    </div>

                    {task.assigneeName && (
                      <div className="flex items-center gap-4 text-xs text-dark-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span>执行人: {task.assigneeName}</span>
                        </div>
                        {task.completedAt && (
                          <div className="flex items-center gap-1.5 text-success">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>完成时间: {formatDateTime(task.completedAt)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-80 shrink-0">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-dark-500">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>状态流转</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {statusFlow.map((status, idx) => {
                          const isActive = idx <= currentIndex;
                          const isCurrent = idx === currentIndex;
                          const statusLabelShort = {
                            pending: '待分配',
                            assigned: '已分配',
                            in_progress: '上架中',
                            completed: '已完成',
                          }[status];

                          return (
                            <div key={status} className="flex items-center flex-1">
                              <div className="flex flex-col items-center flex-1">
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                                    isActive
                                      ? task.status === 'completed' || idx < currentIndex
                                        ? 'bg-success border-success text-white'
                                        : 'bg-primary-500 border-primary-500 text-white'
                                      : 'bg-dark-700 border-dark-600 text-dark-500'
                                  )}
                                >
                                  {isActive && idx < currentIndex ? (
                                    <CheckCircle2 className="w-4 h-4" />
                                  ) : (
                                    idx + 1
                                  )}
                                </div>
                                <span
                                  className={cn(
                                    'text-xs mt-1 whitespace-nowrap',
                                    isCurrent ? 'text-primary-500 font-medium' : 'text-dark-500'
                                  )}
                                >
                                  {statusLabelShort}
                                </span>
                              </div>
                              {idx < statusFlow.length - 1 && (
                                <div
                                  className={cn(
                                    'w-6 h-0.5 -mt-4 mx-0.5',
                                    idx < currentIndex ? 'bg-success' : 'bg-dark-700'
                                  )}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex sm:items-end lg:justify-end gap-2">
                      {canAccept(task) && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => acceptTask(task.id)}
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                          领取任务
                        </Button>
                      )}
                      {canStart(task) && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            startTask(task.id);
                            openScan(task);
                          }}
                          leftIcon={<ScanLine className="w-4 h-4" />}
                        >
                          开始上架
                        </Button>
                      )}
                      {canComplete(task) && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openComplete(task)}
                          leftIcon={<QrCode className="w-4 h-4" />}
                        >
                          扫码确认
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {localTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-dark-500">
              <Package className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-sm">暂无上架任务</p>
            </div>
          )}
        </div>
      )}

      <Modal
        open={scanModalOpen}
        onClose={() => !scanning && !submitting && setScanModalOpen(false)}
        title="扫码上架"
        size="md"
        closable={!scanning && !submitting}
        maskClosable={!scanning && !submitting}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setScanModalOpen(false)}
              disabled={scanning || submitting}
            >
              取消
            </Button>
            {scanSuccess ? (
              <Button
                variant="success"
                onClick={completeTask}
                loading={submitting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                确认上架完成
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={startScan}
                loading={scanning}
                leftIcon={<ScanLine className="w-4 h-4" />}
              >
                {scanning ? '扫描中...' : '开始扫码'}
              </Button>
            )}
          </>
        }
      >
        {selectedTask && (
          <div className="space-y-5">
            <div className="rounded-lg bg-dark-900/50 border border-dark-700 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-dark-500 mb-1">商品</div>
                  <div className="text-white font-medium">{selectedTask.skuName}</div>
                </div>
                <div>
                  <div className="text-xs text-dark-500 mb-1">数量</div>
                  <div className="text-white font-semibold">{selectedTask.quantity} 件</div>
                </div>
                <div>
                  <div className="text-xs text-dark-500 mb-1">任务单号</div>
                  <div className="text-dark-200 font-mono">{selectedTask.taskNo}</div>
                </div>
                <div>
                  <div className="text-xs text-dark-500 mb-1">目标库位</div>
                  <div className="text-accent-500 font-mono font-semibold">
                    {selectedTask.targetLocation}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className={cn(
                  'aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all',
                  scanSuccess
                    ? 'border-success bg-success/5'
                    : scanning
                    ? 'border-primary-500 bg-primary-500/5'
                    : 'border-dark-600 bg-dark-900/30'
                )}
              >
                {scanSuccess ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                    <div className="text-success font-medium mb-1">扫码成功</div>
                    <div className="text-sm text-dark-300 font-mono">{scanCode}</div>
                  </div>
                ) : scanning ? (
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-3">
                      <div className="absolute inset-0 rounded-lg border-2 border-primary-500/50" />
                      <div className="absolute left-0 right-0 h-0.5 bg-primary-500 shadow-[0_0_10px_#3B82F6] animate-[scan_1.5s_ease-in-out_infinite]" />
                      <QrCode className="w-12 h-12 text-primary-500/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-primary-500 font-medium animate-pulse">正在扫描...</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-dark-700/50 flex items-center justify-center mx-auto mb-3">
                      <ScanLine className="w-8 h-8 text-dark-500" />
                    </div>
                    <div className="text-dark-400 font-medium">点击"开始扫码"进行商品扫码</div>
                    <div className="text-xs text-dark-500 mt-1">请将商品条码对准扫描设备</div>
                  </div>
                )}
              </div>
              <style>{`
                @keyframes scan {
                  0%, 100% { top: 10%; }
                  50% { top: 90%; }
                }
              `}</style>
            </div>

            {scanSuccess && (
              <div className="rounded-lg bg-success/5 border border-success/30 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <div className="text-sm text-dark-200">
                  商品信息已验证，请确认将 <span className="text-white font-medium">{selectedTask.quantity}</span> 件
                  <span className="text-white font-medium"> {selectedTask.skuName} </span>
                  上架至库位 <span className="text-accent-500 font-mono font-medium">{selectedTask.targetLocation}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={completeModalOpen}
        onClose={() => !submitting && setCompleteModalOpen(false)}
        title="确认上架完成"
        size="md"
        closable={!submitting}
        maskClosable={!submitting}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setCompleteModalOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              variant="success"
              onClick={completeTask}
              loading={submitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              确认完成
            </Button>
          </>
        }
      >
        {selectedTask && (
          <div className="space-y-5">
            <div className="rounded-lg bg-success/5 border border-success/30 p-4">
              <div className="font-medium text-white mb-2">确认完成此上架任务？</div>
              <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                <div>
                  <div className="text-xs text-dark-500 mb-1">商品</div>
                  <div className="text-white font-medium">{selectedTask.skuName}</div>
                </div>
                <div>
                  <div className="text-xs text-dark-500 mb-1">数量</div>
                  <div className="text-white font-semibold">{selectedTask.quantity} 件</div>
                </div>
                <div>
                  <div className="text-xs text-dark-500 mb-1">任务单号</div>
                  <div className="text-dark-200 font-mono">{selectedTask.taskNo}</div>
                </div>
                <div>
                  <div className="text-xs text-dark-500 mb-1">目标库位</div>
                  <div className="text-accent-500 font-mono font-semibold">
                    {selectedTask.targetLocation}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-dark-500">
              确认商品已正确上架至指定库位后，点击"确认完成"结束任务。
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
