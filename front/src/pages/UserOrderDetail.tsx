import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, RefreshCw, Ban, CreditCard, ShoppingCart } from 'lucide-react';
import api from '../api/client';
import { ORDER_STATUS, type OrderVO, type OrderDetail } from '../types';
import { formatPrice, formatDate } from '../lib/utils';

const statusClass = (s: number) => {
  const map: Record<number, string> = { 1: 'text-orange-500', 2: 'text-blue-500', 3: 'text-cyan-500', 4: 'text-purple-500', 5: 'text-green-500', 6: 'text-gray-400' };
  return map[s] || 'text-gray-400';
};

export default function UserOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/user/order/orderDetail/${id}`) as unknown as OrderVO;
      setOrder(data);
    } catch { console.warn('Failed to fetch order detail'); }
    finally { setLoading(false); }
  };

  const doAction = async (actionName: string, fn: () => Promise<void>) => {
    setActing(actionName);
    try { await fn(); await fetchOrder(); } catch { console.warn('Action failed'); }
    finally { setActing(''); }
  };

  const handlePay = async () => {
    if (!order) return;
    setActing('pay');
    try {
      await api.put('/user/order/payment', { orderNumber: order.number, payMethod: 1 });
      await fetchOrder();
    } catch { console.warn('Payment failed'); }
    finally { setActing(''); }
  };

  const handleCancel = async () => {
    if (!order) return;
    setCancelOpen(false);
    setActing('cancel');
    try {
      await api.put(`/user/order/cancel/${order.id}`);
      await fetchOrder();
    } catch { console.warn('Cancel failed'); }
    finally { setActing(''); }
  };

  const handleRepetition = async () => {
    if (!order) return;
    setActing('repetition');
    try {
      await api.post(`/user/order/repetition/${order.id}`);
      navigate('/user/cart', { replace: true });
    } catch { console.warn('Repetition failed'); }
    finally { setActing(''); }
  };

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-40 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="p-4 text-center text-gray-400 py-20">订单不存在</div>;
  }

  const detailList = order.orderDetailList || [];

  return (
    <div className="p-4 pb-20">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-500"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">订单详情</h1>
      </header>

      {/* Status Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center mb-4">
        <div className={`text-2xl font-black ${statusClass(order.status)}`}>
          {ORDER_STATUS[order.status] || '未知'}
        </div>
        <div className="text-xs text-gray-400 mt-1">订单号 #{order.number}</div>
      </div>

      {/* Dishes */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <h3 className="font-bold text-sm mb-3">菜品信息</h3>
        {detailList.length > 0 ? (
          <div className="space-y-2">
            {detailList.map((d: OrderDetail, idx: number) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {d.image ? (
                    <img src={d.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart size={14} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{d.name}</div>
                  {d.dishFlavor && <div className="text-xs text-gray-400">{d.dishFlavor}</div>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">x{d.number}</div>
                  <div className="text-sm font-bold">¥{Number(d.amount).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-600 whitespace-pre-wrap">{order.orderDishes || '暂无菜品信息'}</div>
        )}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <span className="text-sm text-gray-500">实付金额</span>
          <span className="text-xl font-black text-[#ffc200]">{formatPrice(order.amount)}</span>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-2">
        <h3 className="font-bold text-sm mb-3">配送信息</h3>
        <div className="flex justify-between text-sm"><span className="text-gray-400">收货人</span><span className="font-medium">{order.consignee}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">手机号</span><span className="font-medium">{order.phone}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">地址</span><span className="font-medium text-right max-w-48">{order.address}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">下单时间</span><span className="font-medium">{formatDate(order.orderTime)}</span></div>
      </div>

      {/* Actions */}
      <div className="fixed bottom-14 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 flex gap-3 z-40">
        {order.status === 1 && (
          <>
            <button onClick={handlePay} disabled={acting !== ''}
              className="flex-1 py-3 rounded-full bg-[#ffc200] text-[#343744] font-bold text-sm flex items-center justify-center gap-1">
              <CreditCard size={14} /> {acting === 'pay' ? '支付中...' : '立即支付'}
            </button>
            <button onClick={() => setCancelOpen(true)} disabled={acting !== ''}
              className="flex-1 py-3 rounded-full border border-gray-200 text-gray-500 font-bold text-sm flex items-center justify-center gap-1">
              <Ban size={14} /> 取消订单
            </button>
          </>
        )}
        {order.status <= 3 && order.status >= 2 && (
          <button onClick={() => doAction('reminder', () => api.get(`/user/order/reminder/${order.id}`))} disabled={acting !== ''}
            className="flex-1 py-3 rounded-full bg-[#ffc200] text-[#343744] font-bold text-sm flex items-center justify-center gap-1">
            <Clock size={14} /> {acting === 'reminder' ? '处理中...' : '催单'}
          </button>
        )}
        {order.status === 5 && (
          <button onClick={handleRepetition} disabled={acting !== ''}
            className="flex-1 py-3 rounded-full bg-[#ffc200] text-[#343744] font-bold text-sm flex items-center justify-center gap-1">
            <RefreshCw size={14} /> {acting === 'repetition' ? '处理中...' : '再来一单'}
          </button>
        )}
        <button onClick={() => navigate(-1)} className="flex-1 py-3 rounded-full bg-gray-100 text-gray-500 font-bold text-sm">返回</button>
      </div>

      {/* Cancel Confirm Dialog */}
      {cancelOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setCancelOpen(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-2">确认取消订单？</h2>
            <p className="text-sm text-gray-400 mb-6">取消后无法恢复，确定要取消该订单吗？</p>
            <div className="flex gap-2">
              <button onClick={handleCancel} disabled={acting !== ''}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-full text-sm">
                {acting === 'cancel' ? '取消中...' : '确认取消'}
              </button>
              <button onClick={() => setCancelOpen(false)}
                className="flex-1 bg-gray-100 text-gray-500 font-bold py-3 rounded-full text-sm">返回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
