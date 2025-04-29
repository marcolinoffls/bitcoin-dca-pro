
/**
 * Página principal do Satsflow AI
 * Interface de chat para interação com IA especializada em Bitcoin
 */
import React, { useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatMessage from '@/components/chat/ChatMessage';
import { useChatAi } from '@/hooks/useChatAi';

const SatsflowAI: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const { messages, isLoading, sendMessage } = useChatAi();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    await sendMessage(inputMessage);
    setInputMessage('');
    
    // Scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Cabeçalho */}
      <div className="border-b p-4">
        <h1 className="text-xl font-semibold text-btcblue">Satsflow AI</h1>
        <p className="text-sm text-gray-500">Converse com nossa IA especialista em Bitcoin</p>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            content={msg.content}
            isAi={msg.isAi}
            isLoading={msg.isAi && isLoading && index === messages.length - 1}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulário de input */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !inputMessage.trim()}
            className="bg-bitcoin hover:bg-bitcoin/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SatsflowAI;
