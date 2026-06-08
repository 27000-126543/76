import { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  CheckSquare,
  Square,
  AlertTriangle,
  Package,
  MapPin,
  Check,
  Clock,
  X,
  ChevronRight,
  Scan,
} from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { usePermission } from '@/hooks/usePermission';
import { StatusBadge, type StatusType } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { PickingTask, PickingTaskStatus, TaskItem } from '@/types';

const taskStatusMap: Record<PickingTaskStatus, { label: string; type: StatusType }> = {
  pending: { label: '待领取', type: 'pending' },
  accepted: { label: '已领取', type: 'info' },
  picking: { label: '拣货中', type: 'running' },
  completed: { label: '已完成', type: 'success' },
  exception: { label: '异常', type: 'danger' },
};

const exceptionTypes = [
  { key: 'not_found', label: '商品找不到' },
  { key: 'damaged', label: '商品破损' },
  { key: 'wrong_quantity', label: '数量不符' },
  { key: 'wrong_location', label: '货位错误' },
  { key: 'other', label: '其他' },
];

export default function Tasks() {
  const { user } = usePermission();
  const { tasks, loading, fetchTasks, acceptTask, completeTask } = useOrderStore();

  const [selectedTask, setSelectedTask] = useState<PickingTask | null>(null);
  const [taskItems, setTaskItems] = useState<TaskItem[]>([]);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [selectedExceptionItem, setSelectedExceptionItem] = useState<TaskItem | null>(null);
  const [exceptionType, setExceptionType] = useState('');
  const [exceptionDesc, setExceptionDesc] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const myTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter((t) => t.assigneeId === user.id);
  }, [tasks, user]);

  const handleSelectTask = (task: PickingTask) => {
    setSelectedTask(task);
    setTaskItems(task.items.map((i) => ({ ...i })));
  };

  const handleBackToList = () => {
    setSelectedTask(null);
    setTaskItems([]);
  };

  const handleAcceptTask = async () => {
    if (!selectedTask) return;
    await acceptTask(selectedTask.id);
    const updated = myTasks.find((t) => t.id === selectedTask.id);
    if (updated) {
      setSelectedTask({ ...updated });
    }
  };

  const handleTogglePicked = (index: number) => {
    setTaskItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, picked: !item.picked } : item))
    );
    if (selectedTask && selectedTask.status !== 'picking') {
      setSelectedTask((prev) => (prev ? { ...prev, status: 'picking' } : null));
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    const allPicked = taskItems.every((i) => i.picked);
    if (!allPicked) return;
    await completeTask(selectedTask.id);
    const updated = myTasks.find((t) => t.id === selectedTask.id);
    if (updated) {
      setSelectedTask({ ...updated, items: taskItems });
    }
  };

  const handleOpenException = (item: TaskItem) => {
    setSelectedExceptionItem(item);
    setExceptionType('');
    setExceptionDesc('');
    setExceptionModalOpen(true);
  };

  const handleSubmitException = () => {
    if (!exceptionType) return;
    setExceptionModalOpen(false);
    setSelectedExceptionItem(null);
  };

  const pickedCount = taskItems.filter((i) => i.picked).length;
  const totalCount = taskItems.length;
  const progress = totalCount > 0 ? (pickedCount / totalCount) * 100 : 0;

  if (!selectedTask) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">拣货任务</h1>
            <p className="text-sm text-dark-400 mt-1">
              {user?.name}，您好！您共有 {myTasks.length} 个任务
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Scan className="w-4 h-4" />}
            onClick={() => setScanModalOpen(true)}
          >
            扫码领取任务
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-dark-400">加载中...</div>
          </div>
        ) : myTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Package className="w-16 h-16 text-dark-500" />
            <p className="text-dark-400">暂无任务，点击右上角扫码领取</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTasks.map((task) => {
              const status = taskStatusMap[task.status];
              const picked = task.items.filter((i) => i.picked).length;
              const total = task.items.length;
              const prog = total > 0 ? (picked / total) * 100 : 0;
              return (
                <div
                  key={task.id}
                  className="group p-5 rounded-xl border border-dark-700 bg-dark-800/30 hover:bg-dark-800/60 hover:border-primary-500/50 cursor-pointer transition-all"
                  onClick={() => handleSelectTask(task)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-mono text-sm text-primary-400">{task.taskNo}</p>
                      <p className="text-xs text-dark-500 mt-0.5">波次: {task.waveId}</p>
                    </div>
                    <StatusBadge status={status.type} text={status.label} size="sm" />
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-dark-500" />
                      <span className="text-dark-300">SKU 数:</span>
                      <span className="font-medium text-white">{total}</span>
                    </div>
                    {task.pickedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-dark-500" />
                        <span className="text-dark-300">领取时间:</span>
                        <span className="text-dark-400">{formatDateTime(task.pickedAt)}</span>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-dark-300">完成时间:</span>
                        <span className="text-dark-400">{formatDateTime(task.completedAt)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-dark-400">拣货进度</span>
                      <span className="text-dark-300">
                        {picked}/{total} ({prog.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          prog === 100 ? 'bg-success' : 'bg-primary-500'
                        )}
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-4 text-sm text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    查看详情
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={scanModalOpen}
          onClose={() => setScanModalOpen(false)}
          title="扫码领取任务"
          size="md"
          showFooter={false}
        >
          <div className="flex flex-col items-center justify-center py-8 space-y-6">
            <div className="w-48 h-48 rounded-xl border-2 border-dashed border-dark-600 flex items-center justify-center bg-dark-800/50">
              <QrCode className="w-24 h-24 text-dark-500" />
            </div>
            <p className="text-dark-400 text-center">
              请将二维码对准扫描区域<br />
              或手动输入任务编号
            </p>
            <div className="w-full max-w-sm">
              <input
                type="text"
                placeholder="请输入任务编号"
                className="w-full h-10 px-4 rounded-md bg-dark-800 border border-dark-600 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <Button variant="primary" onClick={() => setScanModalOpen(false)}>
              领取任务
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  const currentStatus = selectedTask ? taskStatusMap[selectedTask.status] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToList}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{selectedTask.taskNo}</h1>
              {currentStatus && <StatusBadge status={currentStatus.type} text={currentStatus.label} />}
            </div>
            <p className="text-sm text-dark-400 mt-1">波次: {selectedTask.waveId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedTask.status === 'pending' && (
            <Button variant="primary" leftIcon={<CheckSquare className="w-4 h-4" />} onClick={handleAcceptTask}>
              领取任务
            </Button>
          )}
          {(selectedTask.status === 'accepted' || selectedTask.status === 'picking') && (
            <Button
              variant="success"
              leftIcon={<Check className="w-4 h-4" />}
              onClick={handleCompleteTask}
              disabled={pickedCount < totalCount}
            >
              完成任务
            </Button>
          )}
        </div>
      </div>

      <div className="p-5 rounded-xl border border-dark-700 bg-dark-800/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-400" />
            <span className="font-medium">拣货进度</span>
          </div>
          <span className="text-sm">
            <span className="text-2xl font-bold text-primary-400">{pickedCount}</span>
            <span className="text-dark-400 mx-1">/</span>
            <span className="text-dark-300 text-lg">{totalCount}</span>
          </span>
        </div>
        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              progress === 100 ? 'bg-success' : 'bg-primary-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-dark-700 bg-dark-800/30 overflow-hidden">
        <div className="px-5 py-3 border-b border-dark-700 bg-dark-800/50">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-dark-300 uppercase">
            <div className="col-span-1">状态</div>
            <div className="col-span-2">SKU</div>
            <div className="col-span-4">商品名称</div>
            <div className="col-span-2">货位</div>
            <div className="col-span-1 text-center">数量</div>
            <div className="col-span-2 text-center">操作</div>
          </div>
        </div>
        <div className="divide-y divide-dark-700/60">
          {taskItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                'grid grid-cols-12 gap-4 px-5 py-4 items-center transition-colors',
                item.picked && 'bg-success/5'
              )}
            >
              <div className="col-span-1">
                <button
                  onClick={() => handleTogglePicked(index)}
                  disabled={selectedTask.status === 'completed'}
                  className="focus:outline-none"
                >
                  {item.picked ? (
                    <CheckSquare className="w-5 h-5 text-success" />
                  ) : (
                    <Square className="w-5 h-5 text-dark-500 hover:text-primary-400 transition-colors" />
                  )}
                </button>
              </div>
              <div className="col-span-2">
                <span className="font-mono text-sm text-primary-400">{item.skuId}</span>
              </div>
              <div className="col-span-4">
                <span className={cn('text-sm', item.picked ? 'text-success' : 'text-dark-200')}>
                  {item.skuName}
                </span>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-dark-500" />
                  <span className="font-mono text-sm text-dark-300">{item.location}</span>
                </div>
              </div>
              <div className="col-span-1 text-center">
                <span className="font-medium text-white">{item.quantity}</span>
              </div>
              <div className="col-span-2 text-center">
                {selectedTask.status !== 'completed' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenException(item)}
                    className="text-warning hover:text-warning"
                  >
                    上报异常
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={exceptionModalOpen}
        onClose={() => {
          setExceptionModalOpen(false);
          setSelectedExceptionItem(null);
        }}
        title="上报异常"
        onOk={handleSubmitException}
        okDisabled={!exceptionType}
        okText="提交"
      >
        {selectedExceptionItem && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-dark-400 mb-0.5">SKU</p>
                  <p className="font-mono text-primary-400">{selectedExceptionItem.skuId}</p>
                </div>
                <div>
                  <p className="text-dark-400 mb-0.5">商品</p>
                  <p className="text-dark-200">{selectedExceptionItem.skuName}</p>
                </div>
                <div>
                  <p className="text-dark-400 mb-0.5">货位</p>
                  <p className="font-mono text-dark-300">{selectedExceptionItem.location}</p>
                </div>
                <div>
                  <p className="text-dark-400 mb-0.5">数量</p>
                  <p className="text-dark-200">{selectedExceptionItem.quantity}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-dark-300 font-medium">异常类型</label>
              <div className="grid grid-cols-2 gap-2">
                {exceptionTypes.map((type) => (
                  <button
                    key={type.key}
                    onClick={() => setExceptionType(type.key)}
                    className={cn(
                      'px-4 py-2.5 rounded-lg text-sm text-left border transition-all',
                      exceptionType === type.key
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-600 bg-dark-800 text-dark-300 hover:border-dark-500'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-dark-300 font-medium">问题描述（可选）</label>
              <textarea
                value={exceptionDesc}
                onChange={(e) => setExceptionDesc(e.target.value)}
                placeholder="请详细描述遇到的问题..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-md bg-dark-800 border border-dark-600 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50 resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
