
/**
 * Componente: SuccessToast
 * 
 * Função: Exibe um toast de sucesso com ícone de Bitcoin e mensagem personalizada.
 * Usado quando uma operação importante é concluída com sucesso, como um novo aporte.
 * 
 * Estilo: Toast centralizado com animação fade-in/out e ícone do Bitcoin.
 */
import React, { useEffect, useState } from 'react';
import { CheckCircle, Bitcoin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessToastProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
  showBitcoin?: boolean;
}

const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  isOpen,
  onClose,
  autoClose = true,
  autoCloseTime = 3000,
  showBitcoin = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Controla a animação e o fechamento automático
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      
      // Reproduzir o som quando o toast abrir
      const audio = new Audio('https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/audio/moeda.MP3');
      audio.volume = 0.5; // Volume moderado
      
      // Tenta reproduzir o áudio (alguns navegadores bloqueiam sem interação do usuário)
      audio.play().catch(err => {
        console.log('Não foi possível reproduzir o áudio automaticamente:', err);
      });
      
      // Fecha automaticamente após o tempo definido
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          const fadeTimer = setTimeout(() => {
            onClose();
          }, 300); // Tempo para a animação de fade-out
          
          return () => clearTimeout(fadeTimer);
        }, autoCloseTime);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, autoClose, autoCloseTime, onClose]);

  // Se não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 flex items-center justify-center z-50 bg-black/20 transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    >
      <div 
        className={cn(
          "bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center gap-3 max-w-sm w-11/12 transition-all duration-300",
          isVisible ? "opacity-100 transform scale-100" : "opacity-0 transform scale-95"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showBitcoin ? (
          <div className="bg-bitcoin/10 rounded-full p-2">
            <Bitcoin className="h-6 w-6 text-bitcoin animate-pulse" />
          </div>
        ) : (
          <CheckCircle className="h-6 w-6 text-green-500" />
        )}
        
        <span className="text-gray-800 dark:text-gray-100 font-medium">
          {message}
        </span>
      </div>
    </div>
  );
};

export default SuccessToast;
