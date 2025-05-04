
/**
 * Componente FearGreedIndex
 * 
 * Este componente apresenta o indicador "Fear & Greed Index" do mercado de criptomoedas
 * em formato de velocímetro semicircular, simulando o estilo do CoinMarketCap.
 * 
 * O componente:
 * - Busca dados da API do CoinMarketCap
 * - Renderiza um velocímetro com gradiente de cores (vermelho a verde)
 * - Posiciona um ponteiro indicando o valor atual do índice
 * - Exibe o valor numérico, status textual e horário de atualização
 * 
 * As cores do velocímetro indicam diferentes níveis de medo/ganância:
 * - Vermelho (0-25): Medo extremo
 * - Laranja (26-45): Medo
 * - Amarelo (46-55): Neutro
 * - Verde claro (56-75): Ganância
 * - Verde escuro (76-100): Ganância extrema
 */

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Interface para os dados retornados pela API
interface FearGreedData {
  value: number;
  value_classification: string;
  timestamp: string;
}

// Mock de dados para desenvolvimento local (já que a API real requer chave)
const MOCK_DATA: FearGreedData = {
  value: 53, // Valor mostrado na imagem de referência
  value_classification: "Neutral",
  timestamp: new Date().toISOString()
};

// Função para mapear o valor do índice para um ângulo no semicírculo (0-100 → 0-180 graus)
const mapValueToAngle = (value: number): number => {
  // Garante que o valor está dentro do intervalo 0-100
  const safeValue = Math.max(0, Math.min(100, value));
  // Converte para ângulo (0-100 → 0-180 graus)
  return (safeValue / 100) * 180;
};

// Função para determinar a classificação em português com base no valor
const getClassificationPtBr = (classification: string): string => {
  const map: Record<string, string> = {
    "Extreme Fear": "Medo Extremo",
    "Fear": "Medo",
    "Neutral": "Neutro",
    "Greed": "Ganância",
    "Extreme Greed": "Ganância Extrema"
  };
  
  return map[classification] || "Neutro";
};

const FearGreedIndex = () => {
  // Estado para armazenar os dados do índice
  const [fearGreedData, setFearGreedData] = useState<FearGreedData | null>(null);
  // Estado para controlar carregamento e erros
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Efeito para buscar os dados da API
  useEffect(() => {
    const fetchFearGreedIndex = async () => {
      setLoading(true);
      try {
        // Em um ambiente real, descomentar o código abaixo e usar uma chave API válida
        /*
        const response = await fetch(
          "https://pro-api.coinmarketcap.com/v3/fear-and-greed/latest",
          {
            headers: {
              "X-CMC_PRO_API_KEY": "SUA_CHAVE_API_AQUI"
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        setFearGreedData(data.data);
        */
        
        // Usando dados mockados para desenvolvimento
        // Em produção, substituir por chamada real à API
        setTimeout(() => {
          setFearGreedData(MOCK_DATA);
          setLoading(false);
        }, 500); // Simulando carregamento
      } catch (err) {
        console.error("Erro ao buscar dados do Fear & Greed Index:", err);
        setError("Falha ao carregar o índice. Tente novamente mais tarde.");
        setLoading(false);
      }
    };

    fetchFearGreedIndex();
  }, []);

  // Se estiver carregando, mostra indicador de carregamento
  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
        </CardContent>
      </Card>
    );
  }

  // Se houver erro, mostra mensagem de erro
  if (error || !fearGreedData) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-red-500">
            {error || "Não foi possível obter dados do índice"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Valor do índice e classificação
  const value = fearGreedData.value;
  const classification = fearGreedData.value_classification;
  const classificationPtBr = getClassificationPtBr(classification);
  
  // Data de atualização formatada
  const updateDate = format(
    new Date(fearGreedData.timestamp),
    "dd/MM/yyyy HH:mm",
    { locale: ptBR }
  );

  // Cálculo do ângulo do ponteiro
  const pointerAngle = mapValueToAngle(value);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-center">
          CMC Crypto Fear and Greed Index
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6 pt-2">
        {/* Velocímetro (semicírculo) */}
        <div className="relative w-full max-w-[280px] aspect-[2/1]">
          {/* Semicírculo com gradiente de cores */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/2 rounded-t-full overflow-hidden"
            style={{
              background: "conic-gradient(from 180deg at 50% 100%, #ea384c 0%, #ea384c 13.9%, #F97316 13.9%, #F97316 25%, #FEF7CD 25%, #FEF7CD 30.5%, #F2FCE2 30.5%, #F2FCE2 41.7%, #16a34a 41.7%, #16a34a 50%)",
              transform: "rotate(0deg)"
            }}
            aria-hidden="true"
          />
          
          {/* Ponteiro (círculo no topo da linha) */}
          <div 
            className="absolute left-1/2 bottom-0 h-1/2 w-0.5 bg-black origin-bottom"
            style={{
              transform: `rotate(${pointerAngle}deg)`
            }}
          >
            {/* Círculo na ponta do ponteiro */}
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full"
            />
          </div>
        </div>
        
        {/* Valor numérico e classificação */}
        <div className="flex flex-col items-center mt-5">
          <span className="text-4xl font-bold">{value}</span>
          <span className="text-gray-500 text-sm mt-1">{classificationPtBr}</span>
        </div>
        
        {/* Data de atualização */}
        <div className="mt-4 text-xs text-gray-400">
          Atualizado: {updateDate}
        </div>
      </CardContent>
    </Card>
  );
};

export default FearGreedIndex;
