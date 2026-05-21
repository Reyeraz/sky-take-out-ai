import { useState } from 'react';
import { Sparkles, BrainCircuit, Menu, PenTool } from 'lucide-react';
import api from '../../api/client';
import type { AiMenuSuggestionVO } from '../../types';

export default function AdminAi() {
  const [menuSuggestion, setMenuSuggestion] = useState<AiMenuSuggestionVO | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [dishName, setDishName] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [descriptions, setDescriptions] = useState<string[]>([]);
  const [loadingDesc, setLoadingDesc] = useState(false);

  const handleMenuSuggestion = async () => {
    setLoadingMenu(true);
    try {
      const data = await api.get('/admin/ai/menu-suggestion') as unknown as AiMenuSuggestionVO;
      setMenuSuggestion(data);
    } catch { console.warn('Menu suggestion failed'); }
    finally { setLoadingMenu(false); }
  };

  const handleGenerateDesc = async () => {
    if (!dishName) return;
    setLoadingDesc(true);
    try {
      const data = await api.post('/admin/ai/dish-description', {
        name: dishName,
        categoryName: category,
        ingredients: ingredients.split(/[,，、]/).filter(Boolean),
      }) as unknown as string[];
      setDescriptions(data || []);
    } catch { console.warn('Description generation failed'); }
    finally { setLoadingDesc(false); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">AI 智能助手</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu Suggestion */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#ffc200]/10 rounded-xl flex items-center justify-center"><Menu size={20} className="text-[#ffc200]" /></div>
            <div><h2 className="font-bold">菜单优化建议</h2><p className="text-xs text-gray-400">AI 分析菜单结构，提供优化方案</p></div>
          </div>
          <button onClick={handleMenuSuggestion} disabled={loadingMenu}
            className="w-full py-3 bg-[#ffc200] text-[#343744] font-bold rounded-xl hover:brightness-95 transition-all mb-4 flex items-center justify-center gap-2">
            <Sparkles size={16} /> {loadingMenu ? '分析中...' : menuSuggestion ? '重新分析' : '生成分析'}
          </button>
          {menuSuggestion && (
            <div className="space-y-3 text-sm">
              {menuSuggestion.summary && <p className="text-gray-600 p-3 bg-gray-50 rounded-xl">{menuSuggestion.summary}</p>}
              {menuSuggestion.promoteList?.length > 0 && <div><div className="text-xs text-green-500 font-bold mb-1">✅ 应推广</div><ul className="space-y-0.5">{menuSuggestion.promoteList.map((s,i) => <li key={i} className="text-gray-600 pl-4">• {s}</li>)}</ul></div>}
              {menuSuggestion.demoteList?.length > 0 && <div><div className="text-xs text-red-400 font-bold mb-1">❌ 建议下架</div><ul className="space-y-0.5">{menuSuggestion.demoteList.map((s,i) => <li key={i} className="text-gray-600 pl-4">• {s}</li>)}</ul></div>}
              {menuSuggestion.newCategoryIdeas?.length > 0 && <div><div className="text-xs text-blue-400 font-bold mb-1">💡 建议新品类</div><ul className="space-y-0.5">{menuSuggestion.newCategoryIdeas.map((s,i) => <li key={i} className="text-gray-600 pl-4">• {s}</li>)}</ul></div>}
            </div>
          )}
        </div>

        {/* Dish Description Generator */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#ffc200]/10 rounded-xl flex items-center justify-center"><PenTool size={20} className="text-[#ffc200]" /></div>
            <div><h2 className="font-bold">菜品描述生成</h2><p className="text-xs text-gray-400">AI 自动生成吸引人的菜品文案</p></div>
          </div>
          <div className="space-y-3 mb-4">
            <input value={dishName} onChange={e => setDishName(e.target.value)} placeholder="菜品名称" className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm" />
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="菜品分类" className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm" />
            <input value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="食材(逗号分隔)" className="w-full border border-gray-200 rounded-lg py-2 px-3 text-sm" />
          </div>
          <button onClick={handleGenerateDesc} disabled={loadingDesc || !dishName}
            className="w-full py-3 bg-[#ffc200] text-[#343744] font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-50 mb-4 flex items-center justify-center gap-2">
            <BrainCircuit size={16} /> {loadingDesc ? '生成中...' : '生成描述'}
          </button>
          {descriptions.length > 0 && (
            <div className="space-y-2">{descriptions.map((d, i) => <div key={i} className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">{d}</div>)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
