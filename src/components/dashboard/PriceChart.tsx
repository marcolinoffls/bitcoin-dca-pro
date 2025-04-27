/**
 * Gráfico de preço do Bitcoin
 * Exibe a variação de preço em diferentes períodos (1D, 7D, 1M, 1Y, ALL)
 * Agora busca dados reais usando o serviço BitcoinService.ts
 */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchBitcoinPriceHistory } from '@/services/BitcoinService'; // Novo serviço de histórico de preço

// Define os períodos de tempo disponíveis
type TimeRange = '1D' | '7D' | '1M' | '1Y' | 'ALL';

// Define o formato dos dados que o gráfico usa
interface PriceHistoryData {
  time: string;  // Ex: "00:00", "04/25", "2024" dependendo do período
  price: number; // Preço do Bitcoin naquele horário/data
}

export const PriceChart = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M'); // Período selecionado
  const [data, setData] = useState<PriceHistoryData[]>([]); // Dados carregados para o gráfico
  const [loading, setLoading] = useState(false); // Estado de carregamento

  /**
   * Função para carregar os dados baseado no período selecionado
   */
  const loadData = async (range: TimeRange) => {
    try {
      setLoading(true);

      // Chama a função do BitcoinService para pegar dados do histórico
      const history = await fetchBitcoinPriceHistory(range);

      // Atualiza os dados do gráfico
      setData(history);
    } catch (error) {
      console.error('Erro ao carregar dados do histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sempre que mudar o período selecionado, recarrega os dados
  useEffect(() => {
    loadData(selectedRange);
  }, [selectedRange]);

  /**
   * Renderiza o gráfico dentro de um Card
   */
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Preço do Bitcoin</CardTitle>

        {/* Botões para trocar o período */}
        <div className="flex space-x-2">
          {(['1D', '7D', '1M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={selectedRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRange(range)}
              disabled={loading} // Desativa botão enquanto carrega
            >
              {range}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {/* Container do gráfico */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            >
              {/* Gradiente de fundo */}
              <defs>
                <linearGradient id="price" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F7931A" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#F7931A" stopOpacity={0} />
                </linearGradient>
              </defs>

              {/* Eixo X (tempo) */}
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />

              {/* Eixo Y (preço) */}
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />

              {/* Tooltip (dica ao passar o mouse) */}
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  fontSize: "12px",
                }}
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Preço']}
                labelStyle={{
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              />

              {/* Linha e área preenchida */}
              <Area
                type="monotone"
                dataKey="price"
                stroke="#F7931A"
                fill="url(#price)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
