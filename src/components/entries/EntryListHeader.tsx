
/**
 * Componente de cabeçalho da lista de aportes com botões de ação
 */
import React from 'react';
import { FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import ColumnVisibilityControl from './ColumnVisibilityControl';
import { EntryFilters } from './EntryFilters';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Filter } from 'lucide-react';
import { ColumnConfig } from '@/types/table';

interface EntryListHeaderProps {
  isMobile: boolean;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  isFilterActive: boolean;
  isFilterPopoverOpen: boolean;
  handleFilterPopoverOpenChange: (open: boolean) => void;
  availableMonths: { value: string; label: string }[];
  tempMonthFilter: string | null;
  tempOriginFilter: "planilha" | "corretora" | "p2p" | null;
  tempRegistrationSourceFilter: "manual" | "planilha" | null;
  setTempMonthFilter: (value: string | null) => void;
  setTempOriginFilter: (value: "planilha" | "corretora" | "p2p" | null) => void;
  setTempRegistrationSourceFilter: (value: "manual" | "planilha" | null) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  visibleColumns: ColumnConfig[];
  onColumnToggle: (columnId: string) => void;
}

const EntryListHeader: React.FC<EntryListHeaderProps> = ({
  isMobile,
  isImportModalOpen,
  setIsImportModalOpen,
  isFilterActive,
  isFilterPopoverOpen,
  handleFilterPopoverOpenChange,
  availableMonths,
  tempMonthFilter,
  tempOriginFilter,
  tempRegistrationSourceFilter,
  setTempMonthFilter,
  setTempOriginFilter,
  setTempRegistrationSourceFilter,
  applyFilters,
  clearFilters,
  visibleColumns,
  onColumnToggle,
}) => {
  return (
    <div className="flex items-center justify-between">
      <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8">
            <img 
              src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/aportes.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYXBvcnRlcy5wbmciLCJpYXQiOjE3NDQ0OTc3MTMsImV4cCI6MTc3NjAzMzcxM30.ofk3Ocv9aFS_BI19nsngxNbJYjw10do5u3RjTgWrOTo" 
              alt="Aportes registrados"
              className="h-full w-full object-contain"
            />
          </div>
          Aportes registrados
        </div>
      </CardTitle>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-2"
        >
          <FileUp size={16} />
          {!isMobile && <span>Importar Planilha</span>}
        </Button>
        
        <ColumnVisibilityControl 
          columns={visibleColumns}
          onColumnToggle={onColumnToggle}
        />
        
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
            <EntryFilters
              availableMonths={availableMonths}
              tempMonthFilter={tempMonthFilter}
              tempOriginFilter={tempOriginFilter}
              tempRegistrationSourceFilter={tempRegistrationSourceFilter}
              setTempMonthFilter={setTempMonthFilter}
              setTempOriginFilter={setTempOriginFilter}
              setTempRegistrationSourceFilter={setTempRegistrationSourceFilter}
              applyFilters={applyFilters}
              clearFilters={clearFilters}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default EntryListHeader;
