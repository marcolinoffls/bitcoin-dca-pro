
import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculatePercentageChange } from '@/services/bitcoinService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, Filter, SlidersHorizontal } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { BitcoinEntry, CurrentRate, Origin } from '@/types';
import EntryEditForm from '@/components/EntryEditForm';
import ImportCsvModal from './ImportCsvModal';
import { EntriesTable } from './entries/EntriesTable';
import { EntryFilters } from './entries/EntryFilters';
import { ROWS_PER_PAGE_OPTIONS } from './entries/constants';
import { useQueryClient } from '@tanstack/react-query';
import { ColumnConfig, SortState, DEFAULT_COLUMNS } from '@/types/table';
import ColumnVisibilityControl from './entries/ColumnVisibilityControl';

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
  const [originFilter, setOriginFilter] = useState<Origin | null>(null);
  const [registrationSourceFilter, setRegistrationSourceFilter] = useState<'manual' | 'planilha' | null>(null);
  
  const [tempMonthFilter, setTempMonthFilter] = useState<string | null>(null);
  const [tempOriginFilter, setTempOriginFilter] = useState<Origin | null>(null);
  const [tempRegistrationSourceFilter, setTempRegistrationSourceFilter] = useState<'manual' | 'planilha' | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  const [rowsToShow, setRowsToShow] = useState<number>(10);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Estado para controle de ordenação
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: 'desc'
  });

  // Estado para controle de colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

  const handleEditClick = (id: string) => {
    setSelectedEntryId(id);
    onEdit(id);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setSelectedEntryId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedEntryId) {
      onDelete(selectedEntryId);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEditClose = () => {
    setIsEditDialogOpen(false);
    onEdit('');
  };

  const handleFilterPopoverOpenChange = (open: boolean) => {
    setIsFilterPopoverOpen(open);
    if (open) {
      setTempMonthFilter(monthFilter);
      setTempOriginFilter(originFilter);
      setTempRegistrationSourceFilter(registrationSourceFilter);
    }
  };

  const applyFilters = () => {
    setMonthFilter(tempMonthFilter);
    setOriginFilter(tempOriginFilter);
    setRegistrationSourceFilter(tempRegistrationSourceFilter);
    setIsFilterActive(
      tempMonthFilter !== null || 
      tempOriginFilter !== null || 
      tempRegistrationSourceFilter !== null
    );
    setIsFilterPopoverOpen(false);
  };

  const clearFilters = () => {
    setMonthFilter(null);
    setOriginFilter(null);
    setRegistrationSourceFilter(null);
    setTempMonthFilter(null);
    setTempOriginFilter(null);
    setTempRegistrationSourceFilter(null);
    setIsFilterActive(false);
  };

  // Função para lidar com a ordenação
  const handleSort = (column: string) => {
    setSortState(prevState => {
      if (prevState.column === column) {
        // Se já estiver ordenando por esta coluna, inverte a direção
        return {
          column: column,
          direction: prevState.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // Se for uma nova coluna, começa com ordenação descendente
        return {
          column: column,
          direction: 'desc'
        };
      }
    });
  };

  // Função para controlar visibilidade das colunas
  const handleColumnToggle = (columnId: string) => {
    setVisibleColumns(prevColumns => 
      prevColumns.map(col => 
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    
    return entries.filter(entry => {
      if (monthFilter) {
        const entryMonth = format(entry.date, 'yyyy-MM');
        if (entryMonth !== monthFilter) {
          return false;
        }
      }
      
      if (originFilter && entry.origin !== originFilter) {
        return false;
      }
      
      if (registrationSourceFilter && entry.registrationSource !== registrationSourceFilter) {
        return false;
      }
      
      return true;
    });
  }, [entries, monthFilter, originFilter, registrationSourceFilter]);
  
  // Aplicando ordenação às entradas filtradas
  const sortedEntries = useMemo(() => {
    let result = [...filteredEntries];
    
    // Aplica a ordenação se houver coluna selecionada
    if (sortState.column) {
      result.sort((a, b) => {
        // Extrair valores com base na coluna selecionada
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
            // Calcular a variação percentual para cada entrada
            const currentRateValue = viewCurrency === 'USD' ? currentRate.usd : currentRate.brl;
            valueA = ((currentRateValue - a.exchangeRate) / a.exchangeRate) * 100;
            valueB = ((currentRateValue - b.exchangeRate) / b.exchangeRate) * 100;
            break;
          case 'currentValue':
            // Calcular o valor atual para cada entrada
            const rateValue = viewCurrency === 'USD' ? currentRate.usd : currentRate.brl;
            valueA = a.btcAmount * rateValue;
            valueB = b.btcAmount * rateValue;
            break;
          default:
            valueA = a.date.getTime();
            valueB = b.date.getTime();
        }
        
        // Aplicar ordenação ascendente ou descendente
        if (sortState.direction === 'asc') {
          return valueA - valueB;
        } else {
          return valueB - valueA;
        }
      });
    } else {
      // Ordenação padrão por data (mais recente primeiro)
      result.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
    
    // Limitar a quantidade de entradas conforme rowsToShow
    return result.slice(0, rowsToShow);
  }, [filteredEntries, rowsToShow, sortState, viewCurrency, currentRate]);

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
      
      // Corrigindo a conversão do valor investido
      if (entry.currency !== currencyView) {
        if (entry.currency === 'USD' && currencyView === 'BRL') {
          // Convertendo de USD para BRL
          investedValue = entry.amountInvested * currentRate.brl / currentRate.usd;
        } else if (entry.currency === 'BRL' && currencyView === 'USD') {
          // Convertendo de BRL para USD
          investedValue = entry.amountInvested * currentRate.usd / currentRate.brl;
        }
      }
      
      totals.totalInvested += investedValue;
      totals.totalBtc += entry.btcAmount;
    });
    
    const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
    
    // Calculando preço médio na moeda correta
    totals.avgPrice = totals.totalBtc !== 0 ? totals.totalInvested / totals.totalBtc : 0;
    
    // Calculando valor atual e variação percentual
    totals.currentValue = totals.totalBtc * currentRateValue;
    totals.percentChange = ((currentRateValue - totals.avgPrice) / totals.avgPrice) * 100;
    
    return totals;
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/aportes.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYXBvcnRlcy5wbmciLCJpYXQiOjE3NDQ0OTc3MTMsImV4cCI6MTc3NjAzMzcxM30.ofk3Ocv9aFS_BI19nsngxNbJYjw10do5u3RjTgWrOTo" 
                  alt="Aportes registrados"
                  className="h-full w-full object-contain"
                />
              </div>
              Aportes registrados
            </div>
          </CardTitle>
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
          <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/aportes.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYXBvcnRlcy5wbmciLCJpYXQiOjE3NDQ0OTc3MTMsImV4cCI6MTc3NjAzMzcxM30.ofk3Ocv9aFS_BI19nsngxNbJYjw10do5u3RjTgWrOTo" 
                  alt="Aportes registrados"
                  className="h-full w-full object-contain"
                />
              </div>
              Aportes registrados
            </div>
          </CardTitle>
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
          <div className="flex items-center justify-between">
            <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6">
                  <img 
                    src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/aportes.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYXBvcnRlcy5wbmciLCJpYXQiOjE3NDQ0OTc3MTMsImV4cCI6MTc3NjAzMzcxM30.ofk3Ocv9aFS_BI19nsngxNbJYjw10do5u3RjTgWrOTo" 
                    alt="Aportes registrados"
                    className="h-full w-full object-contain"
                  />
                </div>
                Aportes registrados
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size={isMobile ? "sm" : "default"}
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2"
              >
                <FileUp size={16} />
                {!isMobile && <span>Importar CSV</span>}
              </Button>
              
              {/* Controle de visibilidade de colunas */}
              <ColumnVisibilityControl 
                columns={visibleColumns}
                onColumnToggle={handleColumnToggle}
              />
              
              <Popover open={isFilterPopoverOpen} onOpenChange={handleFilterPopoverOpenChange}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size={isMobile ? "sm" : "default"}
                    className={`flex items-center gap-2 ${isFilterActive ? 'border-bitcoin text-bitcoin' : ''}`}
                  >
                    <Filter size={16} className={isFilterActive ? 'text-bitcoin' : ''} />
                    {!isMobile && <span>Filtrar</span>}
                    {isFilterActive && (
                      <span className="absolute top-0 right-0 h-2 w-2 bg-bitcoin rounded-full"></span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <EntryFilters
                    availableMonths={availableMonths}
                    tempMonthFilter={tempMonthFilter}
                    tempOriginFilter={tempOriginFilter}
                    tempRegistrationSourceFilter={tempRegistrationSourceFilter}
                    setTempMonthFilter={setTempMonthFilter}
                    setTempOriginFilter={setTempOriginFilter}
                    setTempRegistrationSourceFilter={setTempRegistrationSourceFilter}
                    applyFilters={applyFilters}
                    clearFilters={clearFilters}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="brl" className="w-full" onValueChange={(value) => setViewCurrency(value as 'BRL' | 'USD')}>
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="brl" className="rounded-l-md rounded-r-none border-r">Exibir em BRL (R$)</TabsTrigger>
              <TabsTrigger value="usd" className="rounded-r-md rounded-l-none border-l">Exibir em USD ($)</TabsTrigger>
            </TabsList>
            <TabsContent value="brl">
              <div className="overflow-x-auto">
                <EntriesTable 
                  entries={sortedEntries}
                  currencyView="BRL"
                  currentRate={currentRate}
                  displayUnit={displayUnit}
                  isMobile={isMobile}
                  handleEditClick={handleEditClick}
                  handleDeleteClick={handleDeleteClick}
                  totals={calculateTotals('BRL')}
                  sortState={sortState}
                  onSort={handleSort}
                  visibleColumns={visibleColumns}
                />
                <div className="flex justify-end mt-4">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Exibir:</span>
                    <Select value={rowsToShow.toString()} onValueChange={(value) => setRowsToShow(parseInt(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="10 linhas" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROWS_PER_PAGE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="usd">
              <div className="overflow-x-auto">
                <EntriesTable 
                  entries={sortedEntries}
                  currencyView="USD"
                  currentRate={currentRate}
                  displayUnit={displayUnit}
                  isMobile={isMobile}
                  handleEditClick={handleEditClick}
                  handleDeleteClick={handleDeleteClick}
                  totals={calculateTotals('USD')}
                  sortState={sortState}
                  onSort={handleSort}
                  visibleColumns={visibleColumns}
                />
                <div className="flex justify-end mt-4">
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Exibir:</span>
                    <Select value={rowsToShow.toString()} onValueChange={(value) => setRowsToShow(parseInt(value))}>
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="10 linhas" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROWS_PER_PAGE_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          handleEditClose();
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl px-6">
          <DialogHeader>
            <DialogTitle>Editar Aporte</DialogTitle>
            <DialogDescription>
              Modifique os dados do seu aporte e clique em atualizar para salvar.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <EntryEditForm
              entry={selectedEntry}
              currentRate={currentRate}
              onClose={handleEditClose}
              displayUnit={displayUnit}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl px-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este aporte? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmDelete}
              className="flex-1 bg-bitcoin hover:bg-bitcoin/90 text-white rounded-xl"
            >
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
