
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, Bitcoin } from "lucide-react"

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
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-2">
              {/* Adiciona ícone de Bitcoin quando o toast mencionar Bitcoin */}
              {showBitcoinIcon && (
                <div className="mt-1">
                  <Bitcoin className="h-5 w-5 text-bitcoin" />
                </div>
              )}
              {/* Adiciona ícone de sucesso quando o toast for de sucesso e não for de Bitcoin */}
              {showSuccessIcon && !showBitcoinIcon && (
                <div className="mt-1">
                  <CheckCircle className="h-5 w-5" />
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
