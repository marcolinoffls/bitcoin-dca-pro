import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BitcoinEntry, CurrentRate, Origin } from '@/types';
import { calculatePercentageChange } from '@/services/bitcoinService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Trash2, Edit, AlertCircle, Filter } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import EntryEditForm from '@/components/EntryEditForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface que define as propriedades do componente EntriesList
 */
interface EntriesListProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
  isLoading?: boolean;
}

/**
 * Componente que exibe a lista de aportes do usuário em formato de tabela
 */
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
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [viewCurrency, setViewCurrency] = useState<'BRL' | 'USD'>(selectedCurrency);
  const isMobile = useIsMobile();
  
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [originFilter, setOriginFilter] = useState<Origin | null>(null);
  const [registrationSourceFilter, setRegistrationSourceFilter] = useState<'manual' | 'planilha' | null>(null);
  
  const [tempMonthFilter, setTempMonthFilter] = useState<string | null>(null);
  const [tempOriginFilter, setTempOriginFilter] = useState<Origin | null>(null);
  const [tempRegistrationSourceFilter, setTempRegistrationSourceFilter] = useState<'manual' | 'planilha' | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  const [rowsToShow, setRowsToShow] = useState<number>(10);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

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
  
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    ).slice(0, rowsToShow);
  }, [filteredEntries, rowsToShow]);

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

  const formatBitcoinAmount = (amount: number) => {
    if (displayUnit === 'SATS') {
      const satoshis = amount * 100000000;
      return formatNumber(satoshis, 0);
    }
    return formatNumber(amount, 8);
  };

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
        investedValue = entry.currency === 'USD'
          ? entry.amountInvested * (currentRate.brl / currentRate.usd)
          : entry.amountInvested / (currentRate.brl / currentRate.usd);
      }
      
      totals.totalInvested += investedValue;
      totals.totalBtc += entry.btcAmount;
    });
    
    totals.avgPrice = totals.totalBtc !== 0 ? totals.totalInvested / totals.totalBtc : 0;
    
    const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
    totals.percentChange = calculatePercentageChange(totals.avgPrice, currentRateValue);
    totals.currentValue = totals.totalBtc * currentRateValue;
    
    return totals;
  };

  const renderEntriesTable = (currencyView: 'BRL' | 'USD') => {
    const totals = calculateTotals(currencyView);
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={isMobile ? "text-xs" : ""}>Data</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>Valor Investido</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>{displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>Cotação</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>Variação</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>Valor Atual</TableHead>
              <TableHead className={`text-right ${isMobile ? "text-xs" : ""}`}>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.map((entry) => {
              const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
              
              let entryRateInViewCurrency = entry.exchangeRate;
              
              if (entry.currency !== currencyView) {
                entryRateInViewCurrency = entry.currency === 'USD' 
                  ? entry.exchangeRate * (currentRate.brl / currentRate.usd)
                  : entry.exchangeRate / (currentRate.brl / currentRate.usd);
              }
              
              const percentChange = calculatePercentageChange(
                entryRateInViewCurrency,
                currentRateValue
              );
              
              let investedValue = entry.amountInvested;
              if (entry.currency !== currencyView) {
                investedValue = entry.currency === 'USD'
                  ? entry.amountInvested * (currentRate.brl / currentRate.usd)
                  : entry.amountInvested / (currentRate.brl / currentRate.usd);
              }
              
              const currentValue = investedValue * (1 + percentChange / 100);
              
              return (
                <TableRow key={entry.id}>
                  <TableCell className={isMobile ? "text-xs py-2" : ""}>
                    {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                    {entry.origin === 'planilha' && (
                      <span className="ml-1 text-xs text-muted-foreground">(planilha)</span>
                    )}
                    {entry.registrationSource === 'planilha' && (
                      <span className="ml-1 text-xs text-yellow-600">●</span>
                    )}
                  </TableCell>
                  <TableCell className={isMobile ? "text-xs py-2" : ""}>
                    {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(investedValue)}
                  </TableCell>
                  <TableCell className={isMobile ? "text-xs py-2" : ""}>
                    {formatBitcoinAmount(entry.btcAmount)}
                  </TableCell>
                  <TableCell className={isMobile ? "text-xs py-2" : ""}>
                    {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(entryRateInViewCurrency)}
                  </TableCell>
                  <TableCell className={isMobile ? "text-xs py-2" : ""}>
                    <div className="flex items-center">
                      {percentChange > 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                      )}
                      <span
                        className={
                          percentChange > 0 ? 'text-green-500' : 'text-red-500'
                        }
                      >
                        {formatNumber(percentChange)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={isMobile ? "text-xs py-2" : ""}>
                    <div className={percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                      {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(currentValue)}
                      <div className="text-xs text-muted-foreground">
                        {percentChange > 0 ? '+' : ''}{formatNumber(currentValue - investedValue)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right ${isMobile ? "text-xs py-2" : ""}`}>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(entry.id)}
                        className="mr-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            
            <TableRow className="bg-gray-100/80 font-semibold border-t-2">
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                TOTAIS
              </TableCell>
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.totalInvested)}
              </TableCell>
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                {formatBitcoinAmount(totals.totalBtc)}
              </TableCell>
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.avgPrice)}
              </TableCell>
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                <div className="flex items-center">
                  {totals.percentChange > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                  )}
                  <span
                    className={
                      totals.percentChange > 0 ? 'text-green-500' : 'text-red-500'
                    }
                  >
                    {formatNumber(totals.percentChange)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className={isMobile ? "text-xs py-2" : ""}>
                <div className={totals.percentChange > 0 ? 'text-green-500' : 'text-red-500'}>
                  {currencyView === 'USD' ? '$' : 'R$'} {formatNumber(totals.currentValue)}
                  <div className="text-xs text-muted-foreground">
                    {totals.percentChange > 0 ? '+' : ''}{formatNumber(totals.currentValue - totals.totalInvested)}
                  </div>
                </div>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableBody>
        </Table>
        
        <div className="flex justify-end mt-4">
          <div className="flex items-center">
            <span className="text-sm mr-2">Exibir:</span>
            <Select value={rowsToShow.toString()} onValueChange={(value) => setRowsToShow(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="10 linhas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 linhas</SelectItem>
                <SelectItem value="30">30 linhas</SelectItem>
                <SelectItem value="50">50 linhas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

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
                <div className="space-y-4">
                  <h4 className="font-medium">Filtrar aportes</h4>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Por mês</label>
                    <Select 
                      value={tempMonthFilter || 'all'} 
                      onValueChange={(value) => setTempMonthFilter(value === 'all' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os meses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os meses</SelectItem>
                        {availableMonths.map(month => (
                          <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Por origem</label>
                    <Select 
                      value={tempOriginFilter || 'all'} 
                      onValueChange={(value) => setTempOriginFilter(value === 'all' ? null : value as Origin)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as origens" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as origens</SelectItem>
                        <SelectItem value="corretora">Corretora</SelectItem>
                        <SelectItem value="p2p">P2P</SelectItem>
                        <SelectItem value="planilha">Planilha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Por tipo de registro</label>
                    <Select 
                      value={tempRegistrationSourceFilter || 'all'} 
                      onValueChange={(value) => setTempRegistrationSourceFilter(value === 'all' ? null : value as 'manual' | 'planilha')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="manual">Registros manuais</SelectItem>
                        <SelectItem value="planilha">Importados de planilha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-4">
                    <Button 
                      className="w-full bg-bitcoin hover:bg-bitcoin/90 text-white" 
                      onClick={applyFilters}
                    >
                      Confirmar filtros
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={clearFilters}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="brl" className="w-full" onValueChange={(value) => setViewCurrency(value as 'BRL' | 'USD')}>
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="brl" className="rounded-l-md rounded-r-none border-r">Exibir em BRL (R$)</TabsTrigger>
              <TabsTrigger value="usd" className="rounded-r-md rounded-l-none border-l">Exibir em USD ($)</TabsTrigger>
            </TabsList>
            <TabsContent value="brl">
              {renderEntriesTable('BRL')}
            </TabsContent>
            <TabsContent value="usd">
              {renderEntriesTable('USD')}
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
    </>
  );
};

export default EntriesList;
