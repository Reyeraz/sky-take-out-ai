import { useState, useEffect } from 'react';
import { MapPin, Plus, Check, Trash2, Edit3 } from 'lucide-react';
import api from '../api/client';
import type { AddressBookItem } from '../types';

const defaultForm: AddressBookItem = {
  consignee: '',
  phone: '',
  sex: '1',
  provinceName: '',
  cityName: '',
  districtName: '',
  detail: '',
  label: '',
  isDefault: 0,
};

export default function UserAddressBook() {
  const [addresses, setAddresses] = useState<AddressBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressBookItem>({ ...defaultForm });
  const [defaultAddress, setDefaultAddress] = useState<AddressBookItem | null>(null);

  useEffect(() => { fetchAddresses(); fetchDefault(); }, []);

  const fetchDefault = async () => {
    try {
      const data = await api.get('/user/addressBook/default') as unknown as AddressBookItem;
      setDefaultAddress(data);
    } catch {}
  };

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const data = await api.get('/user/addressBook/list') as unknown as AddressBookItem[];
      setAddresses(data || []);
    } catch { console.warn('Failed to fetch addresses'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ ...defaultForm });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.consignee || !form.phone || !form.detail) return;
    try {
      if (editingId) {
        await api.put('/user/addressBook', { ...form, id: editingId });
      } else {
        await api.post('/user/addressBook', form);
      }
      resetForm();
      fetchAddresses();
    } catch { console.warn('Save failed'); }
  };

  const handleEdit = async (addr: AddressBookItem) => {
    if (addr.id) {
      try {
        const detail = await api.get(`/user/addressBook/${addr.id}`) as unknown as AddressBookItem;
        setForm({ ...detail });
      } catch {
        setForm({ ...addr });
      }
    } else {
      setForm({ ...addr });
    }
    setEditingId(addr.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete('/user/addressBook', { params: { id } });
      fetchAddresses();
    } catch { console.warn('Delete failed'); }
  };

  const handleSetDefault = async (addr: AddressBookItem) => {
    try {
      await api.put('/user/addressBook/default', { id: addr.id, isDefault: 1 });
      fetchAddresses();
    } catch { console.warn('Set default failed'); }
  };

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        {[1, 2].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl mb-3"></div>)}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">收货地址</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 text-sm text-[#ffc200] font-bold">
          <Plus size={16} /> 新增
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">收货人</label>
              <input value={form.consignee} onChange={e => setForm({...form, consignee: e.target.value})} className="w-full bg-gray-50 rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-[#ffc200]" />
            </div>
            <div>
              <label className="text-xs text-gray-400">手机号</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-gray-50 rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-[#ffc200]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">省/市/区</label>
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="省" value={form.provinceName} onChange={e => setForm({...form, provinceName: e.target.value})} className="bg-gray-50 rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-[#ffc200]" />
              <input placeholder="市" value={form.cityName} onChange={e => setForm({...form, cityName: e.target.value})} className="bg-gray-50 rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-[#ffc200]" />
              <input placeholder="区" value={form.districtName} onChange={e => setForm({...form, districtName: e.target.value})} className="bg-gray-50 rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-[#ffc200]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400">详细地址</label>
            <input value={form.detail} onChange={e => setForm({...form, detail: e.target.value})} className="w-full bg-gray-50 rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-[#ffc200]" />
          </div>
          <div className="flex gap-2">
            <input placeholder="标签(家/公司/学校)" value={form.label} onChange={e => setForm({...form, label: e.target.value})} className="flex-1 bg-gray-50 rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-[#ffc200]" />
            <label className="flex items-center gap-1 text-xs text-gray-400">
              <input type="checkbox" checked={form.isDefault === 1} onChange={e => setForm({...form, isDefault: e.target.checked ? 1 : 0})} />
              默认
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-[#ffc200] text-[#343744] font-bold py-2 rounded-lg">保存</button>
            <button onClick={resetForm} className="flex-1 bg-gray-100 text-gray-500 font-bold py-2 rounded-lg">取消</button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <MapPin size={48} className="mx-auto mb-3 opacity-20" />
          <p>暂无收货地址</p>
        </div>
      ) : (
        <div className="space-y-3">
          {defaultAddress && (
            <div className="bg-[#ffc200]/5 rounded-xl p-3 border border-[#ffc200]/30 mb-2">
              <div className="text-xs text-[#ffc200] font-bold mb-1">默认地址</div>
              <div className="font-bold text-sm">{defaultAddress.consignee} <span className="text-xs text-gray-400 font-normal">{defaultAddress.phone}</span></div>
              <p className="text-xs text-gray-500">{defaultAddress.provinceName}{defaultAddress.cityName}{defaultAddress.districtName} {defaultAddress.detail}</p>
            </div>
          )}
          {addresses.map(addr => (
            <div key={addr.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {addr.label && <span className="bg-[#ffc200]/10 text-[#ffc200] text-[10px] font-bold px-1.5 py-0.5 rounded">{addr.label}</span>}
                  <span className="font-bold text-sm">{addr.consignee}</span>
                  <span className="text-xs text-gray-400">{addr.phone}</span>
                  {addr.isDefault === 1 && <span className="text-[10px] text-[#ffc200] border border-[#ffc200] rounded px-1">默认</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(addr)} className="p-1 text-gray-400 hover:text-[#ffc200]"><Edit3 size={14} /></button>
                  <button onClick={() => addr.id && handleDelete(addr.id)} className="p-1 text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {addr.provinceName}{addr.cityName}{addr.districtName} {addr.detail}
              </p>
              {addr.isDefault !== 1 && (
                <button onClick={() => handleSetDefault(addr)} className="mt-2 text-[10px] text-[#ffc200] font-bold flex items-center gap-0.5">
                  <Check size={10} /> 设为默认
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
