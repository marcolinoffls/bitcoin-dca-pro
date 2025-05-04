
/**
 * Página principal do Satsflow AI
 * Interface de chat para interação com IA especializada em Bitcoin
 * Usa autenticação com JWT e sistema de chat_id persistente
 */
import React, { useRef, useState, useEffect } from 'react';
import { Menu, Send, Plus, ArrowDown } from 'lucide-react';
import ChatMessage from '@/components/chat/ChatMessage';
import { useChatAi } from '@/hooks/useChatAi';
import { Button } from '@/components/ui/button';

const SatsflowAI: React.FC = () => {
  const [messageText, setMessageText] = useState('');
  const { messages, isLoading, sendMessage } = useChatAi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distance > 300);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    await sendMessage(messageText);
    setMessageText('');
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col">
      {/* TOPO FIXO */}
      <header className="fixed top-0 left-0 right-0 z-20 h-14 bg-bitcoin flex items-center justify-between px-4 text-white">
        <button><Menu className="w-5 h-5" /></button>
        <h1 className="text-sm font-semibold">Satsflow AI</h1>
        <button><Plus className="w-5 h-5" /></button>
      </header>

      {/* ÁREA DE MENSAGENS (com scroll) */}
      <main
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-14 pb-[90px] px-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
            Envie uma mensagem para iniciar a conversa<br />
            sobre Bitcoin, investimentos e criptomoedas.
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage
              key={i}
              content={msg.content}
              isAi={msg.isAi}
              isLoading={msg.isAi && isLoading && i === messages.length - 1}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* BOTÃO FLUTUANTE */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-[100px] right-4 bg-bitcoin text-white p-2 rounded-full shadow z-30"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* CAMPO DE MENSAGEM FIXO */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 right-0 z-20 bg-white px-4 py-2 border-t shadow"
      >
        <div className="max-w-2xl mx-auto flex gap-2 items-center border border-orange-300 rounded-2xl px-3 py-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={1}
            className="flex-1 resize-none text-base leading-snug outline-none"
            style={{ fontSize: 16 }}
          />
          <Button
            type="submit"
            disabled={isLoading || !messageText.trim()}
            className="bg-bitcoin hover:bg-bitcoin/90 p-2 rounded-xl"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SatsflowAI;
