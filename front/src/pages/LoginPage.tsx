import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChefHat, LogIn, User, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import type { LoginResponse } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const loginUrl = isAdmin ? '/admin/employee/login' : '/user/user/login';
      const data = await api.post(loginUrl, { username, password }) as unknown as LoginResponse;
      
      localStorage.setItem('sky_token', data.token);
      localStorage.setItem('sky_user', JSON.stringify({ id: data.id, name: data.name, userName: data.userName }));
      
      navigate(isAdmin ? '/admin' : '/user', { replace: true });
    } catch (err: any) {
      setError(err?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#343744] to-[#1a1d26] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#ffc200] rounded-2xl mb-4 shadow-lg">
            {isAdmin ? <ShieldCheck size={32} className="text-[#343744]" /> : <ChefHat size={32} className="text-[#343744]" />}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isAdmin ? '苍穹外卖管理端' : '苍穹外卖'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isAdmin ? '管理员登录' : '欢迎回来，享受美食'}
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 shadow-2xl space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">用户名</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#ffc200]/50 focus:border-[#ffc200] transition-all outline-none"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">密码</label>
            <div className="relative">
              <LogIn size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#ffc200]/50 focus:border-[#ffc200] transition-all outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-medium rounded-xl p-3 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            className="w-full bg-[#ffc200] text-[#343744] font-bold py-3 rounded-xl hover:brightness-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ffc200]/20"
          >
            {loading ? '登录中...' : '登 录'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/login' : '/admin/login')}
              className="text-xs text-gray-400 hover:text-[#ffc200] transition-colors"
            >
              {isAdmin ? '切换到用户登录' : '切换到管理端登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
