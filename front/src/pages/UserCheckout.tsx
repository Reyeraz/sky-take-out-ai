import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import api from '../api/client';

export default function UserCheckout() {
  const navigate = useNavigate();
  const [acting, setActing] = useState(false);

  const handleCheckout = async () => {
    setActing(true);
    try {
      const submit = await api.post('/user/order/submit', {
        addressBookId: 1,
        payMethod: 1,
        remark: '',
        estimatedDeliveryTime: null,
        deliveryStatus: 1,
        tablewareNumber: 0,
        tablewareStatus: 0,
        packAmount: 0,
        amount: 0,
      }) as unknown as { id: number; orderNumber: string };
      await api.put('/user/order/payment', {
        orderNumber: submit.orderNumber,
        payMethod: 1,
      });
      navigate('/user/orders', { replace: true });
    } catch {
      console.warn('Checkout failed');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">确认下单</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">配送方式</span>
          <span className="font-medium">立即送出</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">支付方式</span>
          <span className="font-medium">微信支付</span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={acting}
        className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-[#ffc200] text-[#343744] font-black py-4 flex items-center justify-center gap-2 shadow-lg shadow-[#ffc200]/20 z-40"
      >
        <CreditCard size={20} />
        {acting ? '处理中...' : '确认支付'}
      </button>
    </div>
  );
}
