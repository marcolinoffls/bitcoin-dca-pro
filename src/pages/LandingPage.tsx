
/**
 * Página: LandingPage
 * 
 * O que faz:
 * - Serve como a página inicial pública do aplicativo.
 * - Reúne todos os componentes da landing page (Navbar, Hero, Features, etc.)
 *   em uma única visualização.
 * 
 * Onde é usado:
 * - É a rota principal ("/") da aplicação, definida em `App.tsx`.
 * 
 * Como se conecta:
 * - Não recebe props. Importa e renderiza os componentes da pasta `components/landing`.
 */
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
