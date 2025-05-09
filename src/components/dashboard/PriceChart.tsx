
/**
 * Gráfico de preço do Bitcoin
 * Exibe a variação de preço em diferentes períodos (1D, 7D, 1M, 1Y, ALL)
 * Suporta exibição em USD ou BRL conforme a preferência do usuário
 * Agora permite seleção de período personalizado
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { fetchBitcoinPriceHistory, PriceHistoryPoint } from '@/services/bitcoin';
import { CurrentRate } from '@/types';
import DateRangePicker from './DateRangePicker';
import { ChartHeader } from './chart/ChartHeader';
import { PeriodSelector } from './chart/PeriodSelector';
import { PriceChartGraph } from './chart/PriceChartGraph';
import { ChartStatus } from './chart/ChartStatus';
import { ChartFooter } from './chart/ChartFooter';

// Define os períodos de tempo disponíveis
type TimeRange = '1D' | '7D' | '1M' | '3M' | 'YTD' | '1Y' | 'ALL' | 'CUSTOM';

// Props do componente para receber a moeda selecionada e taxa de câmbio
interface PriceChartProps {
  selectedCurrency?: 'BRL' | 'USD';
  currentRate?: CurrentRate;
}

export const PriceChart = ({ 
  selectedCurrency = 'USD',
  currentRate = { usd: 0, brl: 0, timestamp: new Date() }
}: PriceChartProps) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [data, setData] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o período personalizado
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  /**
   * Função para carregar os dados baseado no período selecionado
   * Agora suporta período customizado com datas de início e fim
   */
  const loadData = async (range: TimeRange) => {
    try {
      setLoading(true); // Inicia o carregamento
      setError(null);   // Limpa erros anteriores
  
      // Busca dados com base no período selecionado
      const history = await fetchBitcoinPriceHistory(
        range, 
        selectedCurrency,
        range === 'CUSTOM' ? startDate : undefined,
        range === 'CUSTOM' ? endDate : undefined
      );
      
      console.log(`Dados carregados: ${history.length} pontos em ${selectedCurrency}`);
      setData(history);
    } catch (error) {
      console.error('Erro ao carregar dados do histórico:', error);
      setError('Não foi possível carregar os dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false); // Finaliza carregamento
    }
  };

  /**
   * Manipulador para troca de período
   * Separado para melhorar a legibilidade e permitir extensões futuras
   */
  const handleRangeChange = (range: TimeRange) => {
    // Se estiver trocando para o modo personalizado, não carrega os dados ainda
    if (range === 'CUSTOM') {
      setSelectedRange(range);
      setShowCustomRange(true);
      
      // Configura datas padrão se não estiverem definidas
      if (!startDate || !endDate) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30); // 30 dias atrás por padrão
        setStartDate(start);
        setEndDate(end);
      }
      return;
    }
    
    console.log(`Alterando período para: ${range}`);
    setSelectedRange(range);
    setShowCustomRange(false);
  };

  /**
   * Manipulador para alterações nas datas selecionadas no DateRangePicker
   */
  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start);
    setEndDate(end);
  };

  /**
   * Manipulador para aplicar o período personalizado
   */
  const handleApplyCustomRange = () => {
    if (startDate && endDate) {
      console.log(`Aplicando período personalizado: ${startDate.toLocaleDateString()} até ${endDate.toLocaleDateString()}`);
      loadData('CUSTOM');
      setShowCustomRange(false);
    }
  };

  /**
   * Manipulador para cancelar a seleção de período personalizado
   */
  const handleCancelCustomRange = () => {
    setShowCustomRange(false);
    if (selectedRange === 'CUSTOM') {
      setSelectedRange('1M'); // Volta para o período padrão
      loadData('1M');
    }
  };

  // Carrega dados iniciais e sempre que mudar o período selecionado ou a moeda
  useEffect(() => {
    if (selectedRange !== 'CUSTOM' || !showCustomRange) {
      loadData(selectedRange);
    }
  }, [selectedRange, selectedCurrency, showCustomRange]); 

  /**
   * Renderiza o gráfico dentro de um Card
   * Com estados de carregamento e erro
   */
  return (
    <Card>
      <CardHeader className="flex flex-col items-start space-y-2">
        <ChartHeader 
          data={data}
          selectedCurrency={selectedCurrency}
          currentRate={currentRate}
        />
      
        {/* Seletor de períodos */}
        <PeriodSelector 
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
        />
        
        {/* Seletor de período personalizado */}
        {showCustomRange && (
          <div className="w-full mt-2 p-3 bg-white border rounded-lg shadow-sm">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onRangeChange={handleDateRangeChange}
              onConfirm={handleApplyCustomRange}
              onCancel={handleCancelCustomRange}
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Container do gráfico com estados de carregamento e erro */}
        <div className="h-[400px] w-full relative">
          {/* Componente de status (carregando/erro) */}
          <ChartStatus 
            loading={loading}
            error={error}
            onRetry={() => loadData(selectedRange)}
          />

          {/* Gráfico */}
          <PriceChartGraph 
            data={data}
            loading={loading}
            selectedCurrency={selectedCurrency}
            selectedRange={selectedRange}
          />
        </div>
        
        {/* Rodapé com informações sobre os dados */}
        <ChartFooter 
          selectedCurrency={selectedCurrency}
          selectedRange={selectedRange}
          startDate={startDate}
          endDate={endDate}
        />
      </CardContent>
    </Card>
  );
};
