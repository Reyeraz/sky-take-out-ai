import { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import api from '../api/client';

export default function UserHome() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [shopStatus, setShopStatus] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sky_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setUserName(user.name || user.userName || '');
      } catch {}
    }
    fetchShopStatus();
    setLoading(false);
  }, []);

  const fetchShopStatus = async () => {
    try {
      const status = await api.get('/user/shop/status') as unknown as number;
      setShopStatus(status);
    } catch {}
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-40 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">
            {userName ? `${userName}，中午好` : '中午好'}
          </div>
          <div className="font-bold text-gray-700 text-sm">欢迎使用苍穹外卖</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${shopStatus === 1 ? 'bg-[#ffc200] text-[#343744]' : 'bg-gray-300 text-gray-500'}`}>
          {shopStatus == null ? '--' : shopStatus === 1 ? '营业中' : '休息中'}
        </div>
      </header>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
        <Flame size={48} className="mx-auto mb-3 text-[#ffc200]/30" />
        <h3 className="font-bold text-gray-700">欢迎光临</h3>
        <p className="text-sm text-gray-400 mt-1">点击下方「点餐」或「购物车」开始点餐</p>
      </div>
    </div>
  );
}
