import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import api from '../api/client';
import type { ShoppingCartItem } from '../types';
import { formatPrice } from '../lib/utils';

export default function UserCart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ShoppingCartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const data = await api.get('/user/shoppingCart/list') as unknown as ShoppingCartItem[];
      setItems(data || []);
    } catch {
      console.warn('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  const handleSub = async (item: ShoppingCartItem) => {
    try {
      await api.post('/user/shoppingCart/sub', {
        dishId: item.dishId,
        setmealId: item.setmealId,
        dishFlavor: item.dishFlavor,
      });
      fetchCart();
    } catch {
      console.warn('Failed to remove item');
    }
  };

  const handleAdd = async (item: ShoppingCartItem) => {
    try {
      await api.post('/user/shoppingCart/add', {
        dishId: item.dishId,
        setmealId: item.setmealId,
        dishFlavor: item.dishFlavor,
      });
      fetchCart();
    } catch {
      console.warn('Failed to add item');
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/user/shoppingCart/clean');
      setItems([]);
    } catch {
      console.warn('Failed to clear cart');
    }
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalCount = items.reduce((sum, i) => sum + (i.number || 0), 0);

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl mb-3"></div>)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">购物车</h1>
        <div className="py-20 text-center text-gray-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
          <p>购物车空空如也</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">购物车 ({totalCount})</h1>
        <button onClick={handleClear} className="text-xs text-gray-400 flex items-center gap-1">
          <Trash2 size={12} /> 清空
        </button>
      </div>

      <div className="space-y-3 mb-20">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
              {item.image ? (
                <img src={item.image} alt="" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <ShoppingCart size={20} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">{item.name}</div>
              {item.dishFlavor && <div className="text-xs text-gray-400 mt-0.5">{item.dishFlavor}</div>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[#ffc200] font-bold">{formatPrice(item.amount)}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleSub(item)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#ffc200] hover:text-[#ffc200]">
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold w-5 text-center">{item.number}</span>
                  <button onClick={() => handleAdd(item)} className="w-6 h-6 rounded-full bg-[#ffc200] flex items-center justify-center text-white">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 flex items-center justify-between z-40">
        <div>
          <div className="text-xs text-gray-400">合计</div>
          <div className="text-xl font-black text-[#ffc200]">{formatPrice(totalAmount)}</div>
        </div>
        <button onClick={() => navigate('/user/checkout')} className="bg-[#ffc200] text-[#343744] font-bold px-8 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-[#ffc200]/20">
          去结算 <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
