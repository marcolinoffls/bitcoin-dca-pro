import React, { useState, useMemo } from 'react';
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
  isLoading?: boolean; // Adicionada propriedade de loading
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [viewCurrency, setViewCurrency] = useState<'BRL' | 'USD'>(selectedCurrency);
  const isMobile = useIsMobile();
  
  // Estados para os filtros
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [originFilter, setOriginFilter] = useState<'corretora' | 'p2p' | null>(null);
  const [rowsToShow, setRowsToShow] = useState<number>(10);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

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

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setMonthFilter(null);
    setOriginFilter(null);
  };

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
              {/* Botão de filtro */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex items-center gap-2">
                    <Filter size={16} />
                    {!isMobile && <span>Filtrar</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Filtrar aportes</h4>
                    
                    {/* Filtro por mês */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Por mês</label>
                      <Select value={monthFilter || 'all'} onValueChange={(value) => setMonthFilter(value === 'all' ? null : value)}>
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
                      <Select value={originFilter || 'all'} onValueChange={(value) => setOriginFilter(value === 'all' ? null : value as 'corretora' | 'p2p')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas as origens" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as origens</SelectItem>
                          <SelectItem value="corretora">Corretora</SelectItem>
                          <SelectItem value="p2p">P2P</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Botão para limpar filtros */}
                    <Button 
                      variant="outline" 
                      className="w-full mt-2" 
                      onClick={clearFilters}
                    >
                      Limpar filtros
                    </Button>
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
      
      {/* Modal de importação de planilha */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl px-6">
          <DialogHeader>
            <DialogTitle>Importar Planilha</DialogTitle>
            <DialogDescription>
              Importe seus aportes a partir de uma planilha no formato CSV ou Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border p-4 bg-gray-50">
              <h3 className="text-sm font-medium mb-2">Instruções de preenchimento</h3>
              <ul className="text-sm space-y-1">
                <li>• A planilha deve conter as colunas: <span className="font-semibold">Data, Valor Investido e Bitcoin</span></li>
                <li>• O campo cotação é opcional - será calculado automaticamente se ausente</li>
                <li>• Formato de data recomendado: DD/MM/AAAA</li>
                <li>• Use ponto (.) como separador decimal</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-8 flex flex-col items-center justify-center">
              <Download className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-center text-sm text-muted-foreground mb-4">
                Arraste e solte seu arquivo aqui, ou clique para selecionar
              </p>
              <p className="text-xs text-muted-foreground">
                Suporta CSV (.csv) e Excel (.xlsx)
              </p>
              
              <Button variant="outline" className="mt-4 w-full">
                <Upload className="h-4 w-4 mr-2" />
                Selecionar arquivo
              </Button>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="bg-bitcoin hover:bg-bitcoin/90 text-white"
              disabled={true}
            >
              Iniciar importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EntriesList;
