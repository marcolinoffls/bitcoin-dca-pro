import { useEffect, useState } from "react"
import { formatCurrency } from "@/lib/utils"
import { EntryForm } from "@/components/EntryForm"
import { EntriesList } from "@/components/EntriesList"
import { getCurrentPrice } from "@/services/priceService"
import { BitcoinEntry } from "@/types"
import { PriceCard } from "@/components/PriceCard"
import { StatisticsCard } from "@/components/StatisticsCard"
import { BitcoinIcon } from "lucide-react"
import { useMediaQuery } from "usehooks-ts"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { LogOut } from "lucide-react"

export default function Index() {
  const { user, signOut } = useAuth()
  const isMobile = useMediaQuery("(max-width: 768px)")
  
  // Lista de aportes
  const [entries, setEntries] = useState<BitcoinEntry[]>([])
  // Cotação atual
  const [currentRate, setCurrentRate] = useState({
    USD: 0,
    BRL: 0,
    updatedAt: new Date().toISOString()
  })

  // Carrega as cotações atuais
  useEffect(() => {
    getCurrentPrice().then(setCurrentRate)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Container central da página */}
      <div className="container mx-auto py-6 px-4">
        
        {/* ========== TOPO com logo e sair ========== */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-3">
            {/* Bloco com o logo do Bitcoin + texto em imagem */}
            <div className="flex items-center gap-3">
              {/* Ícone Bitcoin */}
              <div className="h-10 w-10">
                <img
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin%20logo%20oficial%20sem%20nome%20100px.png"
                  alt="Bitcoin Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Imagem com o nome "Bitcoin DCA Pro" */}
              <div className="h-8 ml-2">
                <img
                  src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/public/fontes/Bitcoin%20dca%20pro%20-%20caixa%20alta.png"
                  alt="Bitcoin DCA Pro"
                  className="h-full object-contain"
                />
              </div>
            </div>

            {/* Botão de sair */}
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-1"
              >
                <LogOut size={16} />
                <span className={isMobile ? "hidden" : "inline"}>Sair</span>
              </Button>
            </div>
          </div>

          {/* Descrição abaixo do logo */}
          <div className="flex items-center justify-between">
            <p
              className={`text-muted-foreground ${
                isMobile ? "text-xs" : ""
              }`}
            >
              Stay Humble and Stack Sats
            </p>
          </div>
        </header>

        {/* ======== SEO com H1 oculto ======== */}
        <h1 className="sr-only">Bitcoin DCA Pro - acompanhe seus aportes</h1>

        {/* ========== CONTEÚDO PRINCIPAL ========== */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr]">
          {/* ----- CARD DO PORTFÓLIO ----- */}
          <div className="lg:col-span-1">
            <StatisticsCard entries={entries} currentRate={currentRate} />
          </div>

          {/* ----- CARD COTAÇÃO ----- */}
          <div className="lg:col-span-2">
            <PriceCard currentRate={currentRate} />
          </div>

          {/* ----- CARD PREÇO MÉDIO ----- */}
          <div className="lg:col-span-1">
            {/* Esse componente já possui seus próprios estilos */}
            {/* Se quiser mover ou realocar, faça por grid */}
            {/* Aqui está posicionado abaixo do card do portfólio */}
          </div>

          {/* ----- FORMULÁRIO DE APORTES ----- */}
          <div className="lg:col-span-2">
            <EntryForm
              currentRate={currentRate}
              entries={entries}
              onAddEntry={(entry) => setEntries((prev) => [entry, ...prev])}
            />
          </div>

          {/* ----- LISTA DE APORTES REGISTRADOS ----- */}
          <div className="lg:col-span-3">
            <EntriesList
              entries={entries}
              setEntries={setEntries}
              currentRate={currentRate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
