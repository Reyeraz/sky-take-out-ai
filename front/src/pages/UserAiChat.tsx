import { useState, useRef, useCallback } from 'react';
import { Send, Bot, User as UserIcon, Sparkles, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { ChatMessage } from '../types';

interface SSEMeta {
  reply: string;
  suggestedDishIds: number[];
  suggestedDishNames: string[];
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const WELCOME_MSG: ChatMessage = {
  role: 'assistant',
  content: '您好！我是您的 AI 美食助手。想吃点什么？我可以为您推荐今日最火爆的单品或者帮您搭配一份完美的餐食。',
};

export default function UserAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const getToken = () => localStorage.getItem('sky_token') || '';

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const userMsg = input.trim();
    const currentMessages = messagesRef.current;
    const history = currentMessages.map(m => ({ role: m.role, content: m.content }));
    const assistantIdx = currentMessages.length + 1;

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${BASE_URL}/user/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: getToken(),
        },
        body: JSON.stringify({ message: userMsg, history }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split complete SSE events (separated by \n\n)
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;

          const lines = part.split('\n');
          let eventType = '';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              data += line.slice(6);
            }
          }

          if (!data) continue;

          if (eventType === 'meta') {
            const meta: SSEMeta = JSON.parse(data);
            setMessages(prev => {
              const updated = [...prev];
              if (updated[assistantIdx]) {
                let replyText = meta.reply || updated[assistantIdx].content;
                if (meta.suggestedDishNames?.length) {
                  replyText += '\n\n**推荐菜品：** ' + meta.suggestedDishNames.join('、');
                }
                updated[assistantIdx] = { ...updated[assistantIdx], content: replyText };
              }
              return updated;
            });
          } else if (eventType === 'error') {
            setMessages(prev => {
              const updated = [...prev];
              if (updated[assistantIdx]) {
                updated[assistantIdx] = { ...updated[assistantIdx], content: data || '抱歉，AI助手暂时不可用，请稍后再试。' };
              }
              return updated;
            });
          } else {
            // Content chunk
            setMessages(prev => {
              const updated = [...prev];
              if (updated[assistantIdx]) {
                updated[assistantIdx] = {
                  ...updated[assistantIdx],
                  content: updated[assistantIdx].content + data,
                };
              }
              return updated;
            });
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[SSE] Stream error:', err.message);
        setMessages(prev => {
          const updated = [...prev];
          const idx = assistantIdx < updated.length ? assistantIdx : updated.length - 1;
          if (updated[idx] && !updated[idx].content) {
            updated[idx] = { ...updated[idx], content: '抱歉，AI助手暂时不可用，请稍后再试。' };
          }
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming]);

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
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
                'flex gap-3 max-w-[85%]',
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : '',
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-500',
                )}
              >
                {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>
              <div
                className={cn(
                  'p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user'
                    ? 'bg-primary text-dark rounded-tr-none'
                    : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-none',
                )}
              >
                {msg.content || (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 mb-16">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="输入您想吃的口味或需求..."
            disabled={streaming}
            className="w-full bg-gray-100 border-none rounded-full py-3 pl-5 pr-12 text-sm focus:ring-2 focus:ring-primary/50 transition-all font-medium disabled:opacity-60"
          />
          {streaming ? (
            <button
              onClick={handleStop}
              className="absolute right-2 top-1.5 bottom-1.5 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center"
            >
              <Square size={14} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-2 top-1.5 bottom-1.5 w-10 h-10 bg-primary text-dark rounded-full flex items-center justify-center transition-opacity disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {['帮我推荐双人餐', '有什么清淡的菜？', '今日爆款是什么', '推荐一些辣菜'].map(tag => (
            <button
              key={tag}
              onClick={() => setInput(tag)}
              disabled={streaming}
              className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] whitespace-nowrap hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
