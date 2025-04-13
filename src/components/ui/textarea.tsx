
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Componente Textarea
 * 
 * Campo de texto multilinha estilizado com Tailwind.
 * 
 * Props aceitas:
 * - Todas as props padrão de um elemento textarea do HTML
 * - className: Classes adicionais de CSS (via Tailwind)
 * 
 * Usado em:
 * - Modal de importação do Satisfaction P2P
 * - Outros lugares onde seja necessário um campo de texto multilinha
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
