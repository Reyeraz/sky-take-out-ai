import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, ChevronRight, Plus, ShoppingCart } from 'lucide-react';
import api from '../api/client';
import type { ShoppingCartItem, AddressBookItem } from '../types';
import { formatPrice } from '../lib/utils';

export default function UserCheckout() {
  const navigate = useNavigate();
  const [acting, setActing] = useState(false);
  const [cartItems, setCartItems] = useState<ShoppingCartItem[]>([]);
  const [addresses, setAddresses] = useState<AddressBookItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressBookItem | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payMethod, setPayMethod] = useState(1); // 1=WeChat, 2=Alipay
  const [remark, setRemark] = useState('');

  useEffect(() => {
    Promise.all([fetchCart(), fetchAddresses()]).finally(() => setLoading(false));
  }, []);

  const fetchCart = async () => {
    try {
      const data = await api.get('/user/shoppingCart/list') as unknown as ShoppingCartItem[];
      setCartItems(data || []);
    } catch { console.warn('Failed to fetch cart'); }
  };

  const fetchAddresses = async () => {
    try {
      const data = await api.get('/user/addressBook/list') as unknown as AddressBookItem[];
      setAddresses(data || []);
      // Auto-select default address
      const def = (data || []).find(a => a.isDefault === 1) || (data && data.length > 0 ? data[0] : null);
      setSelectedAddress(def);
    } catch { console.warn('Failed to fetch addresses'); }
  };

  const totalAmount = cartItems.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalCount = cartItems.reduce((sum, i) => sum + (i.number || 0), 0);

  const handleCheckout = async () => {
    if (!selectedAddress?.id) return;
    setActing(true);
    try {
      const submit = await api.post('/user/order/submit', {
        addressBookId: selectedAddress.id,
        payMethod,
        remark,
        estimatedDeliveryTime: null,
        deliveryStatus: 1,
        tablewareNumber: 0,
        tablewareStatus: 0,
        packAmount: 0,
        amount: totalAmount,
      }) as unknown as { id: number; orderNumber: string };
      await api.put('/user/order/payment', {
        orderNumber: submit.orderNumber,
        payMethod,
      });
      navigate('/user/orders', { replace: true });
    } catch {
      console.warn('Checkout failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded-xl mb-3"></div>
        <div className="h-32 bg-gray-200 rounded-xl mb-3"></div>
        <div className="h-20 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">确认下单</h1>
        <div className="py-20 text-center text-gray-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-20" />
          <p>购物车为空，请先添加商品</p>
          <button onClick={() => navigate('/user/browse')} className="mt-4 text-[#ffc200] font-bold text-sm">
            去选购
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">确认下单</h1>

      {/* Address Section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <MapPin size={16} className="text-[#ffc200]" />
            配送地址
          </div>
          <button
            onClick={() => navigate('/user/address')}
            className="text-xs text-[#ffc200] font-bold flex items-center gap-1"
          >
            <Plus size={12} /> 管理地址
          </button>
        </div>

        {selectedAddress ? (
          <div
            className="bg-[#ffc200]/5 rounded-xl p-3 border border-[#ffc200]/30 cursor-pointer"
            onClick={() => setShowAddressPicker(!showAddressPicker)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm">
                  {selectedAddress.consignee}
                  <span className="text-xs text-gray-400 font-normal ml-2">{selectedAddress.phone}</span>
                  {selectedAddress.label && (
                    <span className="ml-1 bg-[#ffc200]/20 text-[#ffc200] text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {selectedAddress.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedAddress.provinceName}{selectedAddress.cityName}{selectedAddress.districtName} {selectedAddress.detail}
                </p>
              </div>
              {addresses.length > 1 && (
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-2">暂无收货地址</p>
            <button
              onClick={() => navigate('/user/address')}
              className="text-[#ffc200] font-bold text-sm flex items-center gap-1 mx-auto"
            >
              <Plus size={14} /> 新增地址
            </button>
          </div>
        )}

        {/* Address Picker */}
        {showAddressPicker && addresses.length > 1 && (
          <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
            {addresses.map(addr => (
              <div
                key={addr.id}
                className={`rounded-xl p-3 border cursor-pointer transition-colors ${
                  selectedAddress?.id === addr.id
                    ? 'bg-[#ffc200]/10 border-[#ffc200]'
                    : 'bg-gray-50 border-gray-100 hover:border-[#ffc200]/50'
                }`}
                onClick={() => { setSelectedAddress(addr); setShowAddressPicker(false); }}
              >
                <div className="font-bold text-sm">
                  {addr.consignee}
                  <span className="text-xs text-gray-400 font-normal ml-2">{addr.phone}</span>
                  {addr.label && (
                    <span className="ml-1 bg-[#ffc200]/20 text-[#ffc200] text-[10px] font-bold px-1 py-0.5 rounded">
                      {addr.label}
                    </span>
                  )}
                  {addr.isDefault === 1 && (
                    <span className="ml-1 text-[10px] text-[#ffc200] border border-[#ffc200] rounded px-1">默认</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {addr.provinceName}{addr.cityName}{addr.districtName} {addr.detail}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Items Summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="text-sm font-bold text-gray-700 mb-3">商品明细 ({totalCount})</div>
        <div className="space-y-2">
          {cartItems.map((item, idx) => (
            <div key={item.id || idx} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {item.image ? (
                  <img src={item.image} alt="" className="w-8 h-8 rounded bg-gray-100 object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart size={12} className="text-gray-300" />
                  </div>
                )}
                <span className="truncate">{item.name}</span>
                {item.dishFlavor && <span className="text-xs text-gray-400">({item.dishFlavor})</span>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400">x{item.number}</span>
                <span className="text-[#ffc200] font-bold">{formatPrice(item.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">配送方式</span>
          <span className="font-medium">立即送出</span>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-gray-400">支付方式</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPayMethod(1)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
                payMethod === 1 ? 'bg-[#ffc200] text-[#343744]' : 'bg-gray-100 text-gray-400'
              }`}
            >
              微信支付
            </button>
            <button
              onClick={() => setPayMethod(2)}
              className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
                payMethod === 2 ? 'bg-[#ffc200] text-[#343744]' : 'bg-gray-100 text-gray-400'
              }`}
            >
              支付宝
            </button>
          </div>
        </div>
        <div className="flex justify-between text-sm items-center">
          <span className="text-gray-400">备注</span>
          <input
            value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder="选填"
            className="text-right text-sm bg-transparent outline-none w-32"
          />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 p-4 flex items-center justify-between z-40">
        <div>
          <div className="text-xs text-gray-400">合计</div>
          <div className="text-xl font-black text-[#ffc200]">{formatPrice(totalAmount)}</div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={acting || !selectedAddress}
          className="bg-[#ffc200] text-[#343744] font-black px-8 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-[#ffc200]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CreditCard size={20} />
          {acting ? '处理中...' : '确认支付'}
        </button>
      </div>
    </div>
  );
}
