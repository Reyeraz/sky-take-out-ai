import { ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Utensils, 
  Package, 
  ClipboardList, 
  Store, 
  PieChart, 
  Sparkles,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import api from '../api/client';

const navItems = [
  { icon: LayoutDashboard, label: '工作台', path: '/admin' },
  { icon: Users, label: '员工管理', path: '/admin/employee' },
  { icon: Layers, label: '分类管理', path: '/admin/category' },
  { icon: Utensils, label: '菜品管理', path: '/admin/dish' },
  { icon: Package, label: '套餐管理', path: '/admin/setmeal' },
  { icon: ClipboardList, label: '订单管理', path: '/admin/order' },
  { icon: Store, label: '店铺设置', path: '/admin/shop' },
  { icon: PieChart, label: '数据统计', path: '/admin/report' },
  { icon: Sparkles, label: 'AI助手', path: '/admin/ai' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/admin/employee/logout');
    } catch {}
    localStorage.removeItem('sky_token');
    localStorage.removeItem('sky_user');
    navigate('/admin/login', { replace: true });
  };
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#343744] text-white flex flex-col">
        <div className="p-6 text-xl font-bold tracking-tighter border-b border-gray-700 flex items-center gap-2">
          <div className="w-8 h-8 bg-[#ffc200] rounded-lg flex items-center justify-center text-[#343744]">苍</div>
          苍穹外卖管理端
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-[#4a4e5e]",
                isActive ? "bg-[#ffc200] text-[#343744] hover:bg-[#ffc200]" : "text-gray-300"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-gray-300 w-full hover:bg-[#4a4e5e] transition-colors">
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="font-semibold text-gray-700">苍穹外卖 - 高效餐饮管理</div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
            <span>管理员: Admin</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">管</div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
