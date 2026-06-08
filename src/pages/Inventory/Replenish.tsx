import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Package,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  FileText,
  History,
  ArrowRight,
  ShoppingCart,
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
import type { ReplenishRequest, ReplenishStatus, UserRole } from '@/types';

const replenishStatusLabels: Record<ReplenishStatus, string> = {
  pending_supervisor: '待组长审批',
  pending_manager: '待经理审批',
  pending_director: '待总监审批',
  approved: '已通过',
  rejected: '已驳回',
};

function replenishStatusToBadge(status: ReplenishStatus): StatusType {
  switch (status) {
    case 'pending_supervisor':
    case 'pending_manager':
    case 'pending_director':
      return 'pending';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    default:
      return 'pending';
  }
}

const approvalLevelConfig: Record<1 | 2 | 3, { label: string; role: UserRole }> = {
  1: { label: '组长审批', role: 'leader' },
  2: { label: '经理审批', role: 'manager' },
  3: { label: '总监审批', role: 'director' },
};

function getCurrentApprovalLevel(status: ReplenishStatus): 1 | 2 | 3 | null {
  switch (status) {
    case 'pending_supervisor':
      return 1;
    case 'pending_manager':
      return 2;
    case 'pending_director':
      return 3;
    default:
      return null;
  }
}

