
/**
 * Componente: FeaturesSection
 * 
 * O que faz:
 * - Exibe os principais recursos e funcionalidades do aplicativo em um layout de grade.
 * - Cada recurso tem um ícone, título e descrição para explicar seus benefícios.
 * 
 * Onde é usado:
 * - Na `LandingPage.tsx`.
 * 
 * Como se conecta:
 * - Não recebe props. Utiliza ícones do `lucide-react`.
 */
import { List, CircleDollarSign, FileText, Search, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const features = [
  {
    icon: <List size={24} className="text-bitcoin" />,
    title: 'Dashboard Intuitivo',
    description: 'Visualize seu saldo, total aportado e a evolução do seu portfólio em BTC ou SATS, e em BRL ou USD.',
  },
  {
    icon: <CircleDollarSign size={24} className="text-bitcoin" />,
    title: 'Cotação em Tempo Real',
    description: 'Acompanhe o preço atual do Bitcoin e sua variação diária para tomar decisões informadas.',
  },
  {
    icon: <Plus size={24} className="text-bitcoin" />,
    title: 'Registro Fácil de Aportes',
    description: 'Cadastre novos aportes de forma manual, seja de corretora ou P2P, com todos os detalhes da transação.',
  },
  {
    icon: <FileText size={24} className="text-bitcoin" />,
    title: 'Importe de Planilhas e Mensagens',
    description: 'Suba seu histórico via CSV ou cole mensagens da P2P (Satisfaction) para um registro rápido e sem erros.',
  },
  {
    icon: <Search size={24} className="text-bitcoin" />,
    title: 'Histórico Detalhado',
    description: 'Analise todos os seus aportes com filtros avançados. Edite ou exclua registros com facilidade.',
  },
  {
    icon: <img src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/public-assets/Simbolo%20%20favcon.png" alt="Satsflow AI" className="h-6 w-6" />,
    title: 'Satsflow AI',
    description: 'Converse com nossa IA especialista em Bitcoin para tirar dúvidas e obter insights sobre o mercado.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-muted/40 dark:bg-card">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Recursos Poderosos para sua Estratégia</h2>
          <p className="mt-2 text-muted-foreground">Tudo o que você precisa para gerenciar seus investimentos em Bitcoin.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">{feature.title}</CardTitle>
                <CardDescription className="text-base">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
