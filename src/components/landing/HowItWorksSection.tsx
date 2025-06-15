
/**
 * Componente: HowItWorksSection
 * 
 * O que faz:
 * - Descreve em 3 passos simples como o usuário pode começar a usar o aplicativo.
 * 
 * Onde é usado:
 * - Na `LandingPage.tsx`.
 * 
 * Como se conecta:
 * - Não recebe props.
 */
export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Comece em Minutos</h2>
          <p className="mt-2 text-muted-foreground">Siga estes 3 passos simples para assumir o controle dos seus aportes.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-bitcoin text-white font-bold text-xl mx-auto mb-4">1</div>
            <h3 className="text-xl font-semibold">Crie sua Conta</h3>
            <p className="mt-2 text-muted-foreground">Cadastre-se gratuitamente e de forma segura para ter acesso à plataforma.</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-bitcoin text-white font-bold text-xl mx-auto mb-4">2</div>
            <h3 className="text-xl font-semibold">Registre seus Aportes</h3>
            <p className="mt-2 text-muted-foreground">Adicione seus investimentos manualmente ou importe de uma planilha/mensagem.</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-bitcoin text-white font-bold text-xl mx-auto mb-4">3</div>
            <h3 className="text-xl font-semibold">Acompanhe a Evolução</h3>
            <p className="mt-2 text-muted-foreground">Visualize seu preço médio, rentabilidade e outras métricas importantes.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
