import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Sparkles, Square } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // 直接指向当前流式消息的 DOM 节点，绕过 React 渲染
  const streamDomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  };

  const getToken = () => localStorage.getItem('sky_token') || '';

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const userMsg = input.trim();
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }, { role: 'assistant' as const, content: '...' }];

    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    streamDomRef.current = null; // 将在下一次渲染后赋值

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${BASE_URL}/user/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', token: getToken() },
        body: JSON.stringify({ message: userMsg, history }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // ---- 重新解析：一次读一行，状态机处理 ----
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let leftover = '';
      let eventType = '';
      let dataLines: string[] = [];
      let accumulated = '';

      const applyText = (text: string) => {
        accumulated = text;
        const el = streamDomRef.current;
        if (el) {
          el.textContent = text || '...';
          scrollToBottom();
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (value) leftover += decoder.decode(value, { stream: true });
        if (done && !leftover) break;

        // 逐行处理
        const rawLines = leftover.split('\n');
        // 最后一行可能不完整，保留到下一次
        leftover = rawLines.pop() || '';

        for (const raw of rawLines) {
          const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
          if (line === '') {
            // 空行 = 事件结束
            if (dataLines.length > 0) {
              const data = dataLines.join('\n');
              dataLines = [];
              if (eventType === 'meta') {
                try {
                  const meta: SSEMeta = JSON.parse(data);
                  if (meta.reply) applyText(meta.reply);
                  if (meta.suggestedDishNames?.length && !accumulated.includes('**推荐菜品：**')) {
                    const withDishes = accumulated + '\n\n**推荐菜品：** ' + meta.suggestedDishNames.join('、');
                    applyText(withDishes);
                  }
                } catch (e) { console.warn('[SSE] meta parse error', e); }
              } else if (eventType === 'error') {
                if (!accumulated) applyText(data);
              } else {
                applyText(accumulated + data);
              }
              eventType = '';
            }
          } else if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataLines.push(line.slice(6));
          }
        }

        if (done) break;
      }

      // 处理剩余
      const remainder = decoder.decode();
      if (remainder) leftover += remainder;
      if (leftover.trim()) {
        const lines = leftover.split('\n');
        for (const raw of lines) {
          const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
          if (line.startsWith('data: ')) dataLines.push(line.slice(6));
          else if (line.startsWith('event: ')) eventType = line.slice(7).trim();
        }
        if (dataLines.length > 0) {
          const data = dataLines.join('\n');
          if (eventType === 'meta') {
            try {
              const meta: SSEMeta = JSON.parse(data);
              if (meta.reply) applyText(meta.reply);
              if (meta.suggestedDishNames?.length && !accumulated.includes('**推荐菜品：**')) {
                applyText(accumulated + '\n\n**推荐菜品：** ' + meta.suggestedDishNames.join('、'));
              }
            } catch (e) { console.warn('[SSE] meta parse error', e); }
          } else {
            applyText(accumulated + data);
          }
        }
      }

      // 同步最终内容到 React state
      const finalText = accumulated;
      if (finalText) {
        setMessages(prev => {
          const next = prev.slice();
          const last = next[next.length - 1];
          if (last && last.role === 'assistant') {
            next[next.length - 1] = { ...last, content: finalText };
          }
          return next;
        });
      }

    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const next = prev.slice();
          const last = next[next.length - 1];
          if (last && last.role === 'assistant' && last.content === '...') {
            next[next.length - 1] = { ...last, content: '抱歉，AI助手暂时不可用，请稍后再试。' };
          }
          return next;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, streaming, messages]);

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold">AI 美食助手</h1>
          <div className="text-[10px] text-green-500 font-medium">● 在线服务中</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1;
          return (
            <div key={idx} className={cn('flex gap-3 max-w-[85%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm',
                msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-gray-500')}>
                {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>
              <div
                ref={isLast ? streamDomRef : undefined}
                className={cn('p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
                  msg.role === 'user' ? 'bg-primary text-dark rounded-tr-none' : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-none')}
              >
                {msg.content === '...' ? (
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
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
            <button onClick={handleStop} className="absolute right-2 top-1.5 bottom-1.5 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center">
              <Square size={14} />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim()} className="absolute right-2 top-1.5 bottom-1.5 w-10 h-10 bg-primary text-dark rounded-full flex items-center justify-center transition-opacity disabled:opacity-50">
              <Send size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {['帮我推荐双人餐', '有什么清淡的菜？', '今日爆款是什么', '推荐一些辣菜'].map(tag => (
            <button key={tag} onClick={() => setInput(tag)} disabled={streaming}
              className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] whitespace-nowrap hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50">
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
