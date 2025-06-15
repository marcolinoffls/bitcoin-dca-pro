
/**
 * Componente: Navbar
 * 
 * O que faz:
 * - Exibe a barra de navegação superior da landing page.
 * - Contém o logo do app e um botão de ação para levar o usuário à página de login/cadastro.
 * 
 * Onde é usado:
 * - No topo da `LandingPage.tsx`.
 * 
 * Como se conecta:
 * - Não recebe props.
 * - Usa o componente Link do `react-router-dom` para navegação interna.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-5xl items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/public-assets/Simbolo%20%20favcon.png" 
              alt="Logo Bitcoin DCA Pro" 
              className="h-6 w-6" 
            />
            <span className="font-bold">Bitcoin DCA Pro</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild>
            <Link to="/auth">Acessar App</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
