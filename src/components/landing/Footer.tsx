
/**
 * Componente: Footer
 * 
 * O que faz:
 * - Exibe o rodapé da landing page com informações de copyright e links para redes sociais.
 * 
 * Onde é usado:
 * - Na `LandingPage.tsx`.
 * 
 * Como se conecta:
 * - Não recebe props.
 */
export function Footer() {
  return (
    <footer className="py-6 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row max-w-5xl">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Bitcoin DCA Pro. Stay humble and stack Sats.
        </p>
        <div className="flex items-center gap-4">
          <a href="https://twitter.com/satsflowbitcoin" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
            Twitter
          </a>
          {/* Adicione outros links de redes sociais aqui */}
        </div>
      </div>
    </footer>
  );
}
