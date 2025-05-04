
/**
 * Página principal do Satsflow AI
 * Interface de chat para interação com IA especializada em Bitcoin
 * Usa autenticação com JWT e sistema de chat_id persistente
 */
import React, { useRef, useState, useEffect } from 'react';
import { Menu, Send, Plus, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatMessage from '@/components/chat/ChatMessage';
import { useChatAi } from '@/hooks/useChatAi';
import BottomNavBar from '@/components/navigation/BottomNavBar';

const SatsflowAI: React.FC = () => {
  const [messageText, setMessageText] = useState('');
  const { messages, isLoading, sendMessage, chatId } = useChatAi();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll automático para o final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detectar distância do fim
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distanceFromBottom > 300);
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
    <div id="top" className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 h-14 bg-bitcoin border-b border-orange-300 flex items-center justify-between px-4 text-white">
        <button onClick={() => console.log('Abrir sidebar')}>
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold tracking-wide">Satsflow AI</h1>
        <button onClick={() => console.log('Start new chat')}>
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto pt-14 pb-28 px-4"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-center">
            Envie uma mensagem para iniciar a conversa<br />sobre Bitcoin, investimentos e criptomoedas.
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage
              key={index}
              content={msg.content}
              isAi={msg.isAi}
              isLoading={msg.isAi && isLoading && index === messages.length - 1}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-28 right-4 bg-bitcoin text-white p-2 rounded-full shadow-lg hover:bg-bitcoin/90 transition"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-20 left-0 right-0 flex justify-center px-4 z-20 md:bottom-6"
      >
        <div className="w-full max-w-2xl bg-white border shadow-lg rounded-2xl p-3 flex gap-2 items-center">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1 border-none focus:ring-0 focus:outline-none"
          />
          <Button
            type="submit"
            disabled={isLoading || !messageText.trim()}
            className="bg-bitcoin hover:bg-bitcoin/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* Barra de navegação inferior */}
      <BottomNavBar />
    </div>
  );
};

export default SatsflowAI;
