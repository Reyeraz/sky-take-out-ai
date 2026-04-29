import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import api from '../../api/client';
import type { Category, PageResult } from '../../types';

export default function AdminCategory() {
  const [data, setData] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', sort: 0, type: 1 });
  const [editing, setEditing] = useState<Category | null>(null);

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/category/page', { params: { page, pageSize: 10 } }) as unknown as PageResult<Category>;
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put('/admin/category', { ...form, id: editing.id });
      } else {
        await api.post('/admin/category', form);
      }
      setEditing(null); setForm({ name: '', sort: 0, type: 1 }); fetchData();
    } catch {}
  };

  const handleToggle = async (cat: Category) => {
    try {
      await api.post(`/admin/category/status/${cat.status === 1 ? 0 : 1}`, null, { params: { id: cat.id } });
      fetchData();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try { await api.delete('/admin/category', { params: { id } }); fetchData(); } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-bold">分类管理</h1>
          <button onClick={() => { setEditing(null); setForm({ name: '', sort: 0, type: 1 }); }}
            className="bg-[#ffc200] text-[#343744] px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-1">
            <Plus size={14} /> 新增分类
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-3 items-end">
          <div><label className="text-xs text-gray-500">名称</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1 w-36" /></div>
          <div><label className="text-xs text-gray-500">类型</label><select value={form.type} onChange={e => setForm({...form, type: +e.target.value})} className="border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1"><option value={1}>菜品</option><option value={2}>套餐</option></select></div>
          <div><label className="text-xs text-gray-500">排序</label><input type="number" value={form.sort} onChange={e => setForm({...form, sort: +e.target.value})} className="border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1 w-20" /></div>
          <button onClick={handleSave} className="bg-[#ffc200] text-[#343744] px-4 py-2 rounded-lg font-bold text-sm">{editing ? '更新' : '添加'}</button>
          {editing && <button onClick={() => { setEditing(null); setForm({ name: '', sort: 0, type: 1 }); }} className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold text-sm">取消</button>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', '名称', '类型', '排序', '状态', '操作'].map(h => <th key={h} className="text-left px-6 py-3 text-xs text-gray-500 font-bold uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4">{row.id}</td>
                  <td className="px-6 py-4 font-medium">{row.name}</td>
                  <td className="px-6 py-4">{row.type === 1 ? '菜品' : '套餐'}</td>
                  <td className="px-6 py-4">{row.sort}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggle(row)}
                      className={`text-xs font-bold px-2 py-1 rounded ${row.status === 1 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {row.status === 1 ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(row); setForm({ name: row.name, sort: row.sort, type: row.type }); }} className="text-blue-500 hover:text-blue-700"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
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
