import React, { useState, useMemo, useRef } from 'react';
import { BitcoinEntry, CurrentRate, Origin } from '@/types';
import { calculatePercentageChange } from '@/services/bitcoinService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Trash2, Edit, AlertCircle, Filter, Plus, Upload, Download, FileSpreadsheet, CheckCircle } from 'lucide-react';
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
  previewData?: BitcoinEntry[];
  onPrepareImport?: (file: File) => Promise<BitcoinEntry[]>;
  onConfirmImport?: () => Promise<{ count: number }>;
  onCancelImport?: () => void;
  onDeleteAllSpreadsheetRecords?: () => Promise<void>;
}

/**
 * Componente que exibe a lista de aportes do usuário em formato de tabela
 * 
 * Funcionalidades:
 * - Visualização de aportes em BRL ou USD
 * - Edição e exclusão de aportes
 * - Filtragem por mês, moeda e origem
 * - Controle de linhas visíveis
 * - Resumo dos totais na parte inferior
 * - Importação de planilhas CSV e Excel com pré-visualização
 */
const EntriesList: React.FC<EntriesListProps> = ({
  entries,
  currentRate,
  onDelete,
  onEdit,
  selectedCurrency,
  displayUnit,
  isLoading = false,
  importProgress = { progress: 0, stage: '', isImporting: false },
  previewData = [],
  onPrepareImport,
  onConfirmImport,
  onCancelImport,
  onDeleteAllSpreadsheetRecords
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  const handleFileButtonClick = () => {
    console.log('[EntriesList] Botão de seleção de arquivo clicado');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    console.log('[EntriesList] Arquivo selecionado:', file ? { 
      name: file.name, 
      type: file.type, 
      size: file.size 
    } : 'nenhum');
    
    if (file) {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      console.log('[EntriesList] Tipo do arquivo:', fileType);
      
      if (fileType === 'csv' || fileType === 'xlsx') {
        setSelectedFile(file);
        console.log('[EntriesList] Arquivo válido selecionado:', file.name);
        toast({
          title: "Arquivo selecionado",
          description: `O arquivo ${file.name} foi selecionado para importação.`,
          variant: "default",
        });
      } else {
        console.error('[EntriesList] Tipo de arquivo não suportado:', fileType);
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Por favor, selecione um arquivo .csv ou .xlsx",
          variant: "destructive",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handlePrepareImport = async () => {
    console.log('[EntriesList] Iniciando handlePrepareImport');
    
    if (!selectedFile || !onPrepareImport) {
      console.error('[EntriesList] Erro: Nenhum arquivo selecionado ou função onPrepareImport não fornecida');
      return;
    }
    
    try {
      console.log('[EntriesList] Iniciando importação do arquivo:', selectedFile.name);
      setIsImporting(true);
      
      console.log('[EntriesList] Chamando onPrepareImport...');
      const previewResult = await onPrepareImport(selectedFile);
      console.log('[EntriesList] Preview obtido com sucesso, registros:', previewResult.length);
      
      // Fechar o modal de importação e abrir o de pré-visualização
      console.log('[EntriesList] Fechando modal de importação e abrindo modal de pré-visualização');
      setIsImportDialogOpen(false);
      setIsPreviewDialogOpen(true);
      
    } catch (error) {
      console.error('[EntriesList] Erro na preparação da importação:', error);
      toast({
        title: "Erro na preparação",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar a planilha",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleConfirmImport = async () => {
    if (!onConfirmImport) {
      return;
    }
    
    try {
      setIsImporting(true);
      
      const result = await onConfirmImport();
      
      toast({
        title: "Importação concluída!",
        description: `Foram adicionados ${result.count} aportes à sua carteira.`,
        variant: "success",
      });
      
      setIsPreviewDialogOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao importar a planilha",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleCancelImport = () => {
    if (onCancelImport) {
      onCancelImport();
    }
    
    setIsPreviewDialogOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDeleteAllSpreadsheet = async () => {
    if (!onDeleteAllSpreadsheetRecords) {
      return;
    }
    
    try {
      await onDeleteAllSpreadsheetRecords();
      
      toast({
        title: "Registros excluídos",
        description: "Todos os registros importados de planilha foram removidos.",
        variant: "success",
      });
      
      setIsDeleteAllDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro na exclusão",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao excluir os registros",
        variant: "destructive",
      });
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

  const openImportDialog = () => {
    setIsImportDialogOpen(true);
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

  const renderPreviewTable = () => {
    console.log('[EntriesList] Renderizando tabela de pré-visualização com dados:', previewData.length);
    
    if (previewData.length === 0) {
      console.log('[EntriesList] Sem dados para pré-visualização');
      return (
        <div className="py-4 text-center text-muted-foreground">
          Nenhum dado encontrado para pré-visualização
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={isMobile ? "text-xs" : ""}>Data</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>Valor Investido</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>{displayUnit === 'SATS' ? 'Satoshis' : 'Bitcoin'}</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>Cotação</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>Moeda</TableHead>
              <TableHead className={isMobile ? "text-xs" : ""}>Origem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((entry, index) => (
              <TableRow key={index}>
                <TableCell className="text-xs py-2">
                  {format(entry.date, 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-xs py-2">
                  {entry.currency === 'USD' ? '$' : 'R$'} {formatNumber(entry.amountInvested)}
                </TableCell>
                <TableCell className="text-xs py-2">
                  {formatBitcoinAmount(entry.btcAmount)}
                </TableCell>
                <TableCell className="text-xs py-2">
                  {entry.currency === 'USD' ? '$' : 'R$'} {formatNumber(entry.exchangeRate)}
                </TableCell>
                <TableCell className="text-xs py-2">
                  {entry.currency}
                </TableCell>
                <TableCell className="text-xs py-2">
                  {entry.origin === 'corretora' ? 'Corretora' : 
                   entry.origin === 'p2p' ? 'P2P' : 'Planilha'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 text-sm text-center text-muted-foreground">
          {previewData.length} aportes encontrados na planilha
        </div>
      </div>
    );
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
        
        <div className="flex justify-between mt-4">
          <div>
            {entries.some(entry => entry.registrationSource === 'planilha') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteAllDialogOpen(true)}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1 text-red-500" />
                Excluir registros de planilha
              </Button>
            )}
          </div>
          
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
            
            <Button 
              variant="outline" 
              size={isMobile ? "sm" : "default"}
              className="flex items-center gap-2"
              onClick={openImportDialog}
            >
              <Plus size={16} />
              {!isMobile && <span>Importar Planilha</span>}
            </Button>
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
      
      <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl px-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Excluir Registros Importados
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir todos os aportes importados de planilha? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteAllDialogOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteAllSpreadsheet}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl"
            >
              Excluir todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        console.log('[EntriesList] Modal de importação onOpenChange:', open, 'importProgress.isImporting:', importProgress.isImporting);
        if (!importProgress.isImporting) {
          setIsImportDialogOpen(open);
          if (!open) {
            console.log('[EntriesList] Limpando dados de importação ao fechar modal');
            setSelectedFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        } else {
          console.log('[EntriesList] Ignorando tentativa de fechar modal durante importação');
        }
      }}>
        <DialogContent className="sm:max-w-lg rounded-2xl px-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 py-3">
            <DialogTitle>Importar Planilha</DialogTitle>
            <DialogDescription>
              Importe seus aportes a partir de uma planilha no formato CSV ou Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border p-3 bg-gray-50">
              <h3 className="text-sm font-medium mb-1">Instruções de preenchimento</h3>
              <ul className="text-sm space-y-0.5">
                <li>• A planilha deve conter as colunas: <span className="font-semibold">Data, Valor Investido e Bitcoin</span></li>
                <li>• O campo cotação é opcional - será calculado automaticamente se ausente</li>
                <li>• Formato de data recomendado: DD/MM/AAAA</li>
                <li>• Use vírgula ( , ) como separador decimal</li>
              </ul>
              
              <div className="mt-2">
                <a 
                  href="https://docs.google.com/spreadsheets/d/1gQXqirgJdUdA7ljN-IdTGHUeEAixTdBhiyCeJ9OKvvk/edit?usp=sharing" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-bitcoin hover:underline text-sm"
                >
                  📄 Acessar modelo de planilha no Google Sheets
                </a>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 flex flex-col items-center justify-center">
              <Download className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-center text-sm text-muted-foreground mb-2">
                Arraste e solte seu arquivo aqui, ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Suporta CSV (.csv) e Excel (.xlsx)
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.xlsx" 
                onChange={handleFileChange}
              />
              
              <Button 
                variant="outline" 
                className="mt-3 w-full"
                onClick={handleFileButtonClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar arquivo
              </Button>
              
              {selectedFile && (
                <div className="mt-2 p-2 bg-gray-100 rounded-md w-full">
                  <p className="text-xs text-muted-foreground flex items-center">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Arquivo selecionado: {selectedFile.name}
                  </p>
                </div>
              )}
            </div>
            
            {importProgress.isImporting && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{importProgress.stage}</span>
                  <span className="text-sm">{importProgress.progress}%</span>
                </div>
                <Progress value={importProgress.progress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-3 mt-4 sticky bottom-0 bg-background pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('[EntriesList] Botão Cancelar clicado no modal de importação');
                if (!importProgress.isImporting) {
                  setIsImportDialogOpen(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
              disabled={importProgress.isImporting}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-bitcoin hover:bg-bitcoin/90 text-white"
              disabled={!selectedFile || importProgress.isImporting}
              onClick={() => {
                console.log('[EntriesList] Botão Avançar clicado, selectedFile:', selectedFile?.name);
                handlePrepareImport();
              }}
            >
              {importProgress.isImporting ? 'Processando...' : 'Avançar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPreviewDialogOpen} onOpenChange={(open) => {
        console.log('[EntriesList] Modal de pré-visualização onOpenChange:', open, 'importProgress.isImporting:', importProgress.isImporting);
        if (!importProgress.isImporting) {
          setIsPreviewDialogOpen(open);
          if (!open && onCancelImport) {
            console.log('[EntriesList] Cancelando importação ao fechar modal de pré-visualização');
            onCancelImport();
          }
        } else {
          console.log('[EntriesList] Ignorando tentativa de fechar modal durante importação');
        }
      }}>
        <DialogContent className="sm:max-w-5xl md:max-w-4xl rounded-2xl px-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 bg-background z-10 py-3">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
              Pré-visualização da Importação
            </DialogTitle>
            <DialogDescription>
              Confira os dados da planilha e confirme a importação. Verifique se os valores estão corretos antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            {renderPreviewTable()}
          </div>
          
          <DialogFooter className="flex justify-end gap-3 mt-4 sticky bottom-0 bg-background pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('[EntriesList] Botão Cancelar clicado no modal de pré-visualização');
                handleCancelImport();
              }}
              disabled={importProgress.isImporting}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={previewData.length === 0 || importProgress.isImporting}
              onClick={() => {
                console.log('[EntriesList] Botão Confirmar importação clicado, previewData:', previewData.length);
                handleConfirmImport();
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {importProgress.isImporting ? 'Importando...' : `Confirmar importação (${previewData.length} registros)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EntriesList;
