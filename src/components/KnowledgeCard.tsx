import { useNavigate } from "react-router-dom";
import { ExternalLink, HelpCircle, Bot, Headphones, Monitor, FileText, BookOpen, Link2, BarChart3, LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfiguracoes } from "@/hooks/usePortalData";
import { getIconComponent } from "@/components/IconPicker";
import { useAnalytics } from "@/hooks/useAnalytics";

interface KnowledgeCardProps {
  title: string;
  description: string;
  iconName: string;
  href: string;
  categoryId: string;
  itemId: string;
  tipo: string;
}

const KnowledgeCard = ({ title, description, iconName, href, categoryId, itemId, tipo }: KnowledgeCardProps) => {
  const { data: config } = useConfiguracoes();
  const navigate = useNavigate();
  const { trackCardClick } = useAnalytics();
  const Icon = getIconComponent(iconName);
  
  // Usar cores do banco para os cards
  const corPrimaria = config?.corPrimaria || '#1e3a5f';
  const corSecundaria = config?.corSecundaria || '#2e7d32';
  
  // Alternar cores baseado na categoria (simplificado)
  const isFirstCategory = categoryId === 'manuais' || categoryId.includes('manuais');

  const handleClick = (e: React.MouseEvent) => {
    // Rastrear clique no GA
    trackCardClick(title, categoryId, tipo);
    
    // Se for do tipo dashboard, abrir página interna
    if (tipo === 'dashboard') {
      e.preventDefault();
      navigate(`/dashboard/${itemId}`);
    }
    // Para outros tipos, deixar o link padrão funcionar
  };

  return (
    <a 
      href={tipo === 'dashboard' ? '#' : href} 
      target={tipo === 'dashboard' ? undefined : "_blank"} 
      rel={tipo === 'dashboard' ? undefined : "noopener noreferrer"} 
      className="block group"
      onClick={handleClick}
    >
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
            {tipo !== 'dashboard' && (
              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            {tipo === 'dashboard' && (
              <BarChart3 className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
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
