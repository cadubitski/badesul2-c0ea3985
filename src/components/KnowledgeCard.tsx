import { ExternalLink, HelpCircle, Bot, Headphones, Monitor, FileText, BookOpen, Link2, BarChart3, LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfiguracoes } from "@/hooks/usePortalData";

interface KnowledgeCardProps {
  title: string;
  description: string;
  iconName: string;
  href: string;
  categoryId: string;
}

// Mapear nomes de ícones para componentes Lucide
const iconMap: Record<string, LucideIcon> = {
  'help-circle': HelpCircle,
  'bot': Bot,
  'headphones': Headphones,
  'monitor': Monitor,
  'file': FileText,
  'file-text': FileText,
  'book-open': BookOpen,
  'link-2': Link2,
  'bar-chart-3': BarChart3,
  'folder': BookOpen,
};

const KnowledgeCard = ({ title, description, iconName, href, categoryId }: KnowledgeCardProps) => {
  const { data: config } = useConfiguracoes();
  const Icon = iconMap[iconName] || FileText;
  
  // Usar cores do banco para os cards
  const corPrimaria = config?.corPrimaria || '#1e3a5f';
  const corSecundaria = config?.corSecundaria || '#2e7d32';
  
  // Alternar cores baseado na categoria (simplificado)
  const isFirstCategory = categoryId === 'manuais' || categoryId.includes('manuais');

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block group">
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-white">
        <CardHeader className="pb-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"
            style={{
              background: `linear-gradient(135deg, ${corPrimaria}, ${isFirstCategory ? corPrimaria : corSecundaria})`
            }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
            {title}
            <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </a>
  );
};

export default KnowledgeCard;
