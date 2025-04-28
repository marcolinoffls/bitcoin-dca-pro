
/**
 * Componente que renderiza uma única mensagem do chat
 * Suporta mensagens do usuário e da IA, com estilos diferentes para cada
 */
import React from 'react';
import { MessageSquare, UserRound } from 'lucide-react';

interface ChatMessageProps {
  content: string;
  isAi: boolean;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ content, isAi, isLoading }) => {
  return (
    <div
      className={`flex items-start gap-3 p-4 ${
        isAi ? 'bg-gray-50' : ''
      }`}
    >
      {/* Ícone do remetente */}
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full ${
        isAi ? 'bg-btcblue text-white' : 'bg-bitcoin text-white'
      }`}>
        {isAi ? (
          <MessageSquare className="w-5 h-5" />
        ) : (
          <UserRound className="w-5 h-5" />
        )}
      </div>
      
      {/* Conteúdo da mensagem */}
      <div className={`flex-1 ${isLoading ? 'animate-pulse' : ''}`}>
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
