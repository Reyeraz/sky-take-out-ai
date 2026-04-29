import { useState, useEffect } from 'react';
import { Search, Check, X, Truck, Ban, RefreshCw, Eye, XCircle } from 'lucide-react';
import api from '../../api/client';
import type { OrderVO, PageResult, OrderDetail } from '../../types';
import { ORDER_STATUS } from '../../types';
import { formatPrice, formatDate } from '../../lib/utils';

const statusColors: Record<number, string> = { 1: 'text-orange-500 bg-orange-50', 2: 'text-blue-500 bg-blue-50', 3: 'text-cyan-500 bg-cyan-50', 4: 'text-purple-500 bg-purple-50', 5: 'text-green-500 bg-green-50', 6: 'text-gray-500 bg-gray-100' };

export default function AdminOrder() {
  const [data, setData] = useState<OrderVO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchStatus, setSearchStatus] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [detailOrder, setDetailOrder] = useState<OrderVO | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 10 };
      if (searchStatus) params.status = +searchStatus;
      if (searchNumber) params.number = searchNumber;
      const res = await api.get('/admin/order/conditionSearch', { params }) as unknown as PageResult<OrderVO>;
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { console.warn('Fetch failed'); }
    finally { setLoading(false); }
  };

  const action = async (fn: () => Promise<void>) => {
    try { await fn(); fetchData(); } catch { console.warn('Action failed'); }
  };

  const canConfirm = (s: number) => s === 2;
  const canDeliver = (s: number) => s === 3;
  const canComplete = (s: number) => s === 4;
  const canCancel = (s: number) => s === 1 || s === 2;

  const viewDetail = async (id: number) => {
    try {
      const data = await api.get(`/admin/order/details/${id}`) as unknown as OrderVO;
      setDetailOrder(data);
    } catch { console.warn('Failed to fetch order detail'); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) return;
    try {
      await api.put('/admin/order/rejection', { id: rejectId, rejectionReason: rejectReason });
      setRejectId(null);
      setRejectReason('');
      fetchData();
    } catch { console.warn('Rejection failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold mb-4">订单管理</h1>
          <div className="flex gap-3 flex-wrap">
            <select value={searchStatus} onChange={e => setSearchStatus(e.target.value)} className="border border-gray-200 rounded-lg py-2 px-3 text-sm">
              <option value="">全部状态</option>
              {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={searchNumber} onChange={e => setSearchNumber(e.target.value)} placeholder="订单号..." className="border border-gray-200 rounded-lg py-2 px-3 text-sm" />
            <button onClick={() => { setPage(1); fetchData(); }} className="bg-[#ffc200] text-[#343744] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1 hover:bg-[#ebb300]"><Search size={14} /> 搜索</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold">#订单号</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold">金额</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold">状态</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold">时间</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-4 font-medium">{row.number}</td>
                  <td className="px-4 py-4 font-medium">{formatPrice(row.amount)}</td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[row.status] || ''}`}>
                      {ORDER_STATUS[row.status] || '未知'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-gray-400">{formatDate(row.orderTime)}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-1 flex-wrap">
                      <button onClick={() => viewDetail(row.id)} className="p-1.5 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100" title="详情"><Eye size={14} /></button>
                      {canConfirm(row.status) && <button onClick={() => action(() => api.put('/admin/order/confirm', { id: row.id }))} className="p-1.5 bg-green-50 text-green-600 rounded-lg" title="接单"><Check size={14} /></button>}
                      {canDeliver(row.status) && <button onClick={() => action(() => api.put(`/admin/order/delivery/${row.id}`))} className="p-1.5 bg-purple-50 text-purple-600 rounded-lg" title="派送"><Truck size={14} /></button>}
                      {canComplete(row.status) && <button onClick={() => action(() => api.put(`/admin/order/complete/${row.id}`))} className="p-1.5 bg-green-50 text-green-600 rounded-lg" title="完成"><Check size={14} /></button>}
                      {canCancel(row.status) && <button onClick={() => action(() => api.put('/admin/order/cancel', { id: row.id, cancelReason: '管理员取消' }))} className="p-1.5 bg-red-50 text-red-500 rounded-lg" title="取消"><Ban size={14} /></button>}
                      {(row.status === 2) && <button onClick={() => { setRejectId(row.id); setRejectReason(''); }} className="p-1.5 bg-red-50 text-red-500 rounded-lg" title="拒单"><XCircle size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-400">共 {total} 条</span>
          <div className="flex gap-1">{Array.from({length: Math.ceil(total/10)},(_,i)=>i+1).map(p=><button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold ${p===page?'bg-[#ffc200] text-[#343744]':'bg-gray-100 text-gray-500'}`}>{p}</button>)}</div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDetailOrder(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">订单详情</h2>
              <button onClick={() => setDetailOrder(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">订单号</span><span className="font-bold">{detailOrder.number}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">状态</span><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[detailOrder.status] || ''}`}>{ORDER_STATUS[detailOrder.status] || '未知'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">金额</span><span className="font-bold">{formatPrice(detailOrder.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">收货人</span><span>{detailOrder.consignee}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">电话</span><span>{detailOrder.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">地址</span><span className="text-right max-w-[60%]">{detailOrder.address}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">下单时间</span><span>{formatDate(detailOrder.orderTime)}</span></div>
              {detailOrder.cancelReason && <div className="flex justify-between"><span className="text-gray-400">取消原因</span><span className="text-red-400">{detailOrder.cancelReason}</span></div>}
              {detailOrder.orderDetailList && detailOrder.orderDetailList.length > 0 && (
                <div>
                  <div className="text-gray-400 mb-2">菜品明细</div>
                  <div className="space-y-1">
                    {detailOrder.orderDetailList.map((d: OrderDetail, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs bg-gray-50 rounded-lg p-2">
                        <span>{d.name} ×{d.number}</span>
                        <span className="font-bold">¥{Number(d.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {rejectId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setRejectId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">拒单</h2>
            <label className="text-xs text-gray-400 mb-1 block">拒单原因</label>
            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="请输入拒单原因" className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm mb-4" />
            <div className="flex gap-2">
              <button onClick={handleReject} className="flex-1 bg-red-500 text-white font-bold py-2 rounded-lg text-sm">确认拒单</button>
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="flex-1 bg-gray-100 text-gray-500 font-bold py-2 rounded-lg text-sm">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
