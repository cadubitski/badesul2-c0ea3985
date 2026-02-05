import { Search } from "lucide-react";
import { useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { useConfiguracoes } from "@/hooks/usePortalData";
import { useAnalytics } from "@/hooks/useAnalytics";

interface KnowledgeHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const KnowledgeHeader = ({ searchQuery, onSearchChange }: KnowledgeHeaderProps) => {
  const { data: config } = useConfiguracoes();
  const { trackSearch } = useAnalytics();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Usar configurações do banco ou valores padrão
  const corPrimaria = config?.corPrimaria || '#1e3a5f';
  const corSecundaria = config?.corSecundaria || '#2e7d32';
  const titulo = config?.tituloHeader || 'Banco de Conhecimento';
  const subtitulo = config?.subtituloHeader || 'Badesul - Portal de Manuais e Procedimentos';

  const handleSearchChange = useCallback((value: string) => {
    onSearchChange(value);
    
    // Debounce para evitar excesso de eventos
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (value.trim().length >= 3) {
      debounceRef.current = setTimeout(() => {
        trackSearch(value.trim());
      }, 1000);
    }
  }, [onSearchChange, trackSearch]);

  return (
    <header 
      className="text-white py-6 px-8 shadow-lg"
      style={{
        background: `linear-gradient(to right, ${corPrimaria}, ${corSecundaria})`
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {titulo}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {subtitulo}
            </p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar manuais, procedimentos..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-white/95 border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/50"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default KnowledgeHeader;
