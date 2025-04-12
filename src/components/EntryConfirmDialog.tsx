
import React from 'react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

/**
 * Diálogo de confirmação para registro de aporte
 * 
 * Exibe um resumo dos dados preenchidos antes de confirmar o registro
 * Ajuda a evitar erros ao registrar aportes
 * 
 * @param open - estado que controla a visibilidade do modal
 * @param onOpenChange - função chamada quando o estado de visibilidade muda
 * @param onConfirm - função chamada quando o usuário confirma o aporte
 * @param data - dados do aporte a ser registrado
 */
interface EntryConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  data: {
    date: Date;
    amountInvested: string;
    btcAmount: string;
    exchangeRate: number;
    currency: 'BRL' | 'USD';
    origin: 'corretora' | 'p2p';
    displayUnit: 'BTC' | 'SATS';
  };
}

const EntryConfirmDialog: React.FC<EntryConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  data
}) => {
  const { date, amountInvested, btcAmount, exchangeRate, currency, origin, displayUnit } = data;
  
  // Formata o valor em BTC para exibição (considerando satoshis se necessário)
  const formattedBtcAmount = () => {
    try {
      const rawValue = btcAmount.replace(/\./g, '').replace(',', '.');
      const numValue = parseFloat(rawValue);
      
      if (isNaN(numValue)) return btcAmount;
      
      if (displayUnit === 'SATS') {
        return `${numValue} sats`;
      } else {
        return `${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 })} BTC`;
      }
    } catch (e) {
      return btcAmount;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[95%] w-[450px] rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar registro de aporte</AlertDialogTitle>
          <AlertDialogDescription>
            Verifique os dados abaixo antes de confirmar o registro do aporte:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Data:</div>
            <div className="font-medium">{format(date, 'dd/MM/yyyy', { locale: pt })}</div>
            
            <div className="text-muted-foreground">Moeda:</div>
            <div className="font-medium">{currency}</div>
            
            <div className="text-muted-foreground">Valor investido:</div>
            <div className="font-medium">{amountInvested} {currency}</div>
            
            <div className="text-muted-foreground">Bitcoin:</div>
            <div className="font-medium">{formattedBtcAmount()}</div>
            
            <div className="text-muted-foreground">Cotação:</div>
            <div className="font-medium">{formatNumber(exchangeRate)} {currency}</div>
            
            <div className="text-muted-foreground">Origem:</div>
            <div className="font-medium capitalize">{origin}</div>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-bitcoin hover:bg-bitcoin/90 rounded-lg"
          >
            Confirmar registro
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EntryConfirmDialog;
