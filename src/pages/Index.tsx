import React from 'react';
import EntriesList from '@/components/EntriesList';
import { useBitcoinEntries } from '@/hooks/useBitcoinEntries';
import EntryForm from '@/components/EntryForm';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

const IndexPage: React.FC = () => {
  const { 
    entries, 
    isLoading, 
    currentRate, 
    addEntry, 
    updateEntry, 
    deleteEntry,
    importProgress,
    importEntriesFromSpreadsheet,
    refetch
  } = useBitcoinEntries();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleAddEntry = async (entry: any) => {
    try {
      await addEntry(entry);
      toast({
        title: "Aporte adicionado!",
        description: "Seu aporte foi registrado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar aporte",
        description: error.message || "Ocorreu um erro ao registrar o aporte.",
        variant: "destructive",
      });
    }
  };

  const handleEditEntry = async (id: string, entry: any) => {
    try {
      await updateEntry(id, entry);
      toast({
        title: "Aporte atualizado!",
        description: "Seu aporte foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar aporte",
        description: error.message || "Ocorreu um erro ao atualizar o aporte.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteEntry(id);
      toast({
        title: "Aporte excluído!",
        description: "Seu aporte foi excluído com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir aporte",
        description: error.message || "Ocorreu um erro ao excluir o aporte.",
        variant: "destructive",
      });
    }
  };
  
  const handleImportFile = async (file: File) => {
    try {
      const result = await importEntriesFromSpreadsheet(file);
      toast({
        title: "Importação concluída!",
        description: `Foram adicionados ${result.count} aportes à sua carteira.`,
        variant: "success",
      });
      refetch(); // Atualiza a lista de aportes
      return result;
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message || "Ocorreu um erro ao importar a planilha",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="container py-8">
      <Toaster />
      <div className="grid gap-6">
        <Card>
          <CardContent>
            {currentRate ? (
              <EntryForm onSubmit={handleAddEntry} currentRate={currentRate} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            )}
          </CardContent>
        </Card>
        <EntriesList
          entries={entries}
          currentRate={currentRate}
          onDelete={handleDeleteEntry}
          onEdit={handleEditEntry}
          selectedCurrency="BRL"
          displayUnit="SATS"
          isLoading={isLoading}
          importProgress={importProgress}
          onImportFile={handleImportFile}
        />
      </div>
    </div>
  );
};

export default IndexPage;
