
import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DatePickerFieldProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ date, onDateChange }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  const setToday = () => {
    const today = new Date();
    onDateChange(today);
    setIsCalendarOpen(false);
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      onDateChange(newDate);
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
                isMobile && "text-sm"
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
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                className="rounded-md border-0 shadow-none pointer-events-auto"
              />
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
