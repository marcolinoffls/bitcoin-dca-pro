
/**
 * Componente: HeroSection
 * 
 * O que faz:
 * - Apresenta o título principal, subtítulo e o botão de chamada para ação (CTA).
 * - É a principal seção de boas-vindas da landing page.
 * 
 * Onde é usado:
 * - Na `LandingPage.tsx`.
 * 
 * Como se conecta:
 * - Não recebe props.
 * - Usa o `react-router-dom` para o link do botão.
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="py-20 text-center">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight text-btcblue dark:text-white md:text-6xl">
          Controle seus investimentos em Bitcoin com a estratégia DCA
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Stay humble and stack Sats. A plataforma completa para acompanhar seus aportes e otimizar sua estratégia de investimento em Bitcoin.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" asChild className="bg-bitcoin text-primary-foreground hover:bg-bitcoin/90">
            <Link to="/auth">Comece agora</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-bitcoin text-bitcoin hover:bg-bitcoin hover:text-primary-foreground">
            <a href="#features">Conheça os recursos</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
