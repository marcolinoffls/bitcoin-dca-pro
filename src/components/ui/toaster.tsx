
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Adiciona ícone automaticamente para toasts de sucesso
        const showSuccessIcon = variant === 'success';
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-2">
              {/* Adiciona ícone de sucesso quando o toast for de sucesso */}
              {showSuccessIcon && (
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
