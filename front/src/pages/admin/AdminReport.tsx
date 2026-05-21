import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cn } from '../../lib/utils';
import api from '../../api/client';

export default function AdminReport() {
  const [turnover, setTurnover] = useState<{ name: string; amount: number }[]>([]);
  const [users, setUsers] = useState<{ name: string; total: number; news: number }[]>([]);
  const [orders, setOrders] = useState<{ name: string; total: number; valid: number }[]>([]);
  const [top10, setTop10] = useState<{ name: string; count: number }[]>([]);
  const [active, setActive] = useState<'turnover' | 'users' | 'orders' | 'top10'>('turnover');

  useEffect(() => { fetchReport(); }, []);

  const fetchReport = async () => {
    const begin = new Date();
    begin.setDate(begin.getDate() - 30);
    const be = begin.toISOString().slice(0, 10);
    const en = new Date().toISOString().slice(0, 10);
    try {
      const [tRes, uRes, oRes, topRes] = await Promise.allSettled([
        api.get('/admin/report/turnoverStatistics', { params: { begin: be, end: en } }),
        api.get('/admin/report/userStatistics', { params: { begin: be, end: en } }),
        api.get('/admin/report/ordersStatistics', { params: { begin: be, end: en } }),
        api.get('/admin/report/top10', { params: { begin: be, end: en } }),
      ]);
      const extract = (res: any): any => res.status === 'fulfilled' ? res.value : null;
      const t = extract(tRes); if (t?.dateList) setTurnover(t.dateList.map((d: string, i: number) => ({ name: d.slice(5), amount: Number(t.turnoverList?.[i]) || 0 })));
      const u = extract(uRes); if (u?.dateList) setUsers(u.dateList.map((d: string, i: number) => ({ name: d.slice(5), total: Number(u.totalUserList?.[i]) || 0, news: Number(u.newUserList?.[i]) || 0 })));
      const o = extract(oRes); if (o?.dateList) setOrders(o.dateList.map((d: string, i: number) => ({ name: d.slice(5), total: Number(o.orderCountList?.[i]) || 0, valid: Number(o.validOrderCountList?.[i]) || 0 })));
      const top = extract(topRes); if (top?.nameList) setTop10(top.nameList.map((n: string, i: number) => ({ name: n, count: Number(top.numberList?.[i]) || 0 })));
    } catch { console.warn('Report fetch failed'); }
  };

  const tabs = [
    { key: 'turnover' as const, label: '营业额' },
    { key: 'users' as const, label: '用户' },
    { key: 'orders' as const, label: '订单' },
    { key: 'top10' as const, label: '销量Top10' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-bold">数据统计</h1>
          <button onClick={() => api.get('/admin/report/export')} className="bg-[#ffc200] text-[#343744] px-4 py-2 rounded-lg font-bold text-sm">导出报表</button>
        </div>
        <div className="p-6">
          <div className="flex gap-2 mb-6">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActive(t.key)}
                className={cn("px-4 py-2 rounded-lg text-sm font-bold", active === t.key ? "bg-[#ffc200] text-[#343744]" : "bg-gray-100 text-gray-500")}>{t.label}</button>
            ))}
          </div>
          <div className="h-[400px] w-full">
            {active === 'turnover' && (
              <ResponsiveContainer><AreaChart data={turnover}><defs><linearGradient id="c1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffc200" stopOpacity={0.3}/><stop offset="95%" stopColor="#ffc200" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 11}} /><YAxis tick={{fontSize: 11}} /><Tooltip /><Area type="monotone" dataKey="amount" stroke="#ffc200" strokeWidth={2} fill="url(#c1)" /></AreaChart></ResponsiveContainer>
            )}
            {active === 'users' && (
              <ResponsiveContainer><LineChart data={users}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 11}} /><YAxis tick={{fontSize: 11}} /><Tooltip /><Line type="monotone" dataKey="total" stroke="#ffc200" strokeWidth={2} name="总用户" /><Line type="monotone" dataKey="news" stroke="#34d399" strokeWidth={2} name="新增" /></LineChart></ResponsiveContainer>
            )}
            {active === 'orders' && (
              <ResponsiveContainer><LineChart data={orders}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 11}} /><YAxis tick={{fontSize: 11}} /><Tooltip /><Line type="monotone" dataKey="total" stroke="#ffc200" strokeWidth={2} name="订单数" /><Line type="monotone" dataKey="valid" stroke="#34d399" strokeWidth={2} name="有效单" /></LineChart></ResponsiveContainer>
            )}
            {active === 'top10' && (
              <ResponsiveContainer><BarChart data={top10} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{fontSize: 11}} /><YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11}} /><Tooltip /><Bar dataKey="count" fill="#ffc200" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
