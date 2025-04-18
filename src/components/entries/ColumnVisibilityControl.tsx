
/**
 * Componente para controlar a visibilidade das colunas da tabela
 * 
 * Permite que o usuário escolha quais colunas deseja visualizar
 * através de um popover com checkboxes
 */
import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ColumnConfig } from '@/types/table';

interface ColumnVisibilityControlProps {
  columns: ColumnConfig[];
  onColumnToggle: (columnId: string) => void;
}

const ColumnVisibilityControl: React.FC<ColumnVisibilityControlProps> = ({
  columns,
  onColumnToggle,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Colunas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-medium">Colunas visíveis</h4>
          <div className="flex flex-col space-y-3">
            {columns.map((column) => (
              <div key={column.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`column-${column.id}`}
                  checked={column.visible}
                  onCheckedChange={() => onColumnToggle(column.id)}
                />
                <Label htmlFor={`column-${column.id}`} className="text-sm font-normal">
                  {column.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnVisibilityControl;
