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

/**
 * Componente que exibe a lista de aportes do usuário em formato de tabela
 * 
 * Funcionalidades:
 * - Visualização de aportes em BRL ou USD
 * - Edição e exclusão de aportes
 * - Filtragem por mês, moeda e origem
 * - Controle de linhas visíveis
 * - Resumo dos totais na parte inferior
 * - Importação de planilhas CSV e Excel
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
                  <TableCell className={`text-right ${isMobile ? "
