import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

/**
 * Tabs
 * Componente raiz do sistema de abas (Radix Tabs)
 * Usado para agrupar conteúdos com navegação por botões ("abas")
 */
const Tabs = TabsPrimitive.Root

/**
 * TabsList
 * Container que agrupa os botões de navegação (abas) como "Entrar" e "Criar Conta".
 * Ajustado com `w-full` para ocupar toda a largura disponível.
 * Usado, por exemplo, na tela de login para alternar entre abas.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Classes para responsividade e layout
      "flex mx-auto min-w-[280px] w-[320px] max-w-[400px] rounded-md border bg-muted p-0",
      // Breakpoint para telas maiores
      "sm:w-[400px]",
      className
    )}
    // Atributos de acessibilidade
    role="tablist"
    aria-orientation="horizontal"
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * TabsTrigger
 * Cada botão de aba, como "Entrar" ou "Criar Conta".
 * Aplica estilos diferentes quando estiver ativo (data-[state=active]).
 * Usado para trocar o conteúdo da aba visível.
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Classes base para layout e aparência
      "flex-1 px-4 py-2 text-sm font-medium text-muted-foreground transition-all",
      // Classes para acessibilidade
      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      // Classes para estado ativo
      "data-[state=active]:bg-background data-[state=active]:text-foreground",
      // Feedback visual
      "hover:bg-background/50",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * TabsContent
 * Área de conteúdo que aparece ao selecionar uma aba.
 * Por exemplo: formulário de login ou de cadastro.
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      // Adiciona animação de fade suave ao trocar de aba
      "mt-2 animate-in fade-in-0 duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

/**
 * Exporta os componentes para uso externo
 * Usado no Auth.tsx (login/cadastro) ou onde houver navegação por abas
 */
export { Tabs, TabsList, TabsTrigger, TabsContent }