
/**
 * Componente de navegação principal
 * 
 * Este componente é responsável pela barra de navegação principal do aplicativo,
 * exibindo links para as diferentes seções e a funcionalidade de logout.
 */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Settings,
  Home,
  Bitcoin,
  LogOut,
  Menu,
  X,
  ChartLineUp,
  Gauge
} from 'lucide-react';

const MainNav = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fechar o menu quando a rota mudar
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Função para verificar se uma rota está ativa
  const isActive = (path: string) => location.pathname === path;

  // Array com os itens de navegação
  const navItems = [
    {
      label: 'Início',
      path: '/',
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: 'Satsflow AI',
      path: '/satsflow-ai',
      icon: <ChartLineUp className="h-5 w-5" />,
    },
    {
      label: 'Fear & Greed',
      path: '/fear-greed-index',
      icon: <Gauge className="h-5 w-5" />,
    },
    {
      label: 'Admin',
      path: '/admin',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  // Renderização para desktop
  if (!isMobile) {
    return (
      <nav className="flex items-center space-x-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'group flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.path)
                ? 'bg-bitcoin/90 text-white shadow-sm hover:bg-bitcoin/70'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
            aria-current={isActive(item.path) ? 'page' : undefined}
          >
            {React.cloneElement(item.icon, {
              className: cn('h-4 w-4 mr-2'),
            })}
            {item.label}
          </Link>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </nav>
    );
  }

  // Renderização para mobile (botão de menu)
  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
        className="mr-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      {/* Logo Bitcoin DCA Pro para mobile */}
      <div className="flex items-center">
        <Bitcoin className="h-5 w-5 text-bitcoin mr-1" />
        <span className="font-bold text-sm">
          DCA Pro
        </span>
      </div>

      {/* Menu dropdown mobile */}
      {isMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-background shadow-lg z-50 border-b">
          <div className="flex flex-col p-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-bitcoin text-white'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {React.cloneElement(item.icon, {
                  className: 'h-4 w-4 mr-2',
                })}
                {item.label}
              </Link>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              className="flex justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainNav;
