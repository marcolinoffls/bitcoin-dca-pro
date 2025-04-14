
/**
 * Hook personalizado para gerenciar a visibilidade do saldo do portfólio
 * 
 * Este hook:
 * - Gerencia o estado de visibilidade do saldo (mostrar/ocultar)
 * - Salva a preferência do usuário no localStorage
 * - Recupera a preferência salva ao inicializar o componente
 * 
 * @returns Um objeto com o estado atual de visibilidade e uma função para alternar
 */
import { useState, useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'bitcoinDcaPro_balanceVisibility';

export function useBalanceVisibility() {
  // Inicializa o estado com o valor do localStorage ou true (visível) por padrão
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Ao montar o componente, verifica se há uma preferência salva
  useEffect(() => {
    try {
      const savedPreference = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedPreference !== null) {
        setIsVisible(JSON.parse(savedPreference));
      }
    } catch (error) {
      console.error('Erro ao recuperar preferência de visibilidade:', error);
      // Em caso de erro, mantém o padrão visível
    }
  }, []);

  // Função para alternar a visibilidade e salvar no localStorage
  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newVisibility));
    } catch (error) {
      console.error('Erro ao salvar preferência de visibilidade:', error);
    }
  };

  return { isVisible, toggleVisibility };
}
