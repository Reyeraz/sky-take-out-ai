import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, ShoppingCart, User as UserIcon, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../api/client';

const navItems = [
  { icon: Home, label: '首页', path: '/user' },
  { icon: Search, label: '点餐', path: '/user/browse' },
  { icon: ShoppingCart, label: '购物车', path: '/user/cart' },
  { icon: ClipboardList, label: '订单', path: '/user/orders' },
  { icon: UserIcon, label: '我的', path: '/user/profile' },
];

export function notifyCartChange() {
  window.dispatchEvent(new CustomEvent('cart-change'));
}

export default function UserLayout() {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    try {
      const data = await api.get('/user/shoppingCart/list') as unknown as any[];
      setCartCount(data?.reduce((sum: number, i: any) => sum + (i.number || 0), 0) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCartCount();
    window.addEventListener('cart-change', fetchCartCount);
    return () => window.removeEventListener('cart-change', fetchCartCount);
  }, [fetchCartCount]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto relative overflow-hidden shadow-2xl border-x border-gray-100">
      <div className="h-6 bg-white w-full sticky top-0 z-50"></div>

      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>

      <nav className="h-14 bg-white border-t border-gray-100 flex items-center justify-around fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-0.5 transition-colors px-1 relative",
              isActive ? "text-[#ffc200]" : "text-gray-400"
            )}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.path === '/user/cart' && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1 leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
