
/**
 * Componente que permite alternar entre visualização em BRL e USD
 */
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EntriesTable } from './EntriesTable';
import { BitcoinEntry, CurrentRate } from '@/types';
import { ROWS_PER_PAGE_OPTIONS } from './constants';
import { ColumnConfig, SortState } from '@/types/table';

interface CurrencyTabsProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  displayUnit: 'BTC' | 'SATS';
  isMobile: boolean;
  handleEditClick: (id: string) => void;
  handleDeleteClick: (id: string) => void;
  totals: {
    totalInvested: number;
    totalBtc: number;
    avgPrice: number;
    percentChange: number;
    currentValue: number;
  };
  sortState: SortState;
  onSort: (column: string) => void;
  visibleColumns: ColumnConfig[];
  rowsToShow: number;
  setRowsToShow: (value: number) => void;
  onCurrencyChange: (value: 'BRL' | 'USD') => void;
}

const CurrencyTabs: React.FC<CurrencyTabsProps> = ({
  entries,
  currentRate,
  displayUnit,
  isMobile,
  handleEditClick,
  handleDeleteClick,
  totals,
  sortState,
  onSort,
  visibleColumns,
  rowsToShow,
  setRowsToShow,
  onCurrencyChange,
}) => {
  return (
    <Tabs defaultValue="brl" className="w-full" onValueChange={(value) => onCurrencyChange(value as 'BRL' | 'USD')}>
      <TabsList className="mb-4 grid w-full grid-cols-2">
        <TabsTrigger value="brl" className="rounded-l-md rounded-r-none border-r">
          Exibir em BRL (R$)
        </TabsTrigger>
        <TabsTrigger value="usd" className="rounded-r-md rounded-l-none border-l">
          Exibir em USD ($)
        </TabsTrigger>
      </TabsList>
      
      {['brl', 'usd'].map((currency) => (
        <TabsContent key={currency} value={currency}>
          <div className="overflow-x-auto">
            <EntriesTable 
              entries={entries}
              currencyView={currency.toUpperCase() as 'BRL' | 'USD'}
              currentRate={currentRate}
              displayUnit={displayUnit}
              isMobile={isMobile}
              handleEditClick={handleEditClick}
              handleDeleteClick={handleDeleteClick}
              totals={totals}
              sortState={sortState}
              onSort={onSort}
              visibleColumns={visibleColumns}
            />
            <div className="flex justify-end mt-4">
              <div className="flex items-center">
                <span className="text-sm mr-2">Exibir:</span>
                <Select 
                  value={rowsToShow.toString()} 
                  onValueChange={(value) => setRowsToShow(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="10 linhas" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROWS_PER_PAGE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default CurrencyTabs;
