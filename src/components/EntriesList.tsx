
import React, { useState, useMemo, useRef } from 'react';
import { BitcoinEntry, CurrentRate } from '@/types';
import { calculatePercentageChange } from '@/services/bitcoinService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Trash2, Edit, AlertCircle, Filter, Plus, Upload, Download } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import EntryEditForm from '@/components/EntryEditForm';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

/**
 * Interface que define as propriedades do componente EntriesList
 * 
 * Responsável por exibir a lista de aportes do usuário em formato de tabela,
 * com funcionalidades de edição, exclusão e filtragem
 */
interface EntriesListProps {
  entries: BitcoinEntry[];
  currentRate: CurrentRate;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  selectedCurrency: 'BRL' | 'USD';
  displayUnit: 'BTC' | 'SATS';
  isLoading?: boolean;
  importProgress?: {
    progress: number;
    stage: string;
    isImporting: boolean;
  };
  onImportFile?: (file: File) => Promise<{ count: number, entries: BitcoinEntry[] }>;
}

const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  currentRate,
  onDelete,
  onEdit,
  selectedCurrency,
  displayUnit,
  isLoading = false,
  importProgress = { progress: 0, stage: '', isImporting: false },
  onImportFile
}) => {
  // Referência para o input de arquivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [viewCurrency, setViewCurrency] = useState<'BRL' | 'USD'>(selectedCurrency);
  const isMobile = useIsMobile();
  
  // Estados para os filtros ativos
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [originFilter, setOriginFilter] = useState<'corretora' | 'p2p' | 'planilha' | null>(null);
  
  // Estados para os filtros temporários (não aplicados até confirmação)
  const [tempMonthFilter, setTempMonthFilter] = useState<string | null>(null);
  const [tempOriginFilter, setTempOriginFilter] = useState<'corretora' | 'p2p' | 'planilha' | null>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  const [rowsToShow, setRowsToShow] = useState<number>(10);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);

  // Função para acionar o input de arquivo ao clicar no botão
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Função para lidar com a seleção de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      // Verifica se o arquivo é do tipo .csv ou .xlsx
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (fileType === 'csv' || fileType === 'xlsx') {
        setSelectedFile(file);
        console.log('Arquivo selecionado:', file.name);
      } else {
        // Feedback para o usuário sobre tipo de arquivo não suportado
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Por favor, selecione um arquivo .csv ou .xlsx",
          variant: "destructive",
        });
        // Limpar o input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // Função para iniciar a importação do arquivo
  const handleStartImport = async () => {
    if (!selectedFile || !onImportFile) {
      return;
    }
    
    try {
      setIsImporting(true);
      
      // Chamar função de importação passada via props
      const result = await onImportFile(selectedFile);
      
      // Mostrar toast de sucesso
      toast({
        title: "Importação concluída!",
        description: `Foram adicionados ${result.count} aportes à sua carteira.`,
        variant: "success",
      });
      
      // Fechar o modal e limpar o arquivo selecionado
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      // Mostrar toast de erro
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao importar a planilha",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

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

  // Funções para abrir e fechar o modal de importação
  const openImportDialog = () => {
    setIsImportDialogOpen(true);
  };

  // Inicializar filtros temporários com os valores atuais quando o popover é aberto
  const handleFilterPopoverOpenChange = (open: boolean) => {
    setIsFilterPopoverOpen(open);
    if (open) {
      setTempMonthFilter(monthFilter);
      setTempOriginFilter(originFilter);
    }
  };

  // Aplicar filtros ao clicar no botão de confirmar
  const applyFilters = () => {
    setMonthFilter(tempMonthFilter);
    setOriginFilter(tempOriginFilter);
    setIsFilterActive(tempMonthFilter !== null || tempOriginFilter !== null);
    setIsFilterPopoverOpen(false);
  };

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setMonthFilter(null);
    setOriginFilter(null);
    setTempMonthFilter(null);
    setTempOriginFilter(null);
    setIsFilterActive(false);
  };

  // Aplicar filtros nas entradas
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    
    return entries.filter(entry => {
      // Filtro por mês
      if (monthFilter) {
        const entryMonth = format(entry.date, 'yyyy-MM');
        if (entryMonth !== monthFilter) {
          return false;
        }
      }
      
      // Filtro por origem
      if (originFilter && entry.origin !== originFilter) {
        return false;
      }
      
      return true;
    });
  }, [entries, monthFilter, originFilter]);
  
  // Ordenar entradas por data (mais recentes primeiro)
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    ).slice(0, rowsToShow);
  }, [filteredEntries, rowsToShow]);

  // Obter meses únicos para o filtro
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
                  alt="Aportes Registrados"
                  className="h-full w-full object-contain"
                />
              </div>
              Aportes Registrados
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
                  alt="Aportes Registrados"
                  className="h-full w-full object-contain"
                />
              </div>
              Aportes Registrados
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

  // Calcular os totais para a linha de resumo
  const calculateTotals = (currencyView: 'BRL' | 'USD') => {
    const totals = {
      totalInvested: 0,
      totalBtc: 0,
      avgPrice: 0,
      percentChange: 0,
      currentValue: 0
    };
    
    if (filteredEntries.length === 0) return totals;
    
    // Calcular totais
    filteredEntries.forEach(entry => {
      let investedValue = entry.amountInvested;
      
      // Converter moeda se necessário
      if (entry.currency !== currencyView) {
        investedValue = entry.currency === 'USD'
          ? entry.amountInvested * (currentRate.brl / currentRate.usd) // USD to BRL
          : entry.amountInvested / (currentRate.brl / currentRate.usd); // BRL to USD
      }
      
      totals.totalInvested += investedValue;
      totals.totalBtc += entry.btcAmount;
    });
    
    // Calcular preço médio das cotações (média aritmética simples)
    // Isso é uma mudança da média ponderada para média aritmética das cotações exibidas
    let totalExchangeRates = 0;
    filteredEntries.forEach(entry => {
      let entryRateInViewCurrency = entry.exchangeRate;
      
      if (entry.currency !== currencyView) {
        entryRateInViewCurrency = entry.currency === 'USD' 
          ? entry.exchangeRate * (currentRate.brl / currentRate.usd) // USD to BRL
          : entry.exchangeRate / (currentRate.brl / currentRate.usd); // BRL to USD
      }
      
      totalExchangeRates += entryRateInViewCurrency;
    });
    
    // Calcular média aritmética simples das cotações
    totals.avgPrice = filteredEntries.length > 0 ? totalExchangeRates / filteredEntries.length : 0;
    
    // Calcular variação percentual e valor atual
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
            {/* Linha de totais movida para o topo */}
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
                <div className="text-xs text-muted-foreground">(preço médio)</div>
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
            
            {/* Entradas individuais */}
            {sortedEntries.map((entry) => {
              const currentRateValue = currencyView === 'USD' ? currentRate.usd : currentRate.brl;
              
              let entryRateInViewCurrency = entry.exchangeRate;
              
              if (entry.currency !== currencyView) {
                entryRateInViewCurrency = entry.currency === 'USD' 
                  ? entry.exchangeRate * (currentRate.brl / currentRate.usd) // USD to BRL
                  : entry.exchangeRate / (currentRate.brl / currentRate.usd); // BRL to USD
              }
              
              const percentChange = calculatePercentageChange(
                entryRateInViewCurrency,
                currentRateValue
              );
              
              let investedValue = entry.amountInvested;
              if (entry.currency !== currencyView) {
                investedValue = entry.currency === 'USD'
                  ? entry.amountInvested * (currentRate.brl / currentRate.usd) // USD to BRL
                  : entry.amountInvested / (currentRate.brl / currentRate.usd); // BRL to USD
              }
              
              const currentValue = investedValue * (1 + percentChange / 100);
              
              return (
                <TableRow key={entry.id}>
                  <TableCell className={isMobile ? "text-xs py-2" : ""}>
                    {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                    {entry.origin === 'planilha' && (
                      <span className="ml-1 text-xs text-muted-foreground">(planilha)</span>
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
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(entry.id)}
                        title="Editar Aporte"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(entry.id)}
                        title="Excluir Aporte"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between">
          <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6">
                <img 
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/aportes.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYXBvcnRlcy5wbmciLCJpYXQiOjE3NDQ0OTc3MTMsImV4cCI6MTc3NjAzMzcxM30.ofk3Ocv9aFS_BI19nsngxNbJYjw10do5u3RjTgWrOTo" 
                  alt="Aportes Registrados"
                  className="h-full w-full object-contain"
                />
              </div>
              Aportes Registrados
            </div>
          </CardTitle>
          <div className="flex flex-wrap md:flex-nowrap gap-2 items-center mt-2 md:mt-0">
            <input 
              type="file" 
              accept=".csv,.xlsx" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <Button
              variant="outline"
              size="sm"
              className="flex gap-2 mr-2"
              onClick={openImportDialog}
            >
              <Upload className="h-4 w-4 text-green-500" />
              <span>Importar</span>
            </Button>
            <Popover open={isFilterPopoverOpen} onOpenChange={handleFilterPopoverOpenChange}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={`flex gap-2 mr-2 ${isFilterActive ? 'border-green-500 text-green-500' : ''}`}
                >
                  <Filter className={`h-4 w-4 ${isFilterActive ? 'text-green-500' : ''}`} />
                  <span>Filtrar</span>
                  {isFilterActive && (
                    <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Filtrar aportes</h4>
                    <p className="text-sm text-muted-foreground">
                      Selecione os critérios desejados e clique em confirmar.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid gap-1">
                      <label htmlFor="month" className="text-sm">
                        Por mês
                      </label>
                      <Select
                        value={tempMonthFilter || ''}
                        onValueChange={(value) => setTempMonthFilter(value || null)}
                      >
                        <SelectTrigger id="month">
                          <SelectValue placeholder="Selecione um mês" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os meses</SelectItem>
                          {availableMonths.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <label htmlFor="origin" className="text-sm">
                        Por origem
                      </label>
                      <Select
                        value={tempOriginFilter || ''}
                        onValueChange={(value) => 
                          setTempOriginFilter(value ? value as 'corretora' | 'p2p' | 'planilha' : null)
                        }
                      >
                        <SelectTrigger id="origin">
                          <SelectValue placeholder="Selecione uma origem" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas as origens</SelectItem>
                          <SelectItem value="corretora">Corretora</SelectItem>
                          <SelectItem value="p2p">P2P</SelectItem>
                          <SelectItem value="planilha">Planilha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-between mt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2"
                      >
                        Limpar filtros
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={applyFilters}
                        className="mt-2"
                      >
                        Confirmar filtros
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Tabs 
              defaultValue={selectedCurrency} 
              value={viewCurrency}
              onValueChange={(val) => setViewCurrency(val as 'BRL' | 'USD')}
              className="w-auto"
            >
              <TabsList className="grid w-28 grid-cols-2 h-8">
                <TabsTrigger value="BRL" className="text-xs">BRL</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsContent value="all" className="mt-0">
            {renderEntriesTable(viewCurrency)}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {Math.min(sortedEntries.length, rowsToShow)} de {filteredEntries.length} aportes
          </div>
          
          {filteredEntries.length > rowsToShow && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setRowsToShow(prev => prev + 10)}
            >
              Mostrar mais
            </Button>
          )}
        </div>
      </CardContent>

      {/* Modal de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este aporte? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Aporte</DialogTitle>
            <DialogDescription>
              Altere os dados do seu aporte de Bitcoin.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <EntryEditForm
              entry={selectedEntry}
              onClose={handleEditClose}
              currentRate={currentRate}
              displayUnit={displayUnit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Importação */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Importar Aportes</DialogTitle>
            <DialogDescription>
              Importe seus aportes a partir de um arquivo CSV ou XLSX.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {importProgress.isImporting ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{importProgress.stage}</span>
                  <span className="text-sm text-muted-foreground">{importProgress.progress}%</span>
                </div>
                <Progress value={importProgress.progress} className="h-2" />
              </div>
            ) : (
              <>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleFileButtonClick}>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo ou arraste e solte aqui
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Arquivos CSV ou XLSX
                  </p>
                </div>
                
                {selectedFile && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                    <div className="flex-1 truncate">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleStartImport}
                      disabled={isImporting}
                    >
                      Importar
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EntriesList;
