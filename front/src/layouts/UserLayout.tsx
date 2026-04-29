import { NavLink, Outlet } from 'react-router-dom';
import { Home, ClipboardList, ShoppingCart, User as UserIcon, MessageCircle, Search } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: Home, label: '首页', path: '/user' },
  { icon: Search, label: '点餐', path: '/user/browse' },
  { icon: MessageCircle, label: 'AI助理', path: '/user/ai' },
  { icon: ShoppingCart, label: '购物车', path: '/user/cart' },
  { icon: ClipboardList, label: '订单', path: '/user/orders' },
  { icon: UserIcon, label: '我的', path: '/user/profile' },
];

export default function UserLayout() {
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
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-0.5 transition-colors px-1",
              isActive ? "text-[#ffc200]" : "text-gray-400"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
