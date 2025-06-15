
import React from 'react';
import { Origin } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ORIGIN_FILTER_OPTIONS, REGISTRATION_SOURCE_OPTIONS } from './constants';

interface EntryFiltersProps {
  availableMonths: { value: string; label: string }[];
  availableYears?: { value: string; label: string }[];
  tempMonthFilter: string | null;
  tempYearFilter: string | null;
  tempOriginFilter: Origin | 'all-without-adjustments' | null;
  tempRegistrationSourceFilter: 'manual' | 'planilha' | null;
  setTempMonthFilter: (value: string | null) => void;
  setTempYearFilter: (value: string | null) => void;
  setTempOriginFilter: (value: Origin | 'all-without-adjustments' | null) => void;
  setTempRegistrationSourceFilter: (value: 'manual' | 'planilha' | null) => void;
  applyFilters: () => void;
  clearFilters: () => void;
}

export const EntryFilters: React.FC<EntryFiltersProps> = ({
  availableMonths,
  availableYears = [], // Valor padrão vazio
  tempMonthFilter,
  tempYearFilter,
  tempOriginFilter,
  tempRegistrationSourceFilter,
  setTempMonthFilter,
  setTempYearFilter,
  setTempOriginFilter,
  setTempRegistrationSourceFilter,
  applyFilters,
  clearFilters,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Filtrar aportes</h4>

      {/* Filtro por ANO */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Por ano</label>
        <Select 
          value={tempYearFilter || 'all'} 
          onValueChange={(value) => setTempYearFilter(value === 'all' ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos os anos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os anos</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          onValueChange={(value) => setTempOriginFilter(value === 'all' ? null : value as Origin | 'all-without-adjustments')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas as origens" />
          </SelectTrigger>
          <SelectContent>
            {ORIGIN_FILTER_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por tipo de registro */}
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
            {REGISTRATION_SOURCE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
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
  );
};
