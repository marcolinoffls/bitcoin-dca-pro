import React, { useRef, useState, useEffect } from 'react';
import { Menu, Send, Plus, ArrowDown } from 'lucide-react';
import ChatMessage from '@/components/chat/ChatMessage';
import { useChatAi } from '@/hooks/useChatAi';
import { Button } from '@/components/ui/button';

const SatsflowAI: React.FC = () => {
  const [messageText, setMessageText] = useState('');
  const { messages, isLoading, sendMessage, chatId } = useChatAi();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll para a última mensagem sempre que a lista mudar
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detecta se usuário está longe do fim da lista
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const el = scrollContainerRef.current;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distance > 300);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Envia a mensagem ao apertar o botão ou Enter
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    await sendMessage(messageText);
    setMessageText('');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Topo fixo */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-bitcoin z-10 flex items-center justify-between px-4 text-white border-b border-orange-300">
        <button onClick={() => console.log('Abrir menu')}>
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold tracking-wide">Satsflow AI</h1>
        <button onClick={() => console.log('Novo chat')}>
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Área das mensagens - somente aqui tem scroll */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pt-14 pb-[100px] px-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
            Envie uma mensagem para iniciar a conversa<br />
            sobre Bitcoin, investimentos e criptomoedas.
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

      {/* Botão flutuante de rolar até o fim */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-[90px] right-4 bg-bitcoin text-white p-2 rounded-full shadow-lg z-30"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Campo de mensagem fixo na parte inferior */}
      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t shadow z-20"
      >
        <div className="max-w-2xl mx-auto flex gap-2 items-center border border-orange-300 rounded-2xl p-2">
          {/* Textarea com quebra de linha e fonte >= 16px */}
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none border-none focus:outline-none focus:ring-0 text-base leading-snug"
            style={{ fontSize: 16 }}
          />
          {/* Botão de envio */}
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
