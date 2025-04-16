

import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CalendarCheck, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Componente de seleção de data
 * 
 * Função: Permite ao usuário escolher uma data através de um calendário
 * Onde é usado: Nos formulários de registro e edição de aportes
 * 
 * Atualizações:
 * - Adicionado estado tempDate para controlar a data temporária selecionada
 * - Adicionado botão de confirmação para aplicar a data selecionada
 * - Corrigido o problema de atualização de data que não era persistida
 * - Adicionado useEffect para atualizar tempDate quando date prop muda
 * - Melhorada a persistência da data selecionada
 * - Garantido que a data seja aplicada instantaneamente ao ser selecionada
 * - Corrigido problema de timezone, garantindo formatação consistente
 */
interface DatePickerFieldProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ date, onDateChange }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(date);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  // Atualiza o estado tempDate quando a prop date mudar
  useEffect(() => {
    if (date) {
      setTempDate(new Date(date));
      console.log('DatePickerField recebeu nova data:', date);
    }
  }, [date]);

  // Define a data como hoje
  const setToday = () => {
    const today = new Date();
    console.log('Definindo data para hoje:', today);
    onDateChange(today);
    setTempDate(today);
    setIsCalendarOpen(false);
  };

  // Controla a seleção temporária de data no calendário
  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      console.log('Data selecionada no calendário:', newDate);
      setTempDate(newDate);
      
      // Aplica a data imediatamente ao selecioná-la, sem precisar confirmar
      onDateChange(newDate);
    }
  };

  // Confirma a data selecionada e a aplica ao formulário
  const handleConfirm = () => {
    if (tempDate) {
      console.log('Data confirmada:', tempDate);
      onDateChange(tempDate);
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="purchaseDate">Data do Aporte</Label>
      <div className="flex items-center gap-2">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={calendarPopoverRef}
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal rounded-xl border-input hover:border-bitcoin hover:bg-transparent",
                !date && "text-muted-foreground",
                isMobile && "text-sm h-9"
              )}
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 rounded-md shadow-sm">
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                className="rounded-md border-0 shadow-none pointer-events-auto [&_.rdp-day:focus]:ring-0 [&_.rdp-day:focus]:outline-none"
              />
              <div className="flex justify-end mt-0.8">
                <Button 
                  type="button" 
                  onClick={handleConfirm}
                  className="rounded-lg bg-bitcoin hover:bg-bitcoin/90 text-white mr-[20px]" // px é o espaçamento do botao
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          onClick={setToday}
          className="shrink-0 rounded-xl hover:border-bitcoin hover:text-bitcoin hover:bg-transparent transition-colors"
          size={isMobile ? "sm" : "default"}
        >
          <CalendarCheck className="h-4 w-4 mr-2" />
          Hoje
        </Button>
      </div>
    </div>
  );
};

export default DatePickerField;
