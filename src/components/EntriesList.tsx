import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BitcoinEntry, 
  CurrentRate, 
  Origin, 
  RegistrationSource 
} from '@/types';
import { formatNumber } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogFooter, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogCancel, 
  AlertDialogAction 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useIsMobile } from '@/hooks/use-mobile';

interface EntriesListProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  onDelete: (entryId: string) => void;
  onEdit: (entry: BitcoinEntry) => void;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
  isLoading: boolean;
}

/**
 * Componente que renderiza a tabela de aportes
 */
export const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  currentRate,
  onDelete,
  onEdit,
  selectedCurrency,
  displayUnit,
  isLoading
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  // Filtra os aportes com base na query de busca
  const filteredEntries = entries.filter(entry => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      format(new Date(entry.date), 'dd/MM/yyyy', { locale: ptBR }).includes(searchTerm) ||
      entry.amountInvested.toString().includes(searchTerm) ||
      entry.btcAmount.toString().includes(searchTerm) ||
      entry.exchangeRate.toString().includes(searchTerm)
    );
  });

  // Ordena os aportes por data (do mais recente para o mais antigo)
  const sortedEntries = filteredEntries.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Formatação de moeda
  const formatCurrency = (value: number, currency: 'BRL' | 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  // Formatação de bitcoin
  const formatBitcoin = (value: number, displayUnit: 'BTC' | 'SATS') => {
    const formattedValue = formatNumber(value, 8);
    return `${formattedValue} ${displayUnit === 'BTC' ? 'BTC' : 'Sats'}`;
  };

  // Calcula o valor atual do aporte
  const calculateCurrentValue = (entry: BitcoinEntry) => {
    const currentRateValue = selectedCurrency === 'BRL' ? currentRate.brl : currentRate.usd;
    const currentValue = entry.btcAmount * currentRateValue;
    return formatCurrency(currentValue, selectedCurrency);
  };

  // Calcula a performance do aporte
  const calculatePerformance = (entry: BitcoinEntry) => {
    const currentRateValue = selectedCurrency === 'BRL' ? currentRate.brl : currentRate.usd;
    const currentValue = entry.btcAmount * currentRateValue;
    const performance = ((currentValue - entry.amountInvested) / entry.amountInvested) * 100;
    return `${performance > 0 ? '+' : ''}${formatNumber(performance, 2)}%`;
  };

  // Formatação da data para exibição
  const formatEntryDate = (date: Date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Determina o tipo de badge baseado na origem
  const getOriginBadge = (origin: Origin) => {
    if (origin === 'corretora') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">Corretora</Badge>;
    } else if (origin === 'p2p') {
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">P2P</Badge>;
    }
    return null; // Não deve ocorrer com a tipagem correta
  };

  // Determina o tipo de badge para origem de registro
  const getRegistrationSourceBadge = (registrationSource?: RegistrationSource) => {
    if (registrationSource === 'planilha') {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">Planilha</Badge>;
    }
    return null; // Para registro manual, não exibe badge
  };

  // Mapeia os aportes para linhas da tabela
  const renderEntries = () => {
    // Caso os dados estejam carregando, exibir mensagem
    if (isLoading) {
      return (
        <tr>
          <td colSpan={8} className="py-4 text-center">
            Carregando aportes...
          </td>
        </tr>
      );
    }

    // Caso não haja aportes, exibir mensagem
    if (sortedEntries.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="py-4 text-center">
            Nenhum aporte encontrado.
          </td>
        </tr>
      );
    }

    // Renderiza uma linha para cada aporte
    return sortedEntries.map((entry) => {
      // Para aportes de planilha, garantir que origin seja somente 'corretora' ou 'p2p'
      const safeOrigin: Origin = entry.origin === 'corretora' || entry.origin === 'p2p' 
        ? entry.origin 
        : 'corretora';
      
      return (
        <tr key={entry.id} className="hover:bg-muted/50">
          <td className="py-2.5 px-3 text-center">
            {formatEntryDate(entry.date)}
          </td>
          <td className="py-2.5 px-3 text-right">
            {formatCurrency(entry.amountInvested, entry.currency)}
          </td>
          <td className="py-2.5 px-3 text-right">
            {formatBitcoin(entry.btcAmount, displayUnit)}
          </td>
          <td className="py-2.5 px-3 text-right">
            {formatCurrency(entry.exchangeRate, entry.currency)}
          </td>
          <td className="py-2.5 px-3 text-right">
            {calculateCurrentValue(entry)}
          </td>
          <td className="py-2.5 px-3 whitespace-nowrap text-center">
            {getOriginBadge(safeOrigin)}
            {entry.registrationSource === 'planilha' && (
              <span className="ml-1">{getRegistrationSourceBadge(entry.registrationSource)}</span>
            )}
          </td>
          <td className="py-2.5 px-3 text-right">
            {calculatePerformance(entry)}
          </td>
          <td className="py-2.5 px-3 text-right">
            <div className="flex items-center justify-end gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => onEdit(entry)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este aporte? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(entry.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div>
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={isMobile ? "text-sm" : ""}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 rounded-md border shadow-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                scope="col"
                className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
              >
                Data
              </th>
              <th
                scope="col"
                className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
              >
                Valor Investido
              </th>
              <th
                scope="col"
                className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
              >
                Bitcoin
              </th>
              <th
                scope="col"
                className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
              >
                Cotação
              </th>
              <th
                scope="col"
                className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
              >
                Valor Atual
              </th>
              <th
                scope="col"
                className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
              >
                Origem
              </th>
              <th
                scope="col"
                className="py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-300"
              >
                Performance
              </th>
              <th scope="col" className="relative py-3.5 px-3">
                <span className="sr-only">Editar</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {renderEntries()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EntriesList;
