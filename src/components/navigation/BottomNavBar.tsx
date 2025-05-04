
/**
 * Componente de Navegação Inferior
 * 
 * Exibe uma barra fixa na parte inferior da tela em dispositivos móveis
 * com ícones e rótulos para navegação entre as principais áreas do aplicativo.
 * 
 * @param currentPath - Define qual item do menu deve ser destacado como ativo
 */
import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, Plus, ClipboardList, Bot } from 'lucide-react';

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string; // Caminho para navegação ou undefined se for scroll
  scrollToId?: string; // ID do elemento para scroll ou undefined
};

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Define os items de navegação com seus ícones, labels e ações
  const navItems: NavItem[] = [
    {
      icon: Home,
      label: 'Home',
      scrollToId: 'top',
    },
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
    },
    {
      icon: Plus,
      label: 'Novo Aporte',
      scrollToId: 'entry-form',
    },
    {
      icon: ClipboardList,
      label: 'Aportes',
      scrollToId: 'entries-list',
    },
    {
      icon: Bot,
      label: 'Satsflow AI',
      path: '/satsflow-ai',
    },
  ];

  // Função para lidar com o clique nos itens de navegação
  const handleNavigation = useCallback((item: NavItem) => {
    // Se for um caminho de rota, navega para lá
    if (item.path) {
      navigate(item.path);
      return;
    }
    
    // Caso seja para rolar para um elemento específico
    if (item.scrollToId) {
      if (item.scrollToId === 'top') {
        // Rola para o topo da página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Busca o elemento pelo ID e rola até ele
        const element = document.getElementById(item.scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }, [navigate]);

  // Verifica se o item está ativo (para destacar visualmente)
  const isActive = (item: NavItem) => {
    if (item.path && currentPath === item.path) return true;
    if (item.scrollToId === 'top' && currentPath === '/') return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bitcoin shadow-lg md:hidden z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`flex flex-col items-center justify-center px-2 py-1 ${
              isActive(item) ? 'opacity-100' : 'opacity-70'
            }`}
            onClick={() => handleNavigation(item)}
            aria-label={item.label}
          >
            <item.icon className={`w-6 h-6 text-white ${isActive(item) ? 'drop-shadow-md' : ''}`} />
            <span className={`text-xs mt-1 text-white ${isActive(item) ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
      
      {/* Adiciona um espaço seguro para dispositivos com "notch" ou barra de gestos */}
      <div className="h-safe-bottom bg-bitcoin" />
    </nav>
  );
};

export default BottomNavBar;
