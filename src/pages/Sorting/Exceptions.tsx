import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Camera,
  FileText,
  User,
  Upload,
  X,
  ChevronRight,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge, type StatusType } from '@/components/common/StatusBadge';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/date';
import type { ExceptionOrder, ExceptionType, ExceptionStatus } from '@/types';

const exceptionTypeLabels: Record<ExceptionType, string> = {
  package_drop: '包裹掉落',
  label_unclear: '标签模糊',
  wrong_sort: '错分拣',
  damage: '包裹破损',
};

const exceptionTypeIcons: Record<ExceptionType, string> = {
  package_drop: 'bg-danger/10 text-danger',
  label_unclear: 'bg-warning/10 text-warning',
  wrong_sort: 'bg-primary-500/10 text-primary-500',
  damage: 'bg-accent-500/10 text-accent-500',
};

const initialExceptions: ExceptionOrder[] = [
  {
    id: 'ex1',
    exceptionNo: 'EXC20240608001',
    type: 'package_drop',
    orderId: 'o1',
    orderNo: 'ORD20240608001',
    description: '包裹在分拣过程中从传送带掉落，外包装轻微变形',
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
    description: '面单标签被雨水打湿模糊，无法识别目的地信息',
    photos: ['photo1.jpg'],
    handlerId: 'u1',
    handlerName: '张三',
    status: 'processing',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'ex3',
    exceptionNo: 'EXC20240608003',
    type: 'wrong_sort',
    orderId: 'o3',
    orderNo: 'ORD20240608003',
    description: '包裹被错误分拣到华东仓，实际目的地应为华北仓',
    photos: [],
    handlerId: 'u2',
    handlerName: '李四',
    status: 'processing',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    id: 'ex4',
    exceptionNo: 'EXC20240608004',
    type: 'damage',
    orderId: 'o4',
    orderNo: 'ORD20240608004',
    description: '包裹外包装有明显破损，疑似内部商品受损，需开箱检查',
    photos: ['photo2.jpg', 'photo3.jpg'],
    status: 'pending',
    createdAt: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'ex5',
    exceptionNo: 'EXC20240608005',
    type: 'wrong_sort',
    orderId: 'o5',
    orderNo: 'ORD20240608005',
    description: '已重新分拣到正确道口华北仓，确认无误',
    photos: [],
    handlerId: 'u1',
    handlerName: '张三',
    status: 'resolved',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    resolvedAt: new Date(Date.now() - 5400000).toISOString(),
    resolution: '已重新分拣到正确道口华北仓，确认包裹完好无损',
  },
  {
    id: 'ex6',
    exceptionNo: 'EXC20240608006',
    type: 'label_unclear',
    orderId: 'o6',
    orderNo: 'ORD20240608006',
    description: '通过订单系统查询到完整信息，已手动补打标签',
    photos: ['photo4.jpg'],
    handlerId: 'u2',
    handlerName: '李四',
    status: 'resolved',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    resolvedAt: new Date(Date.now() - 9000000).toISOString(),
    resolution: '通过订单编号查询到完整配送信息，已重新打印面单并粘贴',
  },
];

type TabType = 'processing' | 'completed';

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

