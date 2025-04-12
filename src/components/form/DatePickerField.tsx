
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, CalendarCheck, Check } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
  date: Date;
  onDateChange: (date: Date) => void;
  disabled?: boolean;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({ 
  date, 
  onDateChange,
  disabled = false
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(date);
  const calendarPopoverRef = useRef<HTMLButtonElement>(null);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setTempDate(newDate);
    }
  };

  const confirmDateSelection = () => {
    onDateChange(tempDate);
    setIsCalendarOpen(false);
  };

  const setToday = () => {
    const today = new Date();
    onDateChange(today);
    setTempDate(today);
    setIsCalendarOpen(false);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="purchaseDate">Data do Aporte</Label>
      <div className="flex gap-4">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={calendarPopoverRef}
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal rounded-xl",
                !date && "text-muted-foreground"
              )}
              type="button"
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <div className="p-3 rounded-md shadow-sm">
              <Calendar
                mode="single"
                selected={tempDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={ptBR}
                className="rounded-md border-0 shadow-none pointer-events-auto"
              />
              <div className="flex justify-center p-2 mt-2">
                <Button 
                  type="button" 
                  onClick={confirmDateSelection}
                  className="rounded-full bg-bitcoin hover:bg-bitcoin/90 text-white px-4 w-auto"
                >
                  <Check className="h-4 w-4 mr-2" />
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
          className="shrink-0 rounded-xl"
          disabled={disabled}
        >
          <CalendarCheck className="h-4 w-4 mr-2" />
          Hoje
        </Button>
      </div>
    </div>
  );
};

export default DatePickerField;
