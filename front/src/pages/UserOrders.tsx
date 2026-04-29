import { useState, useEffect } from 'react';
import { ClipboardList, ChevronRight } from 'lucide-react';
import api from '../api/client';
import type { OrderVO } from '../types';
import { ORDER_STATUS, type PageResult } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

export default function UserOrders() {
  const [orders, setOrders] = useState<OrderVO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get('/user/order/historyOrders', {
        params: { page: 1, pageSize: 50 },
      }) as unknown as PageResult<OrderVO>;
      setOrders(data.records || []);
    } catch {
      console.warn('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const statusClass = (status: number) => {
    switch (status) {
      case 1: return 'text-orange-500';
      case 2: return 'text-blue-500';
      case 3: return 'text-cyan-500';
      case 4: return 'text-purple-500';
      case 5: return 'text-green-500';
      case 6: return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl mb-3"></div>)}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">订单列表</h1>
        <div className="py-20 text-center text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
          <p>暂无历史订单</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">我的订单</h1>
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">订单号 #{order.number}</span>
              <span className={`text-xs font-bold ${statusClass(order.status)}`}>
                {ORDER_STATUS[order.status] || '未知'}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2 line-clamp-1">
              {order.orderDishes || '暂无菜品信息'}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#ffc200] font-bold">{formatPrice(order.amount)}</div>
                <div className="text-xs text-gray-400 mt-0.5">{formatDate(order.orderTime)}</div>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
