import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  Layers,
  UserPlus,
  Route,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import { useOrderStore } from '@/store/useOrderStore';
import { usePermission } from '@/hooks/usePermission';
import { DataTable, type Column } from '@/components/common/DataTable';
import { StatusBadge, type StatusType } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import type { Order, Wave, OrderStatus, WaveStatus } from '@/types';

const orderStatusMap: Record<OrderStatus, { label: string; type: StatusType }> = {
  pending: { label: '待处理', type: 'pending' },
  picking: { label: '拣货中', type: 'running' },
  sorting: { label: '分拣中', type: 'processing' },
  shipped: { label: '已发货', type: 'success' },
  exception: { label: '异常', type: 'danger' },
};

const waveStatusMap: Record<WaveStatus, { label: string; type: StatusType }> = {
  created: { label: '已创建', type: 'pending' },
  assigned: { label: '已分配', type: 'info' },
  picking: { label: '拣货中', type: 'running' },
  completed: { label: '已完成', type: 'success' },
};

type TabKey = 'orders' | 'waves';

export default function Orders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAccess, user } = usePermission();
  const {
    orders,
    waves,
    loading,
    fetchOrders,
    fetchWaves,
    createWave,
    assignTask,
  } = useOrderStore();

  const urlTab = searchParams.get('tab') as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(urlTab === 'waves' ? 'waves' : 'orders');

  useEffect(() => {
    if (urlTab === 'waves') {
      setActiveTab('waves');
    } else {
      setActiveTab('orders');
    }
  }, [urlTab]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedWave, setSelectedWave] = useState<Wave | null>(null);

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchWaves();
  }, [fetchOrders, fetchWaves]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchText) {
        const text = searchText.toLowerCase();
        if (
          !order.orderNo.toLowerCase().includes(text) &&
          !order.customerName.toLowerCase().includes(text)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [orders, statusFilter, searchText]);

  const toggleOrderSelect = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const handleMergeWave = async () => {
    if (selectedOrderIds.size < 2) return;
    await createWave(Array.from(selectedOrderIds));
    setSelectedOrderIds(new Set());
    setMergeModalOpen(false);
  };

  const handleViewRoute = (wave: Wave) => {
    setSelectedWave(wave);
    setRouteModalOpen(true);
  };

  const handleAssignTask = (wave: Wave) => {
    setSelectedWave(wave);
    setSelectedAssignee('');
    setAssignModalOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedWave || !selectedAssignee) return;
    await assignTask(selectedWave.id, selectedAssignee);
    setAssignModalOpen(false);
    setSelectedWave(null);
  };

  const orderColumns: Column<Order>[] = [
    {
      key: 'select',
      title: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
          />
        </div>
      ),
      width: 48,
      render: (_: any, record: Order) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedOrderIds.has(record.id)}
            onChange={() => toggleOrderSelect(record.id)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-dark-500 bg-dark-700 text-primary-500 focus:ring-primary-500/50"
          />
        </div>
      ),
    },
    {
      key: 'orderNo',
      title: '订单号',
      sortable: true,
      render: (val: string) => <span className="font-mono text-xs text-primary-400">{val}</span>,
    },
    {
      key: 'customerName',
      title: '客户',
      sortable: true,
      render: (val: string) => <span className="font-medium">{val}</span>,
    },
    {
      key: 'address',
      title: '地址',
      render: (_: any, record: Order) => (
        <span className="text-dark-400">
          {record.province}{record.city}{record.district}{record.address}
        </span>
      ),
    },
    {
      key: 'priority',
      title: '优先级',
      align: 'center',
      render: (val: string) =>
        val === 'urgent' ? (
          <StatusBadge status="danger" text="紧急" size="sm" />
        ) : (
          <StatusBadge status="info" text="普通" size="sm" />
        ),
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      align: 'center',
      render: (val: OrderStatus) => {
        const mapped = orderStatusMap[val];
        return <StatusBadge status={mapped.type} text={mapped.label} size="sm" />;
      },
    },
    {
      key: 'createdAt',
      title: '创建时间',
      sortable: true,
      render: (val: string) => <span className="text-dark-400">{formatDateTime(val)}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      align: 'center',
      width: 100,
      render: (_: any, record: Order) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleViewOrder(record);
          }}
          className="h-8 w-8 text-dark-400 hover:text-primary-400"
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const waveColumns: Column<Wave>[] = [
    {
      key: 'waveNo',
      title: '波次号',
      sortable: true,
      render: (val: string) => <span className="font-mono text-xs text-primary-400">{val}</span>,
    },
    {
      key: 'area',
      title: '区域',
      sortable: true,
      render: (val: string) => <span className="font-medium">{val}</span>,
    },
    {
      key: 'orderCount',
      title: '订单数',
      align: 'center',
      sortable: true,
      render: (val: number) => <span className="font-medium">{val}</span>,
    },
    {
      key: 'skuCount',
      title: 'SKU数',
      align: 'center',
      sortable: true,
      render: (val: number) => <span className="font-medium">{val}</span>,
    },
    {
      key: 'estimatedDistance',
      title: '预估距离(m)',
      align: 'center',
      sortable: true,
      render: (val: number) => <span className="text-dark-300">{val}</span>,
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      align: 'center',
      render: (val: WaveStatus) => {
        const mapped = waveStatusMap[val];
        return <StatusBadge status={mapped.type} text={mapped.label} size="sm" />;
      },
    },
    {
      key: 'assigneeName',
      title: '负责人',
      render: (val: string) => <span>{val || <span className="text-dark-500">未分配</span>}</span>,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      sortable: true,
      render: (val: string) => <span className="text-dark-400">{formatDateTime(val)}</span>,
    },
    {
      key: 'actions',
      title: '操作',
      align: 'center',
      width: 140,
      render: (_: any, record: Wave) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleAssignTask(record);
            }}
            disabled={record.status !== 'created'}
            className="h-8 w-8 text-dark-400 hover:text-primary-400"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleViewRoute(record);
            }}
            className="h-8 w-8 text-dark-400 hover:text-primary-400"
          >
            <Route className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'orders', label: '订单列表', icon: Filter },
    { key: 'waves', label: '波次管理', icon: Layers },
  ];

  if (!canAccess('leader')) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="w-16 h-16 text-dark-500" />
        <p className="text-dark-400 text-lg">您没有权限访问该页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">订单管理</h1>
      </div>

      <div className="flex items-center gap-2 border-b border-dark-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:border-dark-600'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'orders' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
              <input
                type="text"
                placeholder="搜索订单号、客户名..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64 h-10 pl-10 pr-4 rounded-md bg-dark-800 border border-dark-600 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-md bg-dark-800 border border-dark-600 text-sm text-white focus:outline-none focus:border-primary-500/50"
            >
              <option value="all">全部状态</option>
              {Object.entries(orderStatusMap).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            {selectedOrderIds.size > 0 && (
              <Button
                variant="primary"
                onClick={() => setMergeModalOpen(true)}
                leftIcon={<Layers className="w-4 h-4" />}
              >
                批量合并波次 ({selectedOrderIds.size})
              </Button>
            )}
          </div>

          <DataTable
            columns={orderColumns}
            data={filteredOrders}
            rowKey="id"
            loading={loading}
            pagination
            pageSize={10}
            showIndex
            indexTitle="序号"
            onRowClick={handleViewOrder}
          />
        </>
      )}

      {activeTab === 'waves' && (
        <DataTable
          columns={waveColumns}
          data={waves}
          rowKey="id"
          loading={loading}
          pagination
          pageSize={10}
          showIndex
          indexTitle="序号"
        />
      )}

      <Modal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        title="订单详情"
        size="lg"
        showFooter={false}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-dark-400 mb-1">订单号</p>
                <p className="font-mono text-primary-400">{selectedOrder.orderNo}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400 mb-1">客户</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400 mb-1">优先级</p>
                {selectedOrder.priority === 'urgent' ? (
                  <StatusBadge status="danger" text="紧急" />
                ) : (
                  <StatusBadge status="info" text="普通" />
                )}
              </div>
              <div>
                <p className="text-sm text-dark-400 mb-1">状态</p>
                <StatusBadge
                  status={orderStatusMap[selectedOrder.status].type}
                  text={orderStatusMap[selectedOrder.status].label}
                />
              </div>
              <div className="col-span-2">
                <p className="text-sm text-dark-400 mb-1">收货地址</p>
                <p className="text-dark-200">
                  {selectedOrder.province}{selectedOrder.city}{selectedOrder.district}{selectedOrder.address}
                </p>
              </div>
              <div>
                <p className="text-sm text-dark-400 mb-1">创建时间</p>
                <p className="text-dark-200">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400 mb-1">承诺时间</p>
                <p className="text-dark-200">{formatDateTime(selectedOrder.promisedTime)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-dark-300 mb-3">商品清单</p>
              <div className="rounded-lg border border-dark-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-800/60">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-dark-300 uppercase">SKU</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-dark-300 uppercase">商品名</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-dark-300 uppercase">货位</th>
                      <th className="px-4 py-2.5 text-center text-xs font-semibold text-dark-300 uppercase">数量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/60">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-mono text-primary-400">{item.skuId}</td>
                        <td className="px-4 py-3 text-sm text-dark-200">{item.skuName}</td>
                        <td className="px-4 py-3 text-sm font-mono text-dark-400">{item.location}</td>
                        <td className="px-4 py-3 text-sm text-center text-dark-200">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        title="确认合并波次"
        description={`将 ${selectedOrderIds.size} 个订单合并为一个波次`}
        onOk={handleMergeWave}
        okText="确认合并"
      >
        <p className="text-sm text-dark-400">
          合并后将创建一个新的波次，包含已选中的所有订单。请确认操作。
        </p>
      </Modal>

      <Modal
        open={routeModalOpen}
        onClose={() => {
          setRouteModalOpen(false);
          setSelectedWave(null);
        }}
        title="拣货路线"
        size="md"
        showFooter={false}
      >
        {selectedWave && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">波次号</p>
                <p className="font-mono text-primary-400">{selectedWave.waveNo}</p>
              </div>
              <div>
                <p className="text-sm text-dark-400">预估距离</p>
                <p className="font-medium">{selectedWave.estimatedDistance} m</p>
              </div>
            </div>
            <div className="space-y-2">
              {selectedWave.route.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-lg bg-dark-800/50 border border-dark-700"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/50 flex items-center justify-center text-primary-400 font-bold text-sm">
                    {point.sequence}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm">{point.location}</p>
                    <p className="text-xs text-dark-500 mt-0.5">
                      SKU: {point.skuIds.join(', ')}
                    </p>
                  </div>
                  {idx < selectedWave.route.length - 1 && (
                    <Route className="w-4 h-4 text-dark-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedWave(null);
        }}
        title="分配任务"
        onOk={handleConfirmAssign}
        okDisabled={!selectedAssignee}
        okText="确认分配"
      >
        <div className="space-y-3">
          <p className="text-sm text-dark-400">请选择要分配的拣货人员：</p>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full h-10 px-3 rounded-md bg-dark-800 border border-dark-600 text-sm text-white focus:outline-none focus:border-primary-500/50"
          >
            <option value="">请选择</option>
            <option value="u1">张三 (u1)</option>
            <option value="u2">李四 (u2)</option>
            <option value="u3">王五 (u3)</option>
            <option value="u4">赵六 (u4)</option>
            <option value="u5">钱七 (u5)</option>
            <option value="u6">孙八 (u6)</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
