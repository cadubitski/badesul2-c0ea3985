import { BookOpen, Link2, HelpCircle, Bot, Headphones, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface KnowledgeSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sidebarItems: SidebarItem[] = [
  { id: "all", label: "Todos os Recursos", icon: BookOpen },
  { id: "manuais", label: "Manuais e Procedimentos", icon: BookOpen },
  { id: "links", label: "Links Úteis", icon: Link2 },
];

const KnowledgeSidebar = ({ activeSection, onSectionChange }: KnowledgeSidebarProps) => {
  return (
    <aside className="w-64 bg-white border-r border-border min-h-[calc(100vh-104px)] p-4 shadow-sm">
      <nav className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
          Navegação
        </p>
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <Headphones className="h-4 w-4" />
            Abrir Chamado
          </a>
          <a
            href="https://gemini.google.com/gem/245dfc56d0fa?ts=6971292b"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <Bot className="h-4 w-4" />
            Assistente IA
          </a>
        </div>
      </div>
    </aside>
  );
};

export default KnowledgeSidebar;
