import { useState, useEffect } from 'react';
import { Sparkles, Flame, ShoppingCart } from 'lucide-react';
import api from '../api/client';
import type { AiDailyVO, AiRecommendVO } from '../types';

export default function UserHome() {
  const [dailyData, setDailyData] = useState<AiDailyVO | null>(null);
  const [recommendations, setRecommendations] = useState<AiRecommendVO[]>([]);
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
    fetchData();
    fetchShopStatus();
  }, []);

  const fetchShopStatus = async () => {
    try {
      const status = await api.get('/user/shop/status') as unknown as number;
      setShopStatus(status);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dailyRes, recRes] = await Promise.allSettled([
        api.get('/user/ai/daily'),
        api.post('/user/ai/recommend'),
      ]);

      if (dailyRes.status === 'fulfilled') {
        setDailyData(dailyRes.value as unknown as AiDailyVO);
      }
      if (recRes.status === 'fulfilled') {
        setRecommendations(recRes.value as unknown as AiRecommendVO[]);
      }
    } catch (err) {
      console.error('Failed to fetch AI data:', err);
    } finally {
      setLoading(false);
    }
  };

  const displayedDishes = dailyData?.recommendations?.slice(0, 6) || recommendations.slice(0, 6);

  if (loading) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="h-40 bg-gray-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
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
          <div className="font-bold text-gray-700 text-sm">来探索今日推荐吧</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${shopStatus === 1 ? 'bg-[#ffc200] text-[#343744]' : 'bg-gray-300 text-gray-500'}`}>
          {shopStatus == null ? '--' : shopStatus === 1 ? '营业中' : '休息中'}
        </div>
      </header>

      {/* AI Daily Pick Banner */}
      {dailyData && (
        <div className="bg-gradient-to-r from-[#ffc200] to-[#ffd700] p-6 rounded-2xl text-[#343744] shadow-lg relative overflow-hidden">
          <div className="absolute top-2 right-2 opacity-20">
            <Sparkles size={60} />
          </div>
          <h2 className="text-xl font-black italic">TODAY'S AI PICK</h2>
          <p className="text-sm font-medium mt-1">{dailyData.slogan || '为您推荐：温暖你的胃'}</p>
          {dailyData.recommendations?.[0] && (
            <div className="mt-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-white/80 rounded-lg flex-shrink-0 shadow-sm flex items-center justify-center">
                {dailyData.recommendations[0].image ? (
                  <img src={dailyData.recommendations[0].image} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Flame size={24} className="text-[#ffc200]" />
                )}
              </div>
              <div>
                <div className="font-bold">{dailyData.recommendations[0].dishName}</div>
                <div className="text-sm">
                  ¥{dailyData.recommendations[0].price != null ? Number(dailyData.recommendations[0].price).toFixed(2) : '--'}
                </div>
                <div className="text-xs mt-0.5 text-[#343744]/60">{dailyData.recommendations[0].reason}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#ffc200]" />
          <h3 className="font-bold text-lg">AI 智能推荐</h3>
        </div>
        {displayedDishes.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Flame size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无推荐数据，请稍后再试</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayedDishes.map((dish, idx) => (
              <div key={dish.dishId || idx} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  {dish.image ? (
                    <img src={dish.image} alt={dish.dishName} className="w-full h-full object-cover" />
                  ) : (
                    <Flame size={40} className="text-[#ffc200]/40" />
                  )}
                </div>
                <div className="p-3">
                  <div className="font-bold text-sm">{dish.dishName}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{dish.reason}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[#ffc200] font-bold text-sm">
                      ¥{dish.price != null ? Number(dish.price).toFixed(2) : '--'}
                    </span>
                    <button className="w-6 h-6 bg-[#ffc200] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm hover:brightness-95 transition-all">
                      <ShoppingCart size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
