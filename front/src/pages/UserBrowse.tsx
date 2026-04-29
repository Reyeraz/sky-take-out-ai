import { useState, useEffect } from 'react';
import { Search, Flame, ShoppingCart, ChevronLeft } from 'lucide-react';
import api from '../api/client';
import type { Category, DishVO, Setmeal, DishItemVO } from '../types';
import { cn, formatPrice } from '../lib/utils';

export default function UserBrowse() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<DishVO[]>([]);
  const [setmeals, setSetmeals] = useState<Setmeal[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'dish' | 'setmeal'>('dish');
  const [setmealDetail, setSetmealDetail] = useState<{ id: number; items: DishItemVO[]; name: string } | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const type = tab === 'dish' ? 1 : 2;
      const data = await api.get('/user/category/list', { params: { type } }) as unknown as Category[];
      setCategories(data || []);
      if (data?.length > 0) {
        setActiveCat(data[0].id);
        if (tab === 'dish') fetchDishes(data[0].id);
        else fetchSetmeals(data[0].id);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setDishes([]);
    setSetmeals([]);
    fetchCategories();
  }, [tab]);

  const fetchDishes = async (categoryId: number | null) => {
    if (categoryId == null) return;
    setLoading(true);
    try {
      const data = await api.get('/user/dish/list', { params: { categoryId } }) as unknown as DishVO[];
      setDishes(data || []);
    } catch {
      console.warn('Failed to fetch dishes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSetmeals = async (categoryId: number | null) => {
    if (categoryId == null) return;
    setLoading(true);
    try {
      const data = await api.get('/user/setmeal/list', { params: { categoryId } }) as unknown as Setmeal[];
      setSetmeals(data || []);
    } catch {
      console.warn('Failed to fetch setmeals');
    } finally {
      setLoading(false);
    }
  };

  const switchCat = (id: number) => {
    setActiveCat(id);
    if (tab === 'dish') fetchDishes(id);
    else fetchSetmeals(id);
  };

  const handleAddCart = async (dish: DishVO) => {
    try {
      await api.post('/user/shoppingCart/add', { dishId: dish.id });
    } catch {
      console.warn('Failed to add to cart');
    }
  };

  const handleAddSetmealCart = async (setmeal: Setmeal) => {
    try {
      await api.post('/user/shoppingCart/add', { setmealId: setmeal.id });
    } catch {
      console.warn('Failed to add setmeal to cart');
    }
  };

  const viewSetmealDetail = async (setmeal: Setmeal) => {
    try {
      const items = await api.get(`/user/setmeal/dish/${setmeal.id}`) as unknown as DishItemVO[];
      setSetmealDetail({ id: setmeal.id, items, name: setmeal.name });
    } catch {
      console.warn('Failed to fetch setmeal detail');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-black">点餐</h1>
          <div className="relative flex-1 max-w-xs ml-4">
            <input placeholder="搜索菜品..." className="w-full bg-gray-100 rounded-full py-1.5 pl-9 pr-3 text-xs focus:ring-1 focus:ring-[#ffc200]/50 outline-none" />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('dish')} className={cn("px-3 py-1 rounded-full text-xs font-bold", tab === 'dish' ? "bg-[#ffc200] text-[#343744]" : "bg-gray-100 text-gray-500")}>菜品</button>
          <button onClick={() => setTab('setmeal')} className={cn("px-3 py-1 rounded-full text-xs font-bold", tab === 'setmeal' ? "bg-[#ffc200] text-[#343744]" : "bg-gray-100 text-gray-500")}>套餐</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Category Sidebar */}
        <aside className="w-20 bg-gray-50 overflow-y-auto flex-shrink-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => switchCat(cat.id)}
              className={cn(
                "w-full py-3 px-1 text-xs font-medium text-center transition-colors",
                activeCat === cat.id
                  ? "bg-white text-[#ffc200] font-bold border-l-3 border-[#ffc200]"
                  : "text-gray-500 hover:bg-white/50"
              )}
            >
              {cat.name}
            </button>
          ))}
        </aside>

        {/* Dish/Setmeal List */}
        <main className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}
            </div>
          ) : tab === 'dish' ? (
            dishes.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <Flame size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">暂无菜品</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dishes.map(dish => (
                  <div key={dish.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {dish.image ? (
                        <img src={dish.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Flame size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-sm">{dish.name}</div>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{dish.description || ''}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[#ffc200] font-black text-sm">{formatPrice(dish.price)}</span>
                        <button
                          onClick={() => handleAddCart(dish)}
                          className="w-7 h-7 bg-[#ffc200] rounded-full flex items-center justify-center text-white shadow-sm hover:brightness-95"
                        >
                          <ShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            setmeals.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <Flame size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">暂无套餐</p>
              </div>
            ) : (
              <div className="space-y-3">
                {setmeals.map(s => (
                  <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-3 flex gap-3 shadow-sm hover:shadow-md transition-shadow" onClick={() => viewSetmealDetail(s)}>
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {s.image ? (
                        <img src={s.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Flame size={24} className="text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-sm">{s.name}</div>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{s.description || ''}</p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[#ffc200] font-black text-sm">{formatPrice(s.price)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAddSetmealCart(s); }}
                          className="w-7 h-7 bg-[#ffc200] rounded-full flex items-center justify-center text-white shadow-sm hover:brightness-95"
                        >
                          <ShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </main>
      </div>

      {/* Setmeal Detail Modal */}
      {setmealDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setSetmealDetail(null)}>
          <div className="bg-white rounded-t-2xl p-6 w-full max-w-md mx-auto shadow-2xl max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h2 className="text-lg font-bold mb-1">{setmealDetail.name}</h2>
            <p className="text-xs text-gray-400 mb-4">套餐包含以下菜品</p>
            <div className="space-y-3">
              {setmealDetail.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <Flame size={16} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm">{item.name}</div>
                    {item.description && <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>}
                  </div>
                  <span className="text-xs text-gray-400">×{item.copies}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