export default function SortingExceptionsPage() {
  const { canAccess } = usePermission();
  const user = useAuthStore((state) => state.user);
  const [exceptions, setExceptions] = useState<ExceptionOrder[]>(initialExceptions);
  const [activeTab, setActiveTab] = useState<TabType>('processing');
  const [selectedException, setSelectedException] = useState<ExceptionOrder | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [handleModalOpen, setHandleModalOpen] = useState(false);
  const [resolution, setResolution] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const processingList = useMemo(
    () => exceptions.filter((e) => e.status !== 'resolved'),
    [exceptions]
  );
  const completedList = useMemo(
    () => exceptions.filter((e) => e.status === 'resolved'),
    [exceptions]
  );
  const currentList = activeTab === 'processing' ? processingList : completedList;

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

  const openDetail = (ex: ExceptionOrder) => {
    setSelectedException(ex);
    setDetailModalOpen(true);
  };

  const openHandle = (ex: ExceptionOrder) => {
    setSelectedException(ex);
    setResolution('');
    setUploadedPhotos([]);
    if (ex.status === 'pending') {
      setExceptions((prev) =>
        prev.map((e) =>
          e.id === ex.id
            ? { ...e, status: 'processing', handlerId: user?.id, handlerName: user?.name }
            : e
        )
      );
    }
    setHandleModalOpen(true);
  };

  const handlePhotoUpload = () => {
    const mockPhoto = `photo_${Date.now()}.jpg`;
    setUploadedPhotos((prev) => [...prev, mockPhoto]);
  };

  const removePhoto = (photo: string) => {
    setUploadedPhotos((prev) => prev.filter((p) => p !== photo));
  };

  const submitHandle = async () => {
    if (!selectedException || !resolution.trim()) return;
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setExceptions((prev) =>
      prev.map((e) =>
        e.id === selectedException.id
          ? {
              ...e,
              status: 'resolved',
              resolution: resolution.trim(),
              photos: [...e.photos, ...uploadedPhotos],
              resolvedAt: new Date().toISOString(),
              handlerId: user?.id ?? e.handlerId,
              handlerName: user?.name ?? e.handlerName,
            }
          : e
      )
    );
    setSubmitting(false);
    setHandleModalOpen(false);
    setSelectedException(null);
  };

  const tabs: { key: TabType; label: string; icon: LucideIcon; count: number }[] = [
    { key: 'processing', label: '处理中工单', icon: Clock, count: processingList.length },
    { key: 'completed', label: '处理完成', icon: CheckCircle2, count: completedList.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-accent-500" />
            异常处理工作台
          </h1>
          <p className="text-dark-400 mt-1">处理分拣过程中的各类异常工单</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 rounded-lg bg-dark-800/50 border border-dark-700 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                isActive
                  ? 'bg-dark-700 text-white shadow-sm'
                  : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  isActive
                    ? 'bg-primary-500/20 text-primary-500'
                    : 'bg-dark-700 text-dark-400'
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {currentList.map((ex) => (
          <div
            key={ex.id}
            className="rounded-xl border border-dark-700 bg-dark-800/50 p-5 hover:bg-dark-800 hover:border-dark-600 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    exceptionTypeIcons[ex.type]
                  )}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-white">{exceptionTypeLabels[ex.type]}</div>
                  <div className="text-xs text-dark-500">{ex.exceptionNo}</div>
                </div>
              </div>
              <StatusBadge
                status={exceptionStatusToBadge(ex.status)}
                size="sm"
                pulse={ex.status === 'processing'}
              />
            </div>

            <p className="text-sm text-dark-300 mb-4 line-clamp-2">{ex.description}</p>

            <div className="space-y-2 text-xs text-dark-500 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>关联订单: {ex.orderNo}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>创建时间: {formatDateTime(ex.createdAt)}</span>
              </div>
              {ex.handlerName && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>处理人: {ex.handlerName}</span>
                </div>
              )}
              {ex.resolvedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span className="text-success">完成时间: {formatDateTime(ex.resolvedAt)}</span>
                </div>
              )}
            </div>

            {ex.photos.length > 0 && (
              <div className="flex gap-2 mb-4">
                {ex.photos.slice(0, 4).map((photo, idx) => (
                  <div
                    key={idx}
                    className="w-12 h-12 rounded-md bg-dark-700 border border-dark-600 flex items-center justify-center"
                  >
                    <Camera className="w-5 h-5 text-dark-500" />
                  </div>
                ))}
                {ex.photos.length > 4 && (
                  <div className="w-12 h-12 rounded-md bg-dark-700 border border-dark-600 flex items-center justify-center text-xs text-dark-400">
                    +{ex.photos.length - 4}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => openDetail(ex)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                查看详情
              </Button>
              {ex.status !== 'resolved' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => openHandle(ex)}
                >
                  {ex.status === 'pending' ? '接单处理' : '继续处理'}
                </Button>
              )}
            </div>
          </div>
        ))}

        {currentList.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-dark-500">
            <ClipboardList className="w-16 h-16 mb-4 opacity-40" />
            <p className="text-sm">暂无{activeTab === 'processing' ? '待处理' : '已完成'}工单</p>
          </div>
        )}
      </div>

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="工单详情"
        size="lg"
        footer={
          selectedException && selectedException.status !== 'resolved' ? (
            <Button
              variant="primary"
              onClick={() => {
                setDetailModalOpen(false);
                openHandle(selectedException);
              }}
            >
              处理工单
            </Button>
          ) : null
        }
      >
        {selectedException && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-dark-700">
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center',
                  exceptionTypeIcons[selectedException.type]
                )}
              >
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xl font-semibold text-white">
                  {exceptionTypeLabels[selectedException.type]}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-dark-500">{selectedException.exceptionNo}</span>
                  <StatusBadge
                    status={exceptionStatusToBadge(selectedException.status)}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-dark-500 mb-1">关联订单</div>
                <div className="text-sm text-white font-medium">{selectedException.orderNo}</div>
              </div>
              <div>
                <div className="text-xs text-dark-500 mb-1">创建时间</div>
                <div className="text-sm text-white">{formatDateTime(selectedException.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-dark-500 mb-1">处理人</div>
                <div className="text-sm text-white">
                  {selectedException.handlerName || '暂未分配'}
                </div>
              </div>
              {selectedException.resolvedAt && (
                <div>
                  <div className="text-xs text-dark-500 mb-1">完成时间</div>
                  <div className="text-sm text-success">{formatDateTime(selectedException.resolvedAt)}</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-dark-500 mb-2">异常描述</div>
              <div className="rounded-lg bg-dark-900/50 border border-dark-700 p-4 text-sm text-dark-200">
                {selectedException.description}
              </div>
            </div>

            {selectedException.photos.length > 0 && (
              <div>
                <div className="text-xs text-dark-500 mb-2">现场照片</div>
                <div className="flex gap-3 flex-wrap">
                  {selectedException.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-lg bg-dark-700 border border-dark-600 flex items-center justify-center"
                    >
                      <Camera className="w-8 h-8 text-dark-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedException.resolution && (
              <div>
                <div className="text-xs text-dark-500 mb-2">处理方案</div>
                <div className="rounded-lg bg-success/5 border border-success/30 p-4 text-sm text-dark-200">
                  {selectedException.resolution}
                </div>
              </div>
            )}

            {selectedException.status !== 'resolved' && !selectedException.resolution && (
              <div>
                <div className="text-xs text-dark-500 mb-2">处理记录</div>
                <div className="rounded-lg border border-dark-700 border-dashed p-4 text-sm text-dark-500 text-center">
                  暂无处理记录
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={handleModalOpen}
        onClose={() => !submitting && setHandleModalOpen(false)}
        title="处理异常工单"
        size="lg"
        closable={!submitting}
        maskClosable={!submitting}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setHandleModalOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={submitHandle}
              loading={submitting}
              disabled={!resolution.trim()}
            >
              确认处理完成
            </Button>
          </>
        }
      >
        {selectedException && (
          <div className="space-y-5">
            <div className="rounded-lg bg-dark-900/50 border border-dark-700 p-4">
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge
                  status="info"
                  text={exceptionTypeLabels[selectedException.type]}
                  size="sm"
                />
                <span className="text-sm text-dark-400">{selectedException.exceptionNo}</span>
              </div>
              <p className="text-sm text-dark-200">{selectedException.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                解决方案描述 <span className="text-danger">*</span>
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="请详细描述处理方案和结果..."
                rows={4}
                className={cn(
                  'w-full rounded-lg border bg-dark-900/50 px-4 py-3 text-sm text-white',
                  'placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all',
                  resolution.trim() ? 'border-primary-500/50' : 'border-dark-600 focus:border-primary-500/50'
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                现场照片上传
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {uploadedPhotos.map((photo) => (
                  <div
                    key={photo}
                    className="relative aspect-square rounded-lg border border-dark-600 bg-dark-700 flex items-center justify-center group"
                  >
                    <Camera className="w-8 h-8 text-dark-500" />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo)}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-danger text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {uploadedPhotos.length < 6 && (
                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    className="aspect-square rounded-lg border-2 border-dashed border-dark-600 bg-dark-800/30 hover:bg-dark-700/50 hover:border-primary-500/50 flex flex-col items-center justify-center gap-1 transition-all"
                  >
                    <Upload className="w-6 h-6 text-dark-500" />
                    <span className="text-xs text-dark-500">上传</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-dark-500 mt-2">最多上传6张照片，支持JPG/PNG格式（模拟）</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
