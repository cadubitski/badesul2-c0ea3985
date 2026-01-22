import { FileQuestion, Bot, Headphones, Monitor, Server, UserCheck } from "lucide-react";
import KnowledgeCard from "./KnowledgeCard";

interface Resource {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  category: "manuais" | "links";
}

const resources: Resource[] = [
  {
    id: "faqs",
    title: "FAQs",
    description: "Perguntas frequentes e respostas sobre processos e procedimentos internos do Badesul.",
    icon: FileQuestion,
    href: "https://drive.google.com/drive/folders/1vbSAQ94isGRR8dmfyO3XgYRaz6DqlCHl?usp=drive_link",
    category: "manuais",
  },
  {
    id: "ia",
    title: "Assistente IA",
    description: "A IA pode auxiliar em dúvidas e procedimentos de forma rápida e inteligente.",
    icon: Bot,
    href: "https://gemini.google.com/gem/245dfc56d0fa?ts=6971292b",
    category: "manuais",
  },
  {
    id: "otobo",
    title: "OTOBO - Chamados",
    description: "Abra chamados de suporte técnico através do sistema de helpdesk OTOBO.",
    icon: Headphones,
    href: "https://helpdesk.badesul.com.br/otobo/index.pl",
    category: "manuais",
  },
  {
    id: "protheus-prod",
    title: "Protheus Produção",
    description: "Acesso ao ambiente de produção do sistema Protheus TOTVS.",
    icon: Monitor,
    href: "https://badesul133883.protheus.cloudtotvs.com.br:4010/webapp/",
    category: "links",
  },
  {
    id: "protheus-folha",
    title: "Protheus Validação da Folha",
    description: "Ambiente de validação para processos relacionados à folha de pagamento.",
    icon: UserCheck,
    href: "http://badesul134150.protheus.cloudtotvs.com.br:2352/webapp/",
    category: "links",
  },
  {
    id: "protheus-atendimento",
    title: "Protheus Atendimento",
    description: "Sistema Protheus dedicado ao atendimento e suporte aos usuários.",
    icon: Server,
    href: "https://badesul173428.protheus.cloudtotvs.com.br:4010/webapp/",
    category: "links",
  },
];

interface KnowledgeContentProps {
  activeSection: string;
  searchQuery: string;
}

const KnowledgeContent = ({ activeSection, searchQuery }: KnowledgeContentProps) => {
  const filteredResources = resources.filter((resource) => {
    const matchesSection = activeSection === "all" || resource.category === activeSection;
    const matchesSearch =
      searchQuery === "" ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const manuaisResources = filteredResources.filter((r) => r.category === "manuais");
  const linksResources = filteredResources.filter((r) => r.category === "links");

  return (
    <main className="flex-1 p-8 bg-muted/30 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Nenhum recurso encontrado para a busca "{searchQuery}"
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {(activeSection === "all" || activeSection === "manuais") && manuaisResources.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">📁</span>
                  <h2 className="text-xl font-semibold text-foreground">Manuais e Procedimentos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {manuaisResources.map((resource) => (
                    <KnowledgeCard
                      key={resource.id}
                      title={resource.title}
                      description={resource.description}
                      icon={resource.icon}
                      href={resource.href}
                      category={resource.category}
                    />
                  ))}
                </div>
              </section>
            )}

            {(activeSection === "all" || activeSection === "links") && linksResources.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">🔗</span>
                  <h2 className="text-xl font-semibold text-foreground">Links Úteis</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {linksResources.map((resource) => (
                    <KnowledgeCard
                      key={resource.id}
                      title={resource.title}
                      description={resource.description}
                      icon={resource.icon}
                      href={resource.href}
                      category={resource.category}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default KnowledgeContent;
