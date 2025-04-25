/**
 * Componente principal que lista os aportes do usuário
 * 
 * Gerencia:
 * - Listagem dos aportes
 * - Filtros
 * - Edição/exclusão
 * - Importação CSV
 */
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { BitcoinEntry, CurrentRate, Origin } from '@/types';
import ImportCsvModal from './ImportCsvModal';
import EntryModals from './entries/modals/EntryModals';
import EntryListHeader from './entries/EntryListHeader';
import CurrencyTabs from './entries/CurrencyTabs';
import { ColumnConfig, SortState } from '@/types/table';

interface EntriesListProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
  isLoading?: boolean;
}

const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  currentRate,
  onDelete,
  onEdit,
  selectedCurrency,
  displayUnit,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [viewCurrency, setViewCurrency] = useState<'BRL' | 'USD'>(selectedCurrency);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [originFilter, setOriginFilter] = useState<"planilha" | "corretora" | "p2p" | null>(null);
  const [registrationSourceFilter, setRegistrationSourceFilter] = useState<'manual' | 'planilha' | null>(null);
  const [yearFilter, setYearFilter] = useState<string | null>(null);
  const [tempMonthFilter, setTempMonthFilter] = useState<string | null>(null);
  const [tempYearFilter, setTempYearFilter] = useState<string | null>(null);
  const [tempOriginFilter, setTempOriginFilter] = useState<"planilha" | "corretora" | "p2p" | null>(null);
  const [tempRegistrationSourceFilter, setTempRegistrationSourceFilter] = useState<'manual' | 'planilha' | null>(null);
  const [rowsToShow, setRowsToShow] = useState<number>(30);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>([
    { id: 'date', label: 'Data', visible: true },
    { id: 'amountInvested', label: 'Valor Investido', visible: true },
    { id: 'btcAmount', label: 'Bitcoin/Satoshis', visible: true },
    { id: 'exchangeRate', label: 'Cotação', visible: true },
    { id: 'percentChange', label: 'Variação', visible: true },
    { id: 'currentValue', label: 'Valor Atual', visible: true },
    { id: 'origin', label: 'Origem', visible: true }
  ]);
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: 'desc'
  });

  const handleEditClick = (id: string) => {
    setSelectedEntryId(id);
    onEdit(id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedEntryId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    onEdit('');
  };

  const handleDeleteClose = () => {
    setIsDeleteDialogOpen(false);
    setSelectedEntryId(null);
  };

  const handleDeleteConfirm = () => {
    if (selectedEntryId) {
      onDelete(selectedEntryId);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleFilterPopoverOpenChange = (open: boolean) => {
    setIsFilterPopoverOpen(open);
    if (open) {
      setTempMonthFilter(monthFilter);
      setTempYearFilter(yearFilter);
      setTempOriginFilter(originFilter);
      setTempRegistrationSourceFilter(registrationSourceFilter);
    }
  };

  const applyFilters = () => {
    setMonthFilter(tempMonthFilter);
    setYearFilter(tempYearFilter);
    setOriginFilter(tempOriginFilter as Origin | null);
    setRegistrationSourceFilter(tempRegistrationSourceFilter);
    setIsFilterActive(
      tempMonthFilter !== null || 
      tempYearFilter !== null ||
      tempOriginFilter !== null || 
      tempRegistrationSourceFilter !== null
    );
    setIsFilterPopoverOpen(false);
  };

  const clearFilters = () => {
    setMonthFilter(null);
    setYearFilter(null);
    setOriginFilter(null);
    setRegistrationSourceFilter(null);
    setTempMonthFilter(null);
    setTempYearFilter(null);
    setTempOriginFilter(null);
    setTempRegistrationSourceFilter(null);
    setIsFilterActive(false);
  };

  const handleSort = (column: string) => {
    setSortState(prevState => ({
      column: column as any,
      direction: prevState.column === column
        ? prevState.direction === 'asc' ? 'desc' : 'asc'
        : 'desc'
    }));
  };

  const handleColumnToggle = (columnId: string) => {
    setVisibleColumns(prevColumns => 
      prevColumns.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const availableMonths = useMemo(() => {
    const months: {[key: string]: string} = {};
    entries.forEach(entry => {
      const monthKey = format(entry.date, 'yyyy-MM');
      const monthLabel = format(entry.date, 'MMMM yyyy', { locale: ptBR });
      months[monthKey] = monthLabel;
    });
    return Object.entries(months).map(([key, label]) => ({
      value: key,
      label: label.charAt(0).toUpperCase() + label.slice(1)
    }));
  }, [entries]);

  const availableYears = useMemo(() => {
    if (!entries?.length) return [];
    const years: {[key: string]: string} = {};
    entries.forEach(entry => {
      const year = format(entry.date, 'yyyy');
      years[year] = year;
    });
    return Object.entries(years)
      .map(([year]) => ({
        value: year,
        label: year
      }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter(entry => {
      if (yearFilter) {
        const entryYear = format(entry.date, 'yyyy');
        if (entryYear !== yearFilter) return false;
      }
      if (monthFilter) {
        const entryMonth = format(entry.date, 'yyyy-MM');
        if (entryMonth !== monthFilter) return false;
      }
      if (originFilter && entry.origin !== originFilter) return false;
      if (registrationSourceFilter && entry.registrationSource !== registrationSourceFilter) return false;
      return true;
    });
  }, [entries, yearFilter, monthFilter, originFilter, registrationSourceFilter]);

  const sortedEntries = useMemo(() => {
    let result = [...filteredEntries];
    if (sortState.column) {
      result.sort((a, b) => {
        let valueA: any;
        let valueB: any;
        switch (sortState.column) {
          case 'date':
            valueA = a.date.getTime();
            valueB = b.date.getTime();
            break;
          case 'amountInvested':
            valueA = a.amountInvested;
            valueB = b.amountInvested;
            break;
          case 'btcAmount':
            valueA = a.btcAmount;
            valueB = b.btcAmount;
            break;
          case 'exchangeRate':
            valueA = a.exchangeRate;
            valueB = b.exchangeRate;
            break;
          case 'percentChange':
            const currentRateValue = viewCurrency === 'USD' ? currentRate.usd : currentRate.brl;
            valueA = ((currentRateValue - a.exchangeRate) / a.exchangeRate) * 100;
            valueB = ((currentRateValue - b.exchangeRate) / b.exchangeRate) * 100;
            break;
          case 'currentValue':
            const rateValue = viewCurrency === 'USD' ? currentRate.usd : currentRate.brl;
            valueA = a.btcAmount * rateValue;
            valueB = b.btcAmount * rateValue;
            break;
          default:
            valueA = a.date.getTime();
            valueB = b.date.getTime();
        }
        return sortState.direction === 'asc' ? valueA - valueB : valueB - valueA;
      });
    } else {
      result.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    return result.slice(0, rowsToShow);
  }, [filteredEntries, rowsToShow, sortState, viewCurrency, currentRate]);

  const calculateTotals = (currencyView: 'BRL' | 'USD') => {
    const totals = {
      totalInvested: 0,
      totalBtc: 0,
      avgPrice: 0,
      percentChange: 0,
      currentValue: 0
    };
    
    if (filteredEntries.length === 0) return totals;
    
    filteredEntries.forEach(entry => {
      let investedValue = entry.amountInvested;
      if (entry.currency !== currencyView) {
        if (entry.currency === 'USD' && currencyView === 'BRL') {
          investedValue = entry.amountInvested * currentRate.brl / currentRate.usd;
        } else if (entry.currency === 'BRL' && currencyView === 'USD') {
          investedValue = entry.amountInvested * currentRate.usd / currentRate.brl;
        }
      }
      totals.totalInvested += investedValue;
      totals.totalBtc += entry.btcAmount;
    });
    
    const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
    totals.avgPrice = totals.totalBtc !== 0 ? totals.totalInvested / totals.totalBtc : 0;
    totals.currentValue = totals.totalBtc * currentRateValue;
    totals.percentChange = ((currentRateValue - totals.avgPrice) / totals.avgPrice) * 100;
    
    return totals;
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <EntryListHeader 
            isMobile={isMobile}
            isImportModalOpen={isImportModalOpen}
            setIsImportModalOpen={setIsImportModalOpen}
            isFilterActive={isFilterActive}
            isFilterPopoverOpen={isFilterPopoverOpen}
            handleFilterPopoverOpenChange={handleFilterPopoverOpenChange}
            availableMonths={availableMonths}
            availableYears={availableYears}
            tempMonthFilter={tempMonthFilter}
            tempYearFilter={tempYearFilter}
            tempOriginFilter={tempOriginFilter}
            tempRegistrationSourceFilter={tempRegistrationSourceFilter}
            setTempMonthFilter={setTempMonthFilter}
            setTempYearFilter={setTempYearFilter}
            setTempOriginFilter={setTempOriginFilter}
            setTempRegistrationSourceFilter={setTempRegistrationSourceFilter}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-bitcoin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-sm text-muted-foreground">Carregando seus aportes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <EntryListHeader 
            isMobile={isMobile}
            isImportModalOpen={isImportModalOpen}
            setIsImportModalOpen={setIsImportModalOpen}
            isFilterActive={isFilterActive}
            isFilterPopoverOpen={isFilterPopoverOpen}
            handleFilterPopoverOpenChange={handleFilterPopoverOpenChange}
            availableMonths={availableMonths}
            availableYears={availableYears}
            tempMonthFilter={tempMonthFilter}
            tempYearFilter={tempYearFilter}
            tempOriginFilter={tempOriginFilter}
            tempRegistrationSourceFilter={tempRegistrationSourceFilter}
            setTempMonthFilter={setTempMonthFilter}
            setTempYearFilter={setTempYearFilter}
            setTempOriginFilter={setTempOriginFilter}
            setTempRegistrationSourceFilter={setTempRegistrationSourceFilter}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            Você ainda não registrou nenhum aporte de Bitcoin.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedEntry = selectedEntryId 
    ? entries.find(entry => entry.id === selectedEntryId) 
    : null;

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <EntryListHeader 
            isMobile={isMobile}
            isImportModalOpen={isImportModalOpen}
            setIsImportModalOpen={setIsImportModalOpen}
            isFilterActive={isFilterActive}
            isFilterPopoverOpen={isFilterPopoverOpen}
            handleFilterPopoverOpenChange={handleFilterPopoverOpenChange}
            availableMonths={availableMonths}
            availableYears={availableYears}
            tempMonthFilter={tempMonthFilter}
            tempYearFilter={tempYearFilter}
            tempOriginFilter={tempOriginFilter}
            tempRegistrationSourceFilter={tempRegistrationSourceFilter}
            setTempMonthFilter={setTempMonthFilter}
            setTempYearFilter={setTempYearFilter}
            setTempOriginFilter={setTempOriginFilter}
            setTempRegistrationSourceFilter={setTempRegistrationSourceFilter}
            applyFilters={applyFilters}
            clearFilters={clearFilters}
            visibleColumns={visibleColumns}
            onColumnToggle={handleColumnToggle}
          />
        </CardHeader>
        <CardContent>
          <CurrencyTabs
            entries={sortedEntries}
            currentRate={currentRate}
            displayUnit={displayUnit}
            isMobile={isMobile}
            handleEditClick={handleEditClick}
            handleDeleteClick={handleDeleteClick}
            totals={calculateTotals(viewCurrency)}
            sortState={sortState}
            onSort={handleSort}
            visibleColumns={visibleColumns}
            rowsToShow={rowsToShow}
            setRowsToShow={setRowsToShow}
            onCurrencyChange={setViewCurrency}
          />
        </CardContent>
      </Card>

      <EntryModals
        isEditDialogOpen={isEditDialogOpen}
        isDeleteDialogOpen={isDeleteDialogOpen}
        selectedEntry={selectedEntry}
        currentRate={currentRate}
        displayUnit={displayUnit}
        onEditClose={handleEditClose}
        onDeleteClose={handleDeleteClose}
        onDeleteConfirm={handleDeleteConfirm}
        setIsEditDialogOpen={setIsEditDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
      />

      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['entries'] });
          toast({
            title: "Aportes importados",
            description: "Seus aportes foram importados com sucesso"
          });
        }}
      />
    </>
  );
};

export default EntriesList;
