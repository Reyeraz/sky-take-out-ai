import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Search } from 'lucide-react';
import api from '../../api/client';
import type { EmployeeVO, PageResult } from '../../types';

export default function AdminEmployee() {
  const [data, setData] = useState<EmployeeVO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmployeeVO | null>(null);
  const [form, setForm] = useState({ username: '', name: '', phone: '', sex: '1', idNumber: '', password: '123456' });

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/employee/page', { params: { page, pageSize: 10, name: name || undefined } }) as unknown as PageResult<EmployeeVO>;
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch { console.warn('Fetch failed'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put('/admin/employee', { ...form, id: editing.id });
      } else {
        await api.post('/admin/employee', form);
      }
      setShowForm(false); setEditing(null);
      setForm({ username: '', name: '', phone: '', sex: '1', idNumber: '', password: '123456' });
      fetchData();
    } catch { console.warn('Save failed'); }
  };

  const handleEdit = async (emp: EmployeeVO) => {
    setEditing(emp);
    try {
      const detail = await api.get(`/admin/employee/${emp.id}`) as unknown as EmployeeVO;
      setForm({ username: detail.username, name: detail.name, phone: detail.phone, sex: detail.sex, idNumber: detail.idNumber, password: '' });
    } catch {
      setForm({ username: emp.username, name: emp.name, phone: emp.phone, sex: emp.sex, idNumber: emp.idNumber, password: '' });
    }
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try { await api.post(`/admin/employee/status/0`, null, { params: { id } }); fetchData(); } catch {}
  };

  const handleToggle = async (emp: EmployeeVO) => {
    try {
      await api.post(`/admin/employee/status/${emp.status === 1 ? 0 : 1}`, null, { params: { id: emp.id } });
      fetchData();
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-bold">员工管理</h1>
          <button onClick={() => { setEditing(null); setForm({ username: '', name: '', phone: '', sex: '1', idNumber: '', password: '123456' }); setShowForm(true); }}
            className="bg-[#ffc200] text-[#343744] px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-[#ebb300] flex items-center gap-1">
            <Plus size={14} /> 新增员工
          </button>
        </div>

        {showForm && (
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="text-xs text-gray-500">用户名</label><input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-500">姓名</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-500">手机号</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-500">身份证号</label><input value={form.idNumber} onChange={e => setForm({...form, idNumber: e.target.value})} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-500">性别</label><select value={form.sex} onChange={e => setForm({...form, sex: e.target.value})} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1"><option value="1">男</option><option value="0">女</option></select></div>
              {!editing && <div><label className="text-xs text-gray-500">初始密码</label><input value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm mt-1" /></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="bg-[#ffc200] text-[#343744] px-6 py-2 rounded-lg font-bold text-sm">保存</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-600 px-6 py-2 rounded-lg font-bold text-sm">取消</button>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="搜索姓名..." className="border border-gray-200 rounded-lg py-2 px-3 text-sm flex-1 max-w-xs" />
          <button onClick={() => { setPage(1); fetchData(); }} className="bg-gray-100 rounded-lg p-2"><Search size={16} /></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', '用户名', '姓名', '手机号', '状态', '操作'].map(h => <th key={h} className="text-left px-6 py-3 text-xs text-gray-500 font-bold uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-4">{row.id}</td>
                  <td className="px-6 py-4 font-medium">{row.username}</td>
                  <td className="px-6 py-4">{row.name}</td>
                  <td className="px-6 py-4">{row.phone}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggle(row)}
                      className={`text-xs font-bold px-2 py-1 rounded ${row.status === 1 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {row.status === 1 ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(row)} className="text-blue-500 hover:text-blue-700"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-400">共 {total} 条</span>
          <div className="flex gap-1">
            {Array.from({ length: Math.ceil(total / 10) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold ${p === page ? 'bg-[#ffc200] text-[#343744]' : 'bg-gray-100 text-gray-500'}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
