
/**
 * Componente: FaqSection
 * 
 * O que faz:
 * - Apresenta uma lista de perguntas e respostas frequentes em um formato de acordeão.
 * - Ajuda a tirar dúvidas comuns dos usuários antes de se cadastrarem.
 * 
 * Onde é usado:
 * - Na `LandingPage.tsx`.
 * 
 * Como se conecta:
 * - Utiliza os componentes de Accordion do `shadcn/ui`.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FaqSection() {
  return (
    <section className="py-20 bg-muted/40 dark:bg-card">
      <div className="container max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-btcblue dark:text-white">Perguntas Frequentes</h2>
          <p className="mt-2 text-muted-foreground">Tirando suas principais dúvidas sobre o Bitcoin DCA Pro.</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>O que é a estratégia DCA (Dollar Cost Averaging)?</AccordionTrigger>
            <AccordionContent>
              DCA é uma estratégia de investimento que consiste em fazer aportes de valores fixos em intervalos de tempo regulares, independentemente da cotação do ativo. Isso ajuda a reduzir o impacto da volatilidade e a construir um preço médio mais estável ao longo do tempo.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Meus dados de investimento estão seguros?</AccordionTrigger>
            <AccordionContent>
              Sim. A segurança é nossa prioridade. Todos os seus dados são armazenados de forma segura e criptografada. Nós nunca compartilharemos suas informações financeiras com terceiros.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>O aplicativo é gratuito?</AccordionTrigger>
            <AccordionContent>
              Sim, o Bitcoin DCA Pro oferece um plano gratuito completo com todas as funcionalidades essenciais para você acompanhar seus aportes. Futuramente, poderemos oferecer planos premium com recursos avançados.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Posso importar aportes de qualquer corretora?</AccordionTrigger>
            <AccordionContent>
              Você pode importar seus aportes através de um arquivo CSV padronizado. Fornecemos um modelo para você preencher com seus dados de qualquer corretora ou carteira e importar para a plataforma de forma simples.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
