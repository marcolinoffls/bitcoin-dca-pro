/**
 * Componente que exibe o card de cotação atual do Bitcoin
 * 
 * Mostra o preço atual em USD e BRL, além das variações percentuais
 * em diferentes períodos (24h, 7d, 30 dias, 1 ano)
 * Agora o botão de dashboard abre um Popover com aviso,
 * e é possível fechá-lo com o botão "Fechar".
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrentRate, PriceVariation } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw, Triangle, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatNumber } from '@/lib/utils';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Definição das props esperadas pelo componente
interface CurrentRateCardProps {
  currentRate: CurrentRate;
  priceVariation: PriceVariation;
  isLoading: boolean;
  onRefresh: () => void;
}

const CurrentRateCard: React.FC<CurrentRateCardProps> = ({
  currentRate,
  priceVariation,
  isLoading,
  onRefresh,
}) => {
  // Estado para controle de visibilidade do Popover
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Renderiza o item de variação de preço (usado abaixo)
  const PriceVariationItem = ({
    label,
    value,
  }: {
    label: string;
    value: number;
  }) => (
    <div className="flex flex-col items-center text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
        <Triangle className={`w-3 h-3 ${value >= 0 ? 'rotate-0' : 'rotate-180'}`} />
        {formatNumber(Math.abs(value))}%
      </span>
    </div>
  );

  return (
    <Card className="rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 h-[220px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
        {/* Logo + título do card */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center">
            <img 
              src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/cotacao4.png"
              alt="Cotação Bitcoin"
              className="h-full w-full object-contain"
            />
          </div>
          <CardTitle className="text-base font-semibold text-gray-500">COTAÇÃO ATUAL DO BITCOIN</CardTitle>
        </div>

        {/* Botão do dashboard com popover controlado por estado */}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted"
              aria-label="Ver Dashboard"
            >
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Dashboard</h4>
                <p className="text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento. Estará disponível em versões futuras do bitcoin DCA PRO.
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-20"
                  onClick={() => setIsPopoverOpen(false)} // Fecha o popover
                >
                  Fechar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>

      <CardContent className="pt-1 px-4 pb-2">
        <div className="flex justify-between">
          {/* USD e BRL side-by-side */}
          <div className="text-sm">
            <div className="text-muted-foreground">USD</div>
            <div className="text-xl font-semibold">${formatNumber(currentRate.usd)}</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">BRL</div>
            <div className="text-xl font-semibold">R$ {formatNumber(currentRate.brl)}</div>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <PriceVariationItem label="24 horas" value={priceVariation['24h']} />
          <PriceVariationItem label="7 dias" value={priceVariation['7d']} />
          <PriceVariationItem label="30 dias" value={priceVariation['30d']} />
          <PriceVariationItem label="1 ano" value={priceVariation['1y']} />
        </div>

        <div className="flex justify-between items-center text-xs text-muted-foreground mt-4">
          <span>Atualizado: {format(currentRate.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentRateCard;
