import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import api from '../../api/client';
import type { SetmealVO, PageResult, Category } from '../../types';

export default function AdminSetmeal() {
  const [data, setData] = useState<SetmealVO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', categoryId: 0, price: 0, description: '' });
  const [editing, setEditing] = useState<SetmealVO | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => { fetchData(); fetchCategories(); }, [page]);

  const fetchCategories = async () => {
    try {
      const data = await api.get('/admin/category/list', { params: { type: 2 } }) as unknown as Category[];
      setCategories(data || []);
    } catch {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/setmeal/page', { params: { page, pageSize: 10 } }) as unknown as PageResult<SetmealVO>;
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put('/admin/setmeal', { ...form, id: editing.id, status: editing.status });
      } else {
        await api.post('/admin/setmeal', { ...form, status: 1 });
      }
      setEditing(null); setForm({ name: '', categoryId: 0, price: 0, description: '' }); fetchData();
    } catch {}
  };

  const handleToggle = async (s: SetmealVO) => {
    try { await api.post(`/admin/setmeal/status/${s.status === 1 ? 0 : 1}`, null, { params: { id: s.id } }); fetchData(); } catch {}
  };

  const handleDelete = async (ids: number[]) => {
    try { await api.delete('/admin/setmeal', { params: { ids: ids.join(',') } }); fetchData(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-bold">套餐管理</h1>
          <button onClick={() => { setEditing(null); setForm({ name: '', categoryId: 0, price: 0, description: '' }); }}
            className="bg-[#ffc200] text-[#343744] px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-1">
            <Plus size={14} /> 新增套餐
          </button>
        </div>
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-3 items-end flex-wrap">
          <div><label className="text-xs text-gray-500">名称</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1 w-36" /></div>
          <div><label className="text-xs text-gray-500">分类</label><select value={form.categoryId || ''} onChange={e => setForm({...form, categoryId: +e.target.value})} className="border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1 w-28"><option value="">选择</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="text-xs text-gray-500">价格</label><input type="number" step="0.01" value={form.price || ''} onChange={e => setForm({...form, price: +e.target.value})} className="border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1 w-24" /></div>
          <div><label className="text-xs text-gray-500">描述</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1 w-48" /></div>
          <button onClick={handleSave} className="bg-[#ffc200] text-[#343744] px-4 py-2 rounded-lg font-bold text-sm">{editing ? '更新' : '添加'}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ name: '', categoryId: 0, price: 0, description: '' }); }} className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold text-sm">取消</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', '名称', '分类', '价格', '状态', '操作'].map(h => <th key={h} className="text-left px-6 py-3 text-xs text-gray-500 font-bold uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4">{row.id}</td>
                  <td className="px-6 py-4 font-medium">{row.name}</td>
                  <td className="px-6 py-4">{row.categoryId}</td>
                  <td className="px-6 py-4">¥{row.price != null ? Number(row.price).toFixed(2) : '--'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggle(row)}
                      className={`text-xs font-bold px-2 py-1 rounded ${row.status === 1 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {row.status === 1 ? '起售' : '停售'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={async () => { setEditing(row); try { const s = await api.get(`/admin/setmeal/${row.id}`) as unknown as SetmealVO; setForm({ name: s.name, categoryId: s.categoryId, price: Number(s.price), description: s.description || '' }); } catch { setForm({ name: row.name, categoryId: row.categoryId, price: Number(row.price), description: row.description || '' }); } }} className="text-blue-500 hover:text-blue-700"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete([row.id])} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">共 {total} 条</span>
          <div className="flex gap-1">{Array.from({length: Math.ceil(total/10)},(_,i)=>i+1).map(p=><button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-bold ${p===page?'bg-[#ffc200] text-[#343744]':'bg-gray-100 text-gray-500'}`}>{p}</button>)}</div>
        </div>
      </div>
    </div>
  );
}
