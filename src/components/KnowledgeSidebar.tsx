import { useState } from "react";
import { BookOpen, Link2, Headphones, Bot, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategorias } from "@/hooks/usePortalData";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import AdminLoginModal from "./AdminLoginModal";

interface KnowledgeSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenAdmin?: () => void;
}

// Mapear ícones do banco para componentes Lucide
const iconMap: Record<string, React.ElementType> = {
  'book-open': BookOpen,
  'link-2': Link2,
  'folder': BookOpen,
};

const KnowledgeSidebar = ({ activeSection, onSectionChange, onOpenAdmin }: KnowledgeSidebarProps) => {
  const { data: categorias, isLoading } = useCategorias();
  const { isAdmin } = useAuth();
  const { trackCategoryClick, trackQuickLinkClick, trackAdminAccess } = useAnalytics();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleCategoryChange = (categoryId: string, categoryName: string) => {
    trackCategoryClick(categoryName);
    onSectionChange(categoryId);
  };

  const handleQuickLinkClick = (linkName: string) => {
    trackQuickLinkClick(linkName);
  };

  const handleAdminClick = () => {
    trackAdminAccess(isAdmin);
    if (isAdmin) {
      onOpenAdmin?.();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    onOpenAdmin?.();
  };

  return (
    <>
      <aside className="w-64 bg-white border-r border-border min-h-[calc(100vh-104px)] p-4 shadow-sm flex flex-col">
        <nav className="space-y-1 flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Navegação
          </p>
          
          {/* Opção "Todos" */}
          <button
            onClick={() => handleCategoryChange("all", "Todos os Recursos")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeSection === "all"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <BookOpen className="h-4 w-4" />
            Todos os Recursos
          </button>
          
          {/* Categorias dinâmicas do banco */}
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Carregando...</div>
          ) : (
            categorias?.map((categoria) => {
              const Icon = iconMap[categoria.icone] || BookOpen;
              const isActive = activeSection === categoria.id;
              
              return (
                <button
                  key={categoria.id}
                  onClick={() => handleCategoryChange(categoria.id, categoria.nome)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {categoria.nome}
                </button>
              );
            })
          )}
        </nav>
        
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Acesso Rápido
          </p>
          <div className="space-y-1">
            <a
              href="https://helpdesk.badesul.com.br/otobo/index.pl"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleQuickLinkClick("Abrir Chamado")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <Headphones className="h-4 w-4" />
              Abrir Chamado
            </a>
            <a
              href="https://gemini.google.com/gem/245dfc56d0fa?ts=6971292b"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleQuickLinkClick("Assistente IA")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            >
              <Bot className="h-4 w-4" />
              Assistente IA
            </a>
          </div>
        </div>
        
        {/* Ícone de Administração */}
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={handleAdminClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
            title="Área Administrativa"
          >
            <Settings className="h-4 w-4" />
            {isAdmin ? "Painel Admin" : "Administração"}
          </button>
        </div>
      </aside>
      
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default KnowledgeSidebar;
