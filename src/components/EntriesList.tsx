
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
import { Textarea } from '@/components/ui/textarea';

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
  
  // Estado para controlar a aba ativa no modal de importação
  const [importTab, setImportTab] = useState<'planilha' | 'p2p'>('planilha');
  
  // Estado para o campo de texto do Satisfaction P2P
  const [satisfactionText, setSatisfactionText] = useState<string>('');

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
  
  // Função para lidar com a importação de dados do Satisfaction P2P
  const handleSatisfactionImport = () => {
    // Por enquanto apenas mostra uma mensagem de sucesso
    // A lógica de extração dos dados e envio para o Supabase será implementada futuramente
    if (satisfactionText.trim() === '') {
      toast({
        title: "Campo vazio",
        description: "Por favor, cole os dados do Satisfaction P2P",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Dados recebidos",
      description: "A funcionalidade de importação do Satisfaction P2P será implementada em breve!",
      variant: "success",
    });
    
    // Fechar o modal e limpar o texto
    setIsImportDialogOpen(false);
    setSatisfactionText('');
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
    
    // Calcular preço médio
    totals.avgPrice = totals.totalBtc !== 0 ? totals.totalInvested / totals.totalBtc : 0;
    
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
            
            {/* Linha de totais */}
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
        
        {/* Controle de número de linhas */}
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
                    alt="Aportes Registrados"
                    className="h-full w-full object-contain"
                  />
                </div>
                Aportes Registrados
              </div>
            </CardTitle>
            
            {/* Botões de ação */}
            <div className="flex items-center gap-2">
              {/* Botão de filtro com indicador visual quando filtro está ativo */}
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
                    
                    {/* Filtro por mês */}
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
                    
                    {/* Filtro por origem */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Por origem</label>
                      <Select 
                        value={tempOriginFilter || 'all'} 
                        onValueChange={(value) => setTempOriginFilter(value === 'all' ? null : value as 'corretora' | 'p2p' | 'planilha')}
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
                    
                    {/* Botões de ação */}
                    <div className="flex flex-col gap-2 mt-4">
                      {/* Botão para aplicar filtros */}
                      <Button 
                        className="w-full bg-bitcoin hover:bg-bitcoin/90 text-white" 
                        onClick={applyFilters}
                      >
                        Confirmar filtros
                      </Button>
                      
                      {/* Botão para limpar filtros */}
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
              
              {/* Botão para importar planilha */}
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

      {/* Modal de edição de aporte */}
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
      
      {/* Modal de confirmação de exclusão */}
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
      
      {/* Modal de importação (redesenhado com abas) */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        if (!importProgress.isImporting) {
          setIsImportDialogOpen(open);
          if (!open) {
            setSelectedFile(null);
            setSatisfactionText('');
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }
        }
      }}>
        <DialogContent className="sm:max-w-lg rounded-2xl px-6">
          <DialogHeader>
            <DialogTitle>Importar Aportes</DialogTitle>
            <DialogDescription>
              Importe seus aportes a partir de diferentes fontes.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="planilha" className="w-full" onValueChange={(value) => setImportTab(value as 'planilha' | 'p2p')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="planilha">
                <div className="flex items-center gap-2">
                  <Download size={16} />
                  <span>Importar Planilha</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="p2p">
                <div className="flex items-center gap-2">
                  <img 
                    src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/icones/satisfaction-icon.svg" 
                    alt="Satisfaction P2P"
                    className="h-4 w-4"
                  />
                  <span>Importar do Satisfaction (P2P)</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            {/* Conteúdo da aba Planilha */}
            <TabsContent value="planilha" className="space-y-4">
              <div className="rounded-lg border p-3 bg-gray-50">
                <h3 className="text-sm font-medium mb-1">Instruções de preenchimento</h3>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• A planilha deve conter as colunas: <span className="font-semibold">Data, Valor Investido e Bitcoin</span></li>
                  <li>• O campo cotação é opcional - será calculado automaticamente se ausente</li>
                  <li>• Formato de data recomendado: DD/MM/AAAA</li>
                </ul>
                
                <div className="mt-2">
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1gQXqirgJdUdA7ljN-IdTGHUeEAixTdBhiyCeJ9OKvvk/edit?usp=sharing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-bitcoin hover:underline text-xs"
                  >
                    📄 Acessar modelo de planilha
                  </a>
                </div>
              </div>
              
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
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors" 
                    onClick={handleFileButtonClick}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar um arquivo ou arraste e solte aqui
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Suporta CSV (.csv) e Excel (.xlsx)
                    </p>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".csv,.xlsx" 
                    onChange={handleFileChange}
                  />
                  
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>Arquivo selecionado:</span>
                      <span className="font-medium">{selectedFile.name}</span>
                    </div>
                  )}
                </>
              )}
              
              <DialogFooter className="mt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(false)}
                  disabled={importProgress.isImporting}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-bitcoin hover:bg-bitcoin/90 text-white"
                  disabled={!selectedFile || importProgress.isImporting}
                  onClick={handleStartImport}
                >
                  {importProgress.isImporting ? 'Importando...' : 'Iniciar importação'}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            {/* Conteúdo da aba Satisfaction P2P */}
            <TabsContent value="p2p" className="space-y-4">
              <div className="rounded-lg border p-3 bg-gray-50">
                <h3 className="text-sm font-medium mb-1">Como importar aportes do Satisfaction?</h3>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Cole abaixo a mensagem recebida do Satisfaction após a compra</li>
                  <li>• O sistema irá extrair automaticamente o valor, cotação e quantidade de sats</li>
                  <li>• A data do aporte será registrada como a data atual</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="satisfaction-text" className="text-sm font-medium">
                  Cole a mensagem do Satisfaction:
                </label>
                <Textarea
                  id="satisfaction-text"
                  placeholder={`Exemplo:\nExpira em: 13/04/25 às 09:02:57\nCotação BTC/BRL: R$506.358 | Fonte: Sideswap\nValor: R$ 100,00\nTaxa Fixa: R$ 2,00\nTaxa Percentual: 2%\nVocê Recebe: 18.959 sats`}
                  value={satisfactionText}
                  onChange={(e) => setSatisfactionText(e.target.value)}
                  className="min-h-[150px] resize-none font-mono text-sm"
                />
              </div>
              
              <DialogFooter className="mt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-bitcoin hover:bg-bitcoin/90 text-white"
                  disabled={!satisfactionText.trim()}
                  onClick={handleSatisfactionImport}
                >
                  Importar Aporte
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EntriesList;
