
/**
 * Componente de seleção de intervalo de datas
 * 
 * Função: Permite ao usuário selecionar uma data de início e fim para visualização do gráfico de preços
 * Onde é usado: No componente PriceChart para filtrar dados por período personalizado
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Check, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DateRangePickerProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onRangeChange: (start: Date | undefined, end: Date | undefined) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Componente de seleção de intervalo de datas
 * Permite escolher data de início e fim para visualização personalizada
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onRangeChange,
  onConfirm,
  onCancel
}) => {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);
  const [showCustomStartPicker, setShowCustomStartPicker] = useState(false);
  const [showCustomEndPicker, setShowCustomEndPicker] = useState(false);
  const isMobile = useIsMobile();
  
  // Estados para os seletores customizados
  const [selectedStartYear, setSelectedStartYear] = useState(startDate?.getFullYear() || new Date().getFullYear());
  const [selectedStartMonth, setSelectedStartMonth] = useState((startDate?.getMonth() || new Date().getMonth()) + 1);
  const [selectedStartDay, setSelectedStartDay] = useState(startDate?.getDate() || new Date().getDate());
  
  const [selectedEndYear, setSelectedEndYear] = useState(endDate?.getFullYear() || new Date().getFullYear());
  const [selectedEndMonth, setSelectedEndMonth] = useState((endDate?.getMonth() || new Date().getMonth()) + 1);
  const [selectedEndDay, setSelectedEndDay] = useState(endDate?.getDate() || new Date().getDate());

  // Atualiza os estados do seletor customizado quando as datas mudam externamente
  useEffect(() => {
    if (startDate) {
      setSelectedStartYear(startDate.getFullYear());
      setSelectedStartMonth(startDate.getMonth() + 1);
      setSelectedStartDay(startDate.getDate());
    }
    if (endDate) {
      setSelectedEndYear(endDate.getFullYear());
      setSelectedEndMonth(endDate.getMonth() + 1);
      setSelectedEndDay(endDate.getDate());
    }
  }, [startDate, endDate]);

  // Configura a data de início como hoje menos 30 dias
  const setDefaultRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    onRangeChange(start, end);
    setSelectedStartYear(start.getFullYear());
    setSelectedStartMonth(start.getMonth() + 1);
    setSelectedStartDay(start.getDate());
    setSelectedEndYear(end.getFullYear());
    setSelectedEndMonth(end.getMonth() + 1);
    setSelectedEndDay(end.getDate());
  };

  // Gera opções de anos, meses e dias
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 15 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Ajusta o número de dias conforme o mês/ano selecionado
  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const startDays = Array.from({ length: getDaysInMonth(selectedStartYear, selectedStartMonth) }, (_, i) => i + 1);
  const endDays = Array.from({ length: getDaysInMonth(selectedEndYear, selectedEndMonth) }, (_, i) => i + 1);

  // Aplicar seleção customizada para data inicial
  const handleCustomStartPickerConfirm = () => {
    const newDate = new Date(selectedStartYear, selectedStartMonth - 1, selectedStartDay);
    onRangeChange(newDate, endDate);
    setShowCustomStartPicker(false);
    setIsStartOpen(false);
  };

  // Aplicar seleção customizada para data final
  const handleCustomEndPickerConfirm = () => {
    const newDate = new Date(selectedEndYear, selectedEndMonth - 1, selectedEndDay);
    onRangeChange(startDate, newDate);
    setShowCustomEndPicker(false);
    setIsEndOpen(false);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
        {/* Seletor de Data Inicial */}
        <div className="flex-1">
          <p className="text-sm font-medium mb-1 text-gray-500">Data Inicial</p>
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-xl",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data inicial"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    onRangeChange(date, endDate);
                    setIsStartOpen(false);
                  }}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomStartPicker(true)}
                  className="w-full mt-2 rounded-lg"
                >
                  Selecionar Ano/Mês/Dia
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Seletor de Data Final */}
        <div className="flex-1">
          <p className="text-sm font-medium mb-1 text-gray-500">Data Final</p>
          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-xl",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data final"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-2">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    onRangeChange(startDate, date);
                    setIsEndOpen(false);
                  }}
                  initialFocus
                  locale={ptBR}
                  className={cn("p-3 pointer-events-auto")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCustomEndPicker(true)}
                  className="w-full mt-2 rounded-lg"
                >
                  Selecionar Ano/Mês/Dia
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={setDefaultRange}
          className="text-xs"
        >
          Últimos 30 dias
        </Button>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            className="text-xs flex items-center"
          >
            <X className="h-3 w-3 mr-1" /> Cancelar
          </Button>
          <Button 
            variant="default"
            size="sm" 
            onClick={onConfirm}
            className="text-xs flex items-center bg-bitcoin hover:bg-bitcoin/90 text-white"
          >
            <Check className="h-3 w-3 mr-1" /> Aplicar
          </Button>
        </div>
      </div>

      {/* Picker customizado para data inicial */}
      {showCustomStartPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg flex flex-col items-center">
            <h3 className="font-medium mb-2">Data Inicial</h3>
            <div className="flex gap-2 mb-4">      
              <select value={selectedStartDay} onChange={e => setSelectedStartDay(Number(e.target.value))}>
                {startDays.map(d => <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>)}
              </select>
              <select value={selectedStartMonth} onChange={e => setSelectedStartMonth(Number(e.target.value))}>
                {months.map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
              </select>
              <select value={selectedStartYear} onChange={e => setSelectedStartYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Button onClick={handleCustomStartPickerConfirm} className="mb-2 w-full rounded-lg bg-bitcoin hover:bg-bitcoin/90 text-white">
              Confirmar
            </Button>
            <Button variant="outline" onClick={() => setShowCustomStartPicker(false)} className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Picker customizado para data final */}
      {showCustomEndPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg flex flex-col items-center">
            <h3 className="font-medium mb-2">Data Final</h3>
            <div className="flex gap-2 mb-4">      
              <select value={selectedEndDay} onChange={e => setSelectedEndDay(Number(e.target.value))}>
                {endDays.map(d => <option key={d} value={d}>{d.toString().padStart(2, '0')}</option>)}
              </select>
              <select value={selectedEndMonth} onChange={e => setSelectedEndMonth(Number(e.target.value))}>
                {months.map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
              </select>
              <select value={selectedEndYear} onChange={e => setSelectedEndYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Button onClick={handleCustomEndPickerConfirm} className="mb-2 w-full rounded-lg bg-bitcoin hover:bg-bitcoin/90 text-white">
              Confirmar
            </Button>
            <Button variant="outline" onClick={() => setShowCustomEndPicker(false)} className="w-full">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
