import { useState, useEffect } from 'react';
import { TrendingUp, Users, ShoppingBag, DollarSign, BrainCircuit, ChevronRight, RefreshCw, ClipboardList, UtensilsCrossed, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import api from '../api/client';
import type { AiSalesAnalysis, BusinessData, OrderOverViewVO, DishOverViewVO, SetmealOverViewVO, OrderStatisticsVO } from '../types';

const chartData = [
  { name: '04/22', turnover: 1200 },
  { name: '04/23', turnover: 1900 },
  { name: '04/24', turnover: 1500 },
  { name: '04/25', turnover: 2500 },
  { name: '04/26', turnover: 2200 },
  { name: '04/27', turnover: 3000 },
  { name: '04/28', turnover: 2580 },
];

export default function AdminDashboard() {
  const [analysis, setAnalysis] = useState<AiSalesAnalysis | null>(null);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [orderOverview, setOrderOverview] = useState<OrderOverViewVO | null>(null);
  const [dishOverview, setDishOverview] = useState<DishOverViewVO | null>(null);
  const [setmealOverview, setSetmealOverview] = useState<SetmealOverViewVO | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStatisticsVO | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(true);

  useEffect(() => {
    fetchBusinessData();
    fetchAiAnalysis();
    fetchWorkspaceOverview();
    fetchOrderStatistics();
  }, []);

  const fetchBusinessData = async () => {
    setLoadingBusiness(true);
    try {
      const data = await api.get('/admin/workspace/businessData') as unknown as BusinessData;
      setBusinessData(data);
    } catch {
      console.warn('Failed to fetch business data');
    } finally {
      setLoadingBusiness(false);
    }
  };

  const fetchWorkspaceOverview = async () => {
    try {
      const [orders, dishes, setmeals] = await Promise.allSettled([
        api.get('/admin/workspace/overviewOrders'),
        api.get('/admin/workspace/overviewDishes'),
        api.get('/admin/workspace/overviewSetmeals'),
      ]);
      if (orders.status === 'fulfilled') setOrderOverview(orders.value as unknown as OrderOverViewVO);
      if (dishes.status === 'fulfilled') setDishOverview(dishes.value as unknown as DishOverViewVO);
      if (setmeals.status === 'fulfilled') setSetmealOverview(setmeals.value as unknown as SetmealOverViewVO);
    } catch {
      console.warn('Failed to fetch workspace overview');
    }
  };

  const fetchOrderStatistics = async () => {
    try {
      const data = await api.get('/admin/order/statistics') as unknown as OrderStatisticsVO;
      setOrderStats(data);
    } catch {
      console.warn('Failed to fetch order statistics');
    }
  };

  const fetchAiAnalysis = async () => {
    setLoadingAnalysis(true);
    try {
      const data = await api.get('/admin/ai/sales-analysis', { params: { days: 7 } }) as unknown as AiSalesAnalysis;
      setAnalysis(data);
    } catch {
      console.warn('Failed to fetch AI analysis');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const stats = [
    { label: '今日营业额', value: businessData ? `￥${businessData.turnover.toFixed(2)}` : '--', icon: DollarSign, trend: '', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '成交订单数', value: businessData ? String(businessData.validOrderCount) : '--', icon: ShoppingBag, trend: '', color: 'text-green-600', bg: 'bg-green-50' },
    { label: '新增用户数', value: businessData ? String(businessData.newUsers) : '--', icon: Users, trend: '', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '平均客单价', value: businessData ? `￥${businessData.unitPrice.toFixed(2)}` : '--', icon: TrendingUp, trend: '', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">工作台</h1>
        <div className="text-sm text-gray-500 font-medium">
          {new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</div>
              <div className="text-2xl font-black mt-1 text-gray-900">
                {loadingBusiness ? <span className="text-gray-300">...</span> : stat.value}
              </div>
              {stat.trend && (
                <div className={cn("text-xs font-bold mt-2 flex items-center gap-1", stat.trend.startsWith('+') ? "text-green-500" : "text-red-500")}>
                  {stat.trend} <span className="text-gray-400 font-normal">vs 昨天</span>
                </div>
              )}
            </div>
            <div className={cn("p-3 rounded-xl", stat.bg)}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Workspace Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-blue-500" />
            <h3 className="font-bold text-sm">订单概览</h3>
          </div>
          {orderOverview ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">待接单</span><span className="font-bold text-orange-500">{orderOverview.waitingOrders}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">待派送</span><span className="font-bold text-purple-500">{orderOverview.deliveredOrders}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">已完成</span><span className="font-bold text-green-500">{orderOverview.completedOrders}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">已取消</span><span className="font-bold text-gray-400">{orderOverview.cancelledOrders}</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-100"><span className="text-gray-500">全部</span><span className="font-black">{orderOverview.allOrders}</span></div>
            </div>
          ) : <div className="text-gray-300 text-sm">加载中...</div>}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed size={18} className="text-green-500" />
            <h3 className="font-bold text-sm">菜品概览</h3>
          </div>
          {dishOverview ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">已启售</span><span className="font-bold text-green-500">{dishOverview.sold}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">已停售</span><span className="font-bold text-red-400">{dishOverview.discontinued}</span></div>
            </div>
          ) : <div className="text-gray-300 text-sm">加载中...</div>}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-orange-500" />
            <h3 className="font-bold text-sm">套餐概览</h3>
          </div>
          {setmealOverview ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">已启售</span><span className="font-bold text-green-500">{setmealOverview.sold}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">已停售</span><span className="font-bold text-red-400">{setmealOverview.discontinued}</span></div>
            </div>
          ) : <div className="text-gray-300 text-sm">加载中...</div>}
        </div>
      </div>

      {/* Order Statistics */}
      {orderStats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="text-xs text-gray-400 mb-1">待确认</div>
            <div className="text-2xl font-black text-orange-500">{orderStats.toBeConfirmed}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="text-xs text-gray-400 mb-1">已接单</div>
            <div className="text-2xl font-black text-blue-500">{orderStats.confirmed}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
            <div className="text-xs text-gray-400 mb-1">派送中</div>
            <div className="text-2xl font-black text-purple-500">{orderStats.deliveryInProgress}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold">营业额趋势 (近7天)</h2>
            <select className="bg-gray-50 border-none rounded-lg text-sm font-medium px-3 py-1 text-gray-600 focus:ring-0">
              <option>本周</option>
              <option>本月</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTurnover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffc200" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffc200" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#999', fontSize: 12}} />
                <Tooltip
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="turnover" stroke="#ffc200" strokeWidth={3} fillOpacity={1} fill="url(#colorTurnover)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-[#343744] p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BrainCircuit size={120} />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-dark">
              <BrainCircuit size={24} />
            </div>
            <h2 className="text-xl font-bold">AI 智能分析</h2>
            {loadingAnalysis && <RefreshCw size={16} className="animate-spin ml-auto" />}
          </div>

          <div className="flex-1 space-y-6">
            {analysis ? (
              <>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">销售洞察</div>
                  <p className="text-sm leading-relaxed">
                    {analysis.summary || '暂无数据'}
                  </p>
                </div>
                {analysis.highlights?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">亮点</div>
                    <ul className="text-sm space-y-1">
                      {analysis.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">●</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.warnings?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-red-400 uppercase tracking-widest">预警</div>
                    <ul className="text-sm space-y-1">
                      {analysis.warnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">●</span>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-gray-400">
                  {loadingAnalysis ? '正在分析销售数据...' : '点击下方按钮生成 AI 分析报告'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={fetchAiAnalysis}
            disabled={loadingAnalysis}
            className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl text-sm font-bold border border-white/10 disabled:opacity-50"
          >
            {loadingAnalysis ? <RefreshCw size={16} className="animate-spin" /> : <ChevronRight size={16} />}
            {loadingAnalysis ? '分析中...' : analysis ? '刷新分析报告' : '生成分析报告'}
          </button>
        </div>
      </div>
    </div>
  );
}
