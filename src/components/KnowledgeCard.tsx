import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface KnowledgeCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  category: "manuais" | "links";
}

const KnowledgeCard = ({ title, description, icon: Icon, href, category }: KnowledgeCardProps) => {
  const categoryColors = {
    manuais: "from-[hsl(210,100%,20%)] to-[hsl(210,80%,35%)]",
    links: "from-[hsl(150,100%,25%)] to-[hsl(150,80%,35%)]",
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block group">
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-white">
        <CardHeader className="pb-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColors[category]} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
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
