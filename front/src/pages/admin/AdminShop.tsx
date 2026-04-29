import { useState, useEffect } from 'react';
import { Store, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../api/client';

export default function AdminShop() {
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      const data = await api.get('/admin/shop/status') as unknown as number;
      setStatus(data);
    } catch { console.warn('Fetch shop status failed'); }
    finally { setLoading(false); }
  };

  const toggle = async () => {
    try {
      const newStatus = status === 1 ? 0 : 1;
      await api.put(`/admin/shop/${newStatus}`);
      setStatus(newStatus);
    } catch { console.warn('Toggle failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-xl font-bold mb-8">店铺设置</h1>
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store size={40} className={status === 1 ? 'text-[#ffc200]' : 'text-gray-300'} />
            </div>
            <div className="text-lg font-black mb-2">
              {loading ? '加载中...' : status === 1 ? '🟢 营业中' : '⚫ 已打烊'}
            </div>
            <button onClick={toggle} disabled={loading || status == null}
              className="px-8 py-3 bg-[#ffc200] text-[#343744] font-black rounded-xl shadow-lg hover:brightness-95 transition-all flex items-center gap-2 mx-auto">
              {status === 1 ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              切换营业状态
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
