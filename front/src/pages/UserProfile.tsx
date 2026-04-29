import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Shield, LogOut, ChevronRight } from 'lucide-react';

interface ProfileInfo {
  id: number;
  name: string;
  userName: string;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('sky_user');
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sky_token');
    localStorage.removeItem('sky_user');
    navigate('/login', { replace: true });
  };

  if (!profile) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl mb-4"></div>
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-200 rounded-xl mb-3"></div>)}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">个人中心</h1>

      {/* Avatar & Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#ffc200] rounded-full flex items-center justify-center text-white text-2xl font-black shadow-md">
            {profile.name?.charAt(0) || '用'}
          </div>
          <div>
            <div className="text-lg font-bold">{profile.name || profile.userName}</div>
            <div className="text-sm text-gray-400">ID: {profile.id}</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {[
          { icon: User, label: '用户名', value: profile.userName },
          { icon: Shield, label: '账号ID', value: String(profile.id) },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center justify-between px-4 py-4 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <item.icon size={18} className="text-gray-400" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{item.value}</span>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-4 bg-white rounded-2xl shadow-sm border border-red-100 text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
      >
        <LogOut size={18} />
        退出登录
      </button>
    </div>
  );
}
