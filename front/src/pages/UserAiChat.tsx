import { useState } from 'react';
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import api from '../api/client';
import type { ChatMessage, AiChatVO } from '../types';

export default function UserAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: '您好！我是您的 AI 美食助手。想吃点什么？我可以为您推荐今日最火爆的单品或者帮您搭配一份完美的餐食。' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.post('/user/ai/chat', {
        message: userMsg,
        history,
      }) as unknown as AiChatVO;

      let replyText = data.reply || '已收到您的消息';
      if (data.suggestedDishNames?.length > 0) {
        replyText += '\n\n**推荐菜品：** ' + data.suggestedDishNames.join('、');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，AI助手暂时不可用，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold">AI 美食助手</h1>
          <div className="text-[10px] text-green-500 font-medium">● 在线服务中</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                msg.role === 'user' ? "bg-primary text-white" : "bg-white text-gray-500"
              )}>
                {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === 'user'
                  ? "bg-primary text-dark rounded-tr-none"
                  : "bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-none"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
              <Bot size={14} className="animate-pulse text-primary" />
            </div>
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 mb-16">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入您想吃的口味或需求..."
            className="w-full bg-gray-100 border-none rounded-full py-3 pl-5 pr-12 text-sm focus:ring-2 focus:ring-primary/50 transition-all font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-1.5 bottom-1.5 w-10 h-10 bg-primary text-dark rounded-full flex items-center justify-center transition-opacity disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {['帮我推荐双人餐', '有什么清淡的菜？', '今日爆款是什么', '推荐一些辣菜'].map((tag) => (
            <button
              key={tag}
              onClick={() => setInput(tag)}
              className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] whitespace-nowrap hover:bg-primary/10 hover:text-primary transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
