
/**
 * Componente do gráfico de preços do Bitcoin
 * 
 * Função: Renderiza o gráfico de área com os dados históricos de preço
 * Usado em: PriceChart
 */
import React, { useState } from 'react';
import { PriceHistoryPoint } from '@/services/bitcoin/priceHistory';
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine
} from 'recharts';

interface PriceChartGraphProps {
  data: PriceHistoryPoint[];
  loading: boolean;
  selectedCurrency: 'BRL' | 'USD';
  selectedRange: string;
}

export const PriceChartGraph: React.FC<PriceChartGraphProps> = ({ 
  data,
  loading,
  selectedCurrency,
  selectedRange
}) => {
  const [hoveredPrice, setHoveredPrice] = useState<number | null>(null);
  
  /**
   * Retorna o símbolo da moeda atual para exibição no gráfico
   */
  const getCurrencySymbol = (): string => {
    return selectedCurrency === 'BRL' ? 'R$' : '$';
  };

  /**
   * Formata o valor para exibição no tooltip com símbolo correto
   */
  const formatCurrencyValue = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: selectedCurrency,
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
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
    
        {/* Eixo X - Atualizado para usar o formato correto */}
        <XAxis
          dataKey="time"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          minTickGap={15}
        />

        {/* Eixo Y */}
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          mirror
          dx={1} // move o texto para dentro do gráfico
          tickFormatter={(value) => `${getCurrencySymbol()}${value.toLocaleString()}`}
          domain={['auto', 'auto']}
        />

        {/* Linha horizontal quando o mouse passa por um ponto */}
        {hoveredPrice && (
          <ReferenceLine
            y={hoveredPrice}
            stroke="#F7931A"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
    
        {/* Tooltip com captura do valor */}
        <Tooltip
          content={({ payload, label }) => {
            if (payload?.[0]?.value !== undefined) {
              setHoveredPrice(Number(payload[0].value));
            }
            return (
              <div
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  padding: "10px",
                  fontSize: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <div>
                  <strong>
                    {selectedRange === "1D" && `Horário: ${label}`}
                    {["7D", "1M", "3M", "YTD"].includes(selectedRange) && `Data: ${label}`}
                    {["1Y", "ALL", "CUSTOM"].includes(selectedRange) && `Data: ${label}`}
                  </strong>
                </div>
                <div>
                  Preço: {payload?.[0]?.value !== undefined ? formatCurrencyValue(Number(payload[0].value)) : ""}
                </div>
              </div>
            );
          }}
        />

        {/* Linha de dados */}
        <Area
          type="monotone"
          dataKey="price"
          stroke="#F7931A"
          fill="url(#price)"
          strokeWidth={2}
          isAnimationActive={!loading}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
