
/**
 * Landing Page do Bitcoin DCA Pro
 * 
 * Página de conversão e apresentação do aplicativo, acessível sem autenticação.
 * Contém seções explicativas, funcionalidades, depoimentos e chamadas para ação.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Check, BarChart3, Clock, Download, MessageCircle, BookOpen, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const LandingPage = () => {
  // Lista de funcionalidades do app
  const features = [
    {
      icon: <Shield className="h-8 w-8 text-bitcoin" />,
      title: 'Autenticação Segura',
      description: 'Acesso protegido com login e senha ou via Google.'
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-bitcoin" />,
      title: 'Painel Completo',
      description: 'Visualize seu saldo em BTC, BRL e USD com atualização em tempo real.'
    },
    {
      icon: <Clock className="h-8 w-8 text-bitcoin" />,
      title: 'Cotação e Histórico',
      description: 'Acompanhe a cotação atual e o histórico de preços do Bitcoin.'
    },
    {
      icon: <Download className="h-8 w-8 text-bitcoin" />,
      title: 'Importação Facilitada',
      description: 'Importe aportes de planilhas ou cadastre manualmente.'
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-bitcoin" />,
      title: 'Satsflow AI',
      description: 'Tire dúvidas sobre Bitcoin e investimentos com nossa IA especializada.'
    },
    {
      icon: <BookOpen className="h-8 w-8 text-bitcoin" />,
      title: 'Glossário para Iniciantes',
      description: 'Aprenda os termos essenciais do mundo Bitcoin de forma simples.'
    }
  ];

  // Lista de depoimentos
  const testimonials = [
    {
      name: 'Ricardo M.',
      role: 'Investidor há 3 anos',
      content: 'Depois que comecei a usar o Bitcoin DCA Pro, nunca mais perdi o controle dos meus aportes. Consigo ver claramente meu preço médio e quanto valorizou ao longo do tempo.',
      avatar: '👨‍💼'
    },
    {
      name: 'Fernanda S.',
      role: 'Iniciante em Bitcoin',
      content: 'Como iniciante, eu tinha medo de investir em Bitcoin. O app me deu a confiança para começar minha estratégia DCA de forma organizada.',
      avatar: '👩‍💻'
    },
    {
      name: 'Marcos P.',
      role: 'Investidor experiente',
      content: 'Finalmente um app que entende a estratégia de acumulação constante. A visualização do preço médio e da evolução do patrimônio é simplesmente perfeita.',
      avatar: '👨‍🚀'
    }
  ];

  // Perguntas frequentes
  const faqs = [
    {
      question: 'O que é DCA (Dollar-Cost Averaging)?',
      answer: 'DCA é uma estratégia de investimento que consiste em aportar valores fixos em intervalos regulares, independentemente do preço do ativo. Isso reduz o impacto da volatilidade e elimina a tentativa de "acertar" o melhor momento do mercado.'
    },
    {
      question: 'O aplicativo é gratuito?',
      answer: 'Sim, o Bitcoin DCA Pro é completamente gratuito para uso pessoal. Não há cobranças ocultas ou limitações nas funcionalidades principais.'
    },
    {
      question: 'Meus dados estão seguros?',
      answer: 'Absolutamente. Todos os dados são armazenados com criptografia e não compartilhamos suas informações com terceiros. Você pode exportar ou excluir seus dados a qualquer momento.'
    },
    {
      question: 'Posso usar em dispositivos móveis?',
      answer: 'Sim! O Bitcoin DCA Pro é responsivo e funciona perfeitamente em smartphones e tablets, além da versão desktop.'
    },
    {
      question: 'Como importo meus aportes anteriores?',
      answer: 'Você pode importar através do upload de planilhas CSV/Excel com seus aportes anteriores ou cadastrá-los manualmente no aplicativo.'
    }
  ];

  // Função para rolar suavemente até o topo
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="bg-gradient-to-b from-white to-orange-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-yellow-100 opacity-40"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-6">
              <img 
                src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/fontes//Bitcoin%20dca%20pro%20-%20caixa%20alta%20(1).png"
                alt="Bitcoin DCA Pro"
                className="h-16 md:h-20 object-contain mx-auto"
              />
            </div>
            
            {/* Headline principal */}
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Controle Total dos Seus Aportes em Bitcoin
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-2xl">
              Acompanhe seu preço médio, evolução patrimonial e maximize sua estratégia DCA 
              com a plataforma mais completa para investidores de Bitcoin.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full bg-bitcoin hover:bg-bitcoin/90 text-white font-medium text-lg py-6"
                >
                  Começar Agora
                  <ChevronRight className="h-5 w-5 ml-1" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto border-bitcoin text-bitcoin hover:bg-orange-50 font-medium text-lg py-6"
                onClick={() => {
                  const demoSection = document.getElementById('features');
                  demoSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver Demonstração
              </Button>
            </div>
            
            {/* Frase "Stay humble and stack sats" */}
            <p className="mt-6 text-sm text-gray-500 font-medium">
              Stay Humble and Stack Sats
            </p>
          </div>
        </div>

        {/* Imagem decorativa/ilustrativa */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-bitcoin/20 to-orange-300/20"></div>
      </section>

      {/* Benefits Section / Por que usar */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Por que escolher o Bitcoin DCA Pro?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Desenvolvido por Bitcoiners para Bitcoiners, nosso aplicativo torna simples 
              o acompanhamento da sua estratégia de acumulação.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefício 1 */}
            <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center text-center">
              <div className="bg-orange-100 p-3 rounded-full mb-4">
                <BarChart3 className="h-6 w-6 text-bitcoin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Visão Clara do Patrimônio</h3>
              <p className="text-gray-600">
                Acompanhe o crescimento do seu patrimônio em Bitcoin e o valor em reais ou dólares em tempo real.
              </p>
            </div>
            
            {/* Benefício 2 */}
            <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center text-center">
              <div className="bg-orange-100 p-3 rounded-full mb-4">
                <Clock className="h-6 w-6 text-bitcoin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Economize Tempo</h3>
              <p className="text-gray-600">
                Chega de planilhas complexas. Centralize todos os seus aportes em um único lugar de forma organizada.
              </p>
            </div>
            
            {/* Benefício 3 */}
            <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center text-center">
              <div className="bg-orange-100 p-3 rounded-full mb-4">
                <MessageCircle className="h-6 w-6 text-bitcoin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Suporte Inteligente</h3>
              <p className="text-gray-600">
                Tire suas dúvidas sobre Bitcoin e estratégias de investimento com nossa IA especializada.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Demonstração Visual */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Funcionalidades Poderosas e Intuitivas
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Conheça as ferramentas que vão transformar sua experiência com Bitcoin
            </p>
          </div>
          
          {/* Mockup do aplicativo */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16 max-w-4xl mx-auto">
            <div className="p-4 bg-bitcoin flex items-center justify-between">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-white text-xs">app.bitcoindcapro.com</div>
              <div className="w-8"></div>
            </div>
            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
              <img 
                src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/icones/screen_mockup.png" 
                alt="Dashboard Bitcoin DCA Pro" 
                className="object-cover w-full"
                onError={(e) => {
                  // Fallback para quando a imagem não carregar
                  const target = e.target as HTMLImageElement;
                  target.src = "https://via.placeholder.com/1200x675?text=Dashboard+Bitcoin+DCA+Pro";
                }}
              />
            </div>
          </div>
          
          {/* Lista de funcionalidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 bg-orange-100 p-3 rounded-full">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Depoimentos */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              O que dizem nossos usuários
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Junte-se aos milhares de investidores que já transformaram sua forma de acompanhar Bitcoin
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{testimonial.avatar}</div>
                <p className="text-gray-700 italic mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Tire suas dúvidas sobre o Bitcoin DCA Pro
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-bitcoin/90 to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
            Comece a controlar seus aportes agora mesmo
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 text-lg">
            Junte-se a milhares de Bitcoiners que já usam nossa plataforma para otimizar sua estratégia DCA
          </p>
          
          <Link to="/auth">
            <Button 
              size="lg" 
              className="bg-white text-bitcoin hover:bg-orange-50 font-medium text-lg py-6 px-8"
            >
              Criar Conta Gratuita
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          
          <p className="mt-4 text-white/80 text-sm">
            Sem cartão de crédito • Sem compromisso • Cancele quando quiser
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo e descrição */}
            <div className="col-span-1 md:col-span-2">
              <img 
                src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/fontes//Bitcoin%20dca%20pro%20-%20caixa%20alta%20(1).png"
                alt="Bitcoin DCA Pro"
                className="h-8 mb-4 filter brightness-0 invert"
              />
              <p className="text-gray-400 mb-4 max-w-xs">
                A forma mais simples e eficiente de acompanhar sua estratégia de acumulação de Bitcoin.
              </p>
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} Bitcoin DCA Pro. Todos os direitos reservados.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Plataforma</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/auth" className="hover:text-bitcoin">Entrar</Link></li>
                <li><Link to="/auth?signup=true" className="hover:text-bitcoin">Criar conta</Link></li>
                <li><Link to="/reset-password" className="hover:text-bitcoin">Recuperar senha</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="#" className="hover:text-bitcoin">Blog</Link></li>
                <li><Link to="#" className="hover:text-bitcoin">Termos de Uso</Link></li>
                <li><Link to="#" className="hover:text-bitcoin">Política de Privacidade</Link></li>
                <li><Link to="#" className="hover:text-bitcoin">Contato</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Botão de voltar ao topo - visível apenas após scroll */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-20 right-4 bg-bitcoin text-white p-2 rounded-full shadow-lg hover:bg-bitcoin/80 transition-all duration-300"
        style={{ display: 'block' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
};

export default LandingPage;
