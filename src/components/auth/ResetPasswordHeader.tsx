
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

/**
 * Componente de cabeçalho para a página de redefinição de senha
 * Exibe o logo e título da aplicação
 */
const ResetPasswordHeader = () => {
  return (
    <>
      <div className="flex items-center justify-center mb-4">
        <img 
          src="https://wccbdayxpucptynpxhew.supabase.co/storage/v1/object/sign/icones/bitcoin.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzkxZmU5MzU4LWZjOTAtNDJhYi1hOWRlLTUwZmY4ZDJiNDYyNSJ9.eyJ1cmwiOiJpY29uZXMvYml0Y29pbi5wbmciLCJpYXQiOjE3NDQ0OTkzNDksImV4cCI6MTc3NjAzNTM0OX0.UMcsJt0r9ZhEcYmAtfv2QvtADaIshCKaTmKjD8oCAjo" 
          alt="Bitcoin" 
          className="h-10 w-10 object-contain mr-3" 
        />
        <CardTitle className="text-3xl font-bold">BITCOIN DCA PRO</CardTitle>
      </div>
      <CardDescription>
        Redefina sua senha para continuar
      </CardDescription>
    </>
  );
};

export default ResetPasswordHeader;