export default function InventoryReplenishPage() {
  const { canAccess } = usePermission();
  const user = useAuthStore((state) => state.user);
  const { replenishRequests, loading, fetchReplenishRequests, approveReplenish, createPutawayTask } =
    useInventoryStore();

  const [selectedRequest, setSelectedRequest] = useState<ReplenishRequest | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (canAccess('leader')) {
      fetchReplenishRequests();
    }
  }, [canAccess, fetchReplenishRequests]);

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

  const userRoleLevel: 1 | 2 | 3 | null =
    user?.role === 'leader' ? 1 : user?.role === 'manager' ? 2 : user?.role === 'director' ? 3 : null;

  const canApprove = (request: ReplenishRequest): boolean => {
    if (!userRoleLevel) return false;
    const currentLevel = getCurrentApprovalLevel(request.status);
    return currentLevel === userRoleLevel;
  };

  const openDetail = (request: ReplenishRequest) => {
    setSelectedRequest(request);
    setDetailModalOpen(true);
  };

  const openApprove = (request: ReplenishRequest) => {
    setSelectedRequest(request);
    setComment('');
    setApproveModalOpen(true);
  };

  const openReject = (request: ReplenishRequest) => {
    setSelectedRequest(request);
    setComment('');
    setRejectModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !userRoleLevel || !user) return;
    setSubmitting(true);
    await approveReplenish(selectedRequest.id, userRoleLevel, user.id, comment.trim() || '同意补货', 'approve');
    if (selectedRequest.status === 'pending_director') {
      await createPutawayTask(selectedRequest.id);
    }
    setSubmitting(false);
    setApproveModalOpen(false);
    setSelectedRequest(null);
  };

  const handleReject = async () => {
    if (!selectedRequest || !userRoleLevel || !user || !comment.trim()) return;
    setSubmitting(true);
    await approveReplenish(selectedRequest.id, userRoleLevel, user.id, comment.trim(), 'reject');
    setSubmitting(false);
    setRejectModalOpen(false);
    setSelectedRequest(null);
  };

  const pendingCount = replenishRequests.filter(
    (r) => getCurrentApprovalLevel(r.status) === userRoleLevel
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-accent-500" />
            补货审批
          </h1>
          <p className="text-dark-400 mt-1">多级审批流程管理补货申请</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-sm text-warning font-medium">
              您有 {pendingCount} 条待审批申请
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {replenishRequests.map((request) => {
            const currentLevel = getCurrentApprovalLevel(request.status);
            const isMyTurn = canApprove(request);
            const isLowStock = request.currentStock < request.safeStock;

            return (
              <div
                key={request.id}
                className={cn(
                  'rounded-xl border p-5 transition-all',
                  'bg-dark-800/50 hover:bg-dark-800',
                  isMyTurn
                    ? 'border-primary-500/50 hover:border-primary-500 shadow-[0_0_20px_-10px_rgba(59,130,246,0.3)]'
                    : 'border-dark-700 hover:border-dark-600'
                )}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <div className="font-semibold text-white text-lg">{request.skuName}</div>
                      <span className="text-xs text-dark-500 font-mono">{request.skuId}</span>
                      <StatusBadge
                        status={replenishStatusToBadge(request.status)}
                        size="sm"
                        pulse={isMyTurn}
                        text={replenishStatusLabels[request.status]}
                      />
                      {isMyTurn && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-primary-500/20 text-primary-500 border border-primary-500/30 animate-pulse">
                          待您审批
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-dark-500 mb-1">申请单号</div>
                        <div className="text-sm text-dark-200 font-mono">{request.requestNo}</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">补货数量</div>
                        <div className="text-sm text-white font-semibold">{request.quantity} 件</div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">当前库存</div>
                        <div className={cn(
                          'text-sm font-medium',
                          isLowStock ? 'text-danger' : 'text-dark-200'
                        )}>
                          {request.currentStock} 件
                          {isLowStock && <span className="ml-1 text-xs">⚠ 低于安全线</span>}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-dark-500 mb-1">安全库存</div>
                        <div className="text-sm text-dark-200">{request.safeStock} 件</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-dark-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>申请人: {request.applicantName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>申请时间: {formatDateTime(request.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>原因: {request.reason}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-72 shrink-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-dark-500">
                        <History className="w-3.5 h-3.5" />
                        <span>审批进度</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {([1, 2, 3] as const).map((level, idx) => {
                          const approval = request.approvals.find((a) => a.level === level);
                          const isCurrent = currentLevel === level;
                          const isRejected = request.status === 'rejected' && approval?.action === 'reject';

                          let nodeClass = 'bg-dark-600 border-dark-600 text-dark-500';
                          if (approval) {
                            nodeClass = approval.action === 'approve'
                              ? 'bg-success border-success text-white'
                              : 'bg-danger border-danger text-white';
                          } else if (isCurrent) {
                            nodeClass = 'bg-primary-500 border-primary-500 text-white animate-pulse';
                          }

                          return (
                            <div key={level} className="flex items-center flex-1">
                              <div className="flex flex-col items-center">
                                <div
                                  className={cn(
                                    'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                                    nodeClass
                                  )}
                                >
                                  {approval ? (
                                    approval.action === 'approve' ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                      <XCircle className="w-4 h-4" />
                                    )
                                  ) : (
                                    level
                                  )}
                                </div>
                                <span className={cn(
                                  'text-xs mt-1 whitespace-nowrap',
                                  isCurrent ? 'text-primary-500 font-medium' : 'text-dark-500'
                                )}>
                                  {approvalLevelConfig[level].label}
                                </span>
                              </div>
                              {idx < 2 && (
                                <div className={cn(
                                  'flex-1 h-0.5 mx-1 -mt-4',
                                  request.approvals.find((a) => a.level === level)?.action === 'approve'
                                    ? 'bg-success'
                                    : isRejected
                                    ? 'bg-danger'
                                    : 'bg-dark-700'
                                )} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex sm:items-end lg:justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDetail(request)}
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        详情
                      </Button>
                      {isMyTurn && (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openReject(request)}
                          >
                            驳回
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => openApprove(request)}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                          >
                            通过
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {replenishRequests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-dark-500">
              <Package className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-sm">暂无补货申请</p>
            </div>
          )}
        </div>
      )}

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="补货申请详情"
        size="xl"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-dark-700">
              <div>
                <div className="text-xl font-semibold text-white">{selectedRequest.skuName}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm text-dark-500 font-mono">{selectedRequest.skuId}</span>
                  <StatusBadge
                    status={replenishStatusToBadge(selectedRequest.status)}
                    size="sm"
                    text={replenishStatusLabels[selectedRequest.status]}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-dark-900/50 border border-dark-700 p-4">
                <div className="text-xs text-dark-500 mb-1">申请单号</div>
                <div className="text-sm text-white font-mono">{selectedRequest.requestNo}</div>
              </div>
              <div className="rounded-lg bg-dark-900/50 border border-dark-700 p-4">
                <div className="text-xs text-dark-500 mb-1">补货数量</div>
                <div className="text-lg text-white font-bold">{selectedRequest.quantity} 件</div>
              </div>
              <div className="rounded-lg bg-dark-900/50 border border-dark-700 p-4">
                <div className="text-xs text-dark-500 mb-1">当前库存</div>
                <div className="text-lg text-danger font-bold">{selectedRequest.currentStock} 件</div>
              </div>
              <div className="rounded-lg bg-dark-900/50 border border-dark-700 p-4">
                <div className="text-xs text-dark-500 mb-1">安全库存</div>
                <div className="text-lg text-dark-200 font-semibold">{selectedRequest.safeStock} 件</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-dark-300 mb-2">申请原因</div>
              <div className="rounded-lg bg-dark-900/50 border border-dark-700 p-4 text-sm text-dark-200">
                {selectedRequest.reason}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-dark-500 mb-1">申请人</div>
                <div className="text-sm text-white">{selectedRequest.applicantName}</div>
              </div>
              <div>
                <div className="text-xs text-dark-500 mb-1">申请时间</div>
                <div className="text-sm text-dark-200">{formatDateTime(selectedRequest.createdAt)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                审批流程
              </div>
              <div className="relative pl-6 space-y-4">
                {([1, 2, 3] as const).map((level) => {
                  const approval = selectedRequest.approvals.find((a) => a.level === level);
                  const isCurrent = getCurrentApprovalLevel(selectedRequest.status) === level;
                  const isRejected = approval?.action === 'reject';

                  return (
                    <div key={level} className="relative">
                      <div className="absolute -left-6 top-1">
                        <div
                          className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                            approval
                              ? approval.action === 'approve'
                                ? 'bg-success border-success'
                                : 'bg-danger border-danger'
                              : isCurrent
                              ? 'bg-primary-500 border-primary-500 animate-pulse'
                              : 'bg-dark-700 border-dark-600'
                          )}
                        >
                          {approval && (
                            approval.action === 'approve' ? (
                              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <XCircle className="w-2.5 h-2.5 text-white" />
                            )
                          )}
                        </div>
                      </div>
                      {level < 3 && (
                        <div
                          className={cn(
                            'absolute -left-[21px] top-5 w-0.5 h-10',
                            approval?.action === 'approve' ? 'bg-success' : 'bg-dark-700'
                          )}
                        />
                      )}
                      <div className={cn(
                        'rounded-lg border p-4',
                        approval
                          ? isRejected
                            ? 'bg-danger/5 border-danger/30'
                            : 'bg-success/5 border-success/30'
                          : isCurrent
                          ? 'bg-primary-500/5 border-primary-500/30'
                          : 'bg-dark-900/30 border-dark-700'
                      )}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="font-medium text-white">
                            {approvalLevelConfig[level].label}
                          </div>
                          {approval ? (
                            <StatusBadge
                              status={isRejected ? 'danger' : 'success'}
                              size="sm"
                              text={approval.action === 'approve' ? '已通过' : '已驳回'}
                            />
                          ) : isCurrent ? (
                            <StatusBadge status="pending" size="sm" text="待审批" pulse />
                          ) : (
                            <span className="text-xs text-dark-500">等待中</span>
                          )}
                        </div>
                        {approval && (
                          <>
                            <div className="text-xs text-dark-400 mb-1">
                              审批人: {approval.approverName} · {formatDateTime(approval.approvedAt)}
                            </div>
                            {approval.comment && (
                              <div className="text-sm text-dark-300 mt-2 p-2 rounded bg-dark-900/50">
                                {approval.comment}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={approveModalOpen}
        onClose={() => !submitting && setApproveModalOpen(false)}
        title="审批通过"
        size="md"
        closable={!submitting}
        maskClosable={!submitting}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setApproveModalOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              variant="success"
              onClick={handleApprove}
              loading={submitting}
            >
              确认通过
            </Button>
          </>
        }
      >
        {selectedRequest && (
          <div className="space-y-5">
            <div className="rounded-lg bg-success/5 border border-success/30 p-4">
              <div className="font-medium text-white mb-1">
                确定通过此补货申请？
              </div>
              <div className="text-sm text-dark-300">
                {selectedRequest.skuName} - 补货 {selectedRequest.quantity} 件
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                审批意见
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入审批意见（选填）..."
                rows={3}
                className={cn(
                  'w-full rounded-lg border bg-dark-900/50 px-4 py-3 text-sm text-white',
                  'placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-success/50 transition-all',
                  comment.trim() ? 'border-success/50' : 'border-dark-600 focus:border-success/50'
                )}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={rejectModalOpen}
        onClose={() => !submitting && setRejectModalOpen(false)}
        title="审批驳回"
        size="md"
        closable={!submitting}
        maskClosable={!submitting}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setRejectModalOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={submitting}
              disabled={!comment.trim()}
            >
              确认驳回
            </Button>
          </>
        }
      >
        {selectedRequest && (
          <div className="space-y-5">
            <div className="rounded-lg bg-danger/5 border border-danger/30 p-4">
              <div className="font-medium text-white mb-1">
                确定驳回收货申请？
              </div>
              <div className="text-sm text-dark-300">
                {selectedRequest.skuName} - 补货 {selectedRequest.quantity} 件
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                驳回原因 <span className="text-danger">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入驳回原因..."
                rows={3}
                className={cn(
                  'w-full rounded-lg border bg-dark-900/50 px-4 py-3 text-sm text-white',
                  'placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-danger/50 transition-all',
                  comment.trim() ? 'border-danger/50' : 'border-dark-600 focus:border-danger/50'
                )}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
