
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, Bitcoin, AlertCircle, FileSpreadsheet } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Adiciona ícone automaticamente para toasts de sucesso
        const showSuccessIcon = variant === 'success';
        // Adiciona ícone de Bitcoin para toasts relacionados ao Bitcoin
        const showBitcoinIcon = 
          typeof title === 'string' && title.toLowerCase().includes('bitcoin') || 
          typeof description === 'string' && description.toLowerCase().includes('bitcoin') ||
          variant === 'default' && typeof title === 'string' && title.toLowerCase().includes('bitcoin');
        
        // Adiciona ícone de erro para toasts destrutivos
        const showErrorIcon = variant === 'destructive';
        
        // Adiciona ícone de planilha para toasts relacionados a importação
        const showFileIcon = 
          typeof title === 'string' && (
            title.toLowerCase().includes('import') ||
            title.toLowerCase().includes('planilha') ||
            title.toLowerCase().includes('arquivo')
          ) || 
          typeof description === 'string' && (
            description.toLowerCase().includes('import') ||
            description.toLowerCase().includes('planilha') ||
            description.toLowerCase().includes('arquivo')
          );
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-2">
              {/* Ícones por tipo */}
              {showBitcoinIcon && (
                <div className="mt-1">
                  <Bitcoin className="h-5 w-5 text-bitcoin" />
                </div>
              )}
              {showSuccessIcon && !showBitcoinIcon && (
                <div className="mt-1">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              )}
              {showErrorIcon && (
                <div className="mt-1">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              )}
              {showFileIcon && !showErrorIcon && !showSuccessIcon && !showBitcoinIcon && (
                <div className="mt-1">
                  <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                </div>
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
