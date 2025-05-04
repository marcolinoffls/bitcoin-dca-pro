
// src/App.tsx

import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Context providers and UI utilities
import { AuthProvider } from "./hooks/useAuth";
import RequireAuth from "./components/RequireAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as ReactToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

// Page components
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import SetPassword from "./pages/SetPassword";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";
import SatsflowAI from "./pages/SatsflowAI";
import FearGreedIndexPage from "./pages/FearGreedIndexPage";

import "./styles/globals.css";  // estilos globais da aplicação

const App = () => {
  // Cria um QueryClient apenas uma vez para todo o ciclo de vida do app
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Define o tempo que os dados ficam em cache antes de ficarem "stale"
            staleTime: 5 * 60 * 1000, // 5 minutos
            refetchOnWindowFocus: false, // não refaz chamadas ao focar a janela
          },
        },
      })
  );

  return (
    // Provedor do React Query para caching e gerenciamento de chamadas assíncronas
    <QueryClientProvider client={queryClient}>
      {/* Provedor de autenticação Supabase */}
      <AuthProvider>
        {/* Provedor de tooltips para toda a UI */}
        <TooltipProvider>
          {/* Toasters de notificações visuais */}
          <ReactToaster />
          <SonnerToaster />

          {/* Configuração de rotas */}
          <BrowserRouter>
            <Routes>
              {/*
                Rota para todos os fluxos de autenticação:
                - /auth           → página de login / cadastro
                - /auth/callback  → callback OAuth (Google, etc.)
                Qualquer rota sob /auth será renderizada pelo componente Auth.
              */}
              <Route path="/auth/*" element={<Auth />} />
              {/*
                Rotas de redefinição e confirmação de senha avulsas,
                caso queira ter páginas dedicadas fora do fluxo principal de Auth.
              */}
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/set-password" element={<SetPassword />} />

              {/*
                Rota protegida:
                - "/" somente acessível quando o usuário estiver autenticado.
                - RequireAuth faz o redirect para /auth se não houver sessão.
              */}
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Index />
                  </RequireAuth>
                }
              />

              {/* Rota para o índice de medo e ganância */}
              <Route
                path="/fear-greed-index"
                element={
                  <RequireAuth>
                    <FearGreedIndexPage />
                  </RequireAuth>
                }
              />

              {/* Rota para Satsflow AI */}
              <Route
                path="/satsflow-ai"
                element={
                  <RequireAuth>
                    <SatsflowAI />
                  </RequireAuth>
                }
              />

              {/* Rota do dashboard */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />

              {/* Rota administrativa */}
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <AdminPage />
                  </RequireAuth>
                }
              />

              {/*
                Qualquer outra rota não mapeada cai aqui (404).
              */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
