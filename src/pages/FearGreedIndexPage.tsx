
/**
 * Página de demonstração do Fear & Greed Index
 * 
 * Esta página exibe o componente FearGreedIndex em uma interface simples,
 * mostrando o indicador de medo e ganância do mercado de criptomoedas.
 */

import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layout/MainLayout';
import FearGreedIndex from '@/components/FearGreedIndex';

export default function FearGreedIndexPage() {
  return (
    <>
      <Helmet>
        <title>Fear & Greed Index | Bitcoin DCA Pro</title>
      </Helmet>
      
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold text-center mb-8">
            Índice de Medo e Ganância
          </h1>
          
          <div className="max-w-md mx-auto">
            <FearGreedIndex />
            
            <div className="mt-8 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <h2 className="font-medium mb-2">O que é o Índice de Medo e Ganância?</h2>
              <p className="mb-2">
                O Fear & Greed Index mede o sentimento do mercado de criptomoedas em uma escala de 0 a 100:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><span className="text-red-500 font-medium">0-25</span>: Medo extremo (possível oportunidade de compra)</li>
                <li><span className="text-orange-500 font-medium">26-45</span>: Medo</li>
                <li><span className="text-yellow-500 font-medium">46-55</span>: Neutro</li>
                <li><span className="text-green-400 font-medium">56-75</span>: Ganância</li>
                <li><span className="text-green-600 font-medium">76-100</span>: Ganância extrema (possível sinal de correção)</li>
              </ul>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
