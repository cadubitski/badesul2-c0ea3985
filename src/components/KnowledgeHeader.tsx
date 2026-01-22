import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface KnowledgeHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const KnowledgeHeader = ({ searchQuery, onSearchChange }: KnowledgeHeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-[hsl(210,100%,20%)] to-[hsl(150,100%,25%)] text-white py-6 px-8 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Banco de Conhecimento
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Badesul - Portal de Manuais e Procedimentos
            </p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar manuais, procedimentos..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-white/95 border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/50"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default KnowledgeHeader;
