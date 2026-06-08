import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  Filter,
  MapPin,
  ShieldAlert,
  Layers,
  BarChart3,
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { useInventoryStore } from '@/store/useInventoryStore';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import type { ABCClass, Inventory } from '@/types';

const abcClassColors: Record<ABCClass, { bg: string; text: string; border: string; label: string }> = {
  A: {
    bg: 'bg-danger/10',
    text: 'text-danger',
    border: 'border-danger/30',
    label: 'A类 - 高价值',
  },
  B: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
    label: 'B类 - 中价值',
  },
  C: {
    bg: 'bg-primary-500/10',
    text: 'text-primary-500',
    border: 'border-primary-500/30',
    label: 'C类 - 低价值',
  },
};

type ABCFilter = 'all' | ABCClass;

export default function InventoryPage() {
  const { canAccess } = usePermission();
  const { inventory, loading, fetchInventory } = useInventoryStore();
  const [abcFilter, setAbcFilter] = useState<ABCFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (canAccess('leader')) {
      fetchInventory();
    }
  }, [canAccess, fetchInventory]);

  const categories = useMemo(() => {
    const cats = new Set(inventory.map((i) => i.category));
    return ['all', ...Array.from(cats)];
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (abcFilter !== 'all' && item.abcClass !== abcFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      return true;
    });
  }, [inventory, abcFilter, categoryFilter]);

  const lowStockCount = useMemo(
    () => inventory.filter((i) => i.quantity < i.safeStock).length,
    [inventory]
  );
  const totalSKU = inventory.length;
  const totalQuantity = useMemo(
    () => inventory.reduce((sum, i) => sum + i.quantity, 0),
    [inventory]
  );
  const aClassCount = inventory.filter((i) => i.abcClass === 'A').length;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-success" />
            库存监控
          </h1>
          <p className="text-dark-400 mt-1">实时监控库存状态与安全库存预警</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="SKU总数"
          value={totalSKU}
          unit="个"
          icon={Package}
          iconColor="text-primary-500"
          glowColor="#3B82F6"
        />
        <StatCard
          title="库存总量"
          value={totalQuantity.toLocaleString()}
          unit="件"
          icon={BarChart3}
          iconColor="text-accent-500"
          glowColor="#F97316"
        />
        <StatCard
          title="低于安全库存"
          value={lowStockCount}
          unit="个"
          icon={ShieldAlert}
          iconColor="text-danger"
          glowColor="#EF4444"
        />
        <StatCard
          title="A类商品"
          value={aClassCount}
          unit="个"
          icon={Layers}
          iconColor="text-warning"
          glowColor="#F59E0B"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-dark-700 bg-dark-800/30">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <span className="text-sm text-dark-400">筛选:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-dark-500">ABC分类:</span>
          {(['all', 'A', 'B', 'C'] as ABCFilter[]).map((abc) => (
            <button
              key={abc}
              onClick={() => setAbcFilter(abc)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all border',
                abcFilter === abc
                  ? 'bg-primary-500/20 text-primary-500 border-primary-500/50'
                  : 'bg-dark-700/50 text-dark-400 border-dark-600 hover:text-white hover:border-dark-500'
              )}
            >
              {abc === 'all' ? '全部' : `${abc}类`}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-dark-700 hidden sm:block" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-dark-500">商品类别:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 px-3 rounded-md bg-dark-700 border border-dark-600 text-sm text-dark-200 focus:outline-none focus:border-primary-500/50"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '全部类别' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-dark-500">
          <span>共 <span className="text-dark-200 font-medium">{filteredInventory.length}</span> 条记录</span>
          {lowStockCount > 0 && (
            <span className="flex items-center gap-1 text-danger">
              <span className="w-1.5 h-1.5 rounded-full bg-danger animate-breathe" />
              {lowStockCount} 个库存预警
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredInventory.map((item: Inventory) => {
            const isLowStock = item.quantity < item.safeStock;
            const stockPercent = Math.min(100, Math.round((item.quantity / item.safeStock) * 100));
            const abcConfig = abcClassColors[item.abcClass];

            return (
              <div
                key={item.id}
                className={cn(
                  'relative rounded-xl border p-5 transition-all duration-300 overflow-hidden',
                  'bg-dark-800/50 hover:bg-dark-800',
                  isLowStock
                    ? 'border-danger/50 hover:border-danger'
                    : 'border-dark-700 hover:border-dark-600'
                )}
              >
                {isLowStock && (
                  <>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-danger/5 animate-breathe" />
                    </div>
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger" />
                      </span>
                    </div>
                  </>
                )}

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{item.skuName}</div>
                      <div className="text-xs text-dark-500 mt-0.5 font-mono">{item.skuId}</div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold border',
                        abcConfig.bg,
                        abcConfig.text,
                        abcConfig.border
                      )}
                    >
                      {item.abcClass}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-500 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        库存
                      </span>
                      <span
                        className={cn(
                          'font-bold',
                          isLowStock ? 'text-danger' : 'text-white'
                        )}
                      >
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-500 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        安全库存
                      </span>
                      <span className="text-dark-300">{item.safeStock}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        库位
                      </span>
                      <span className="text-dark-200 font-mono text-xs">{item.location}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-dark-500">库存健康度</span>
                      <span className={cn(isLowStock ? 'text-danger' : 'text-success')}>
                        {stockPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-dark-700 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          isLowStock
                            ? 'bg-gradient-to-r from-danger to-danger/70'
                            : stockPercent < 150
                            ? 'bg-gradient-to-r from-warning to-warning/70'
                            : 'bg-gradient-to-r from-success to-success/70'
                        )}
                        style={{ width: `${Math.min(100, stockPercent)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-dark-700/50">
                    <div className="text-xs text-dark-500">{item.category}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredInventory.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-dark-500">
              <Package className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-sm">没有符合筛选条件的库存数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
