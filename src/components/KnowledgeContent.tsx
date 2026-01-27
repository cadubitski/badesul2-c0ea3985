import { useCategorias, useItensRotinas } from "@/hooks/usePortalData";
import KnowledgeCard from "./KnowledgeCard";
import { Loader2 } from "lucide-react";

interface KnowledgeContentProps {
  activeSection: string;
  searchQuery: string;
}

const KnowledgeContent = ({ activeSection, searchQuery }: KnowledgeContentProps) => {
  const { data: categorias, isLoading: loadingCategorias } = useCategorias();
  const { data: itens, isLoading: loadingItens } = useItensRotinas();

  const isLoading = loadingCategorias || loadingItens;

  // Filtrar itens baseado na seção ativa e busca
  const filteredItens = itens?.filter((item) => {
    const matchesSection = activeSection === "all" || item.categoria_id === activeSection;
    const matchesSearch =
      searchQuery === "" ||
      item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.descricao && item.descricao.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSection && matchesSearch;
  }) || [];

  // Agrupar itens por categoria
  const itensByCategoria = categorias?.map((categoria) => ({
    categoria,
    itens: filteredItens.filter((item) => item.categoria_id === categoria.id),
  })).filter((group) => group.itens.length > 0) || [];

  if (isLoading) {
    return (
      <main className="flex-1 p-8 bg-muted/30 overflow-auto flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex-1 p-8 bg-muted/30 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {filteredItens.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {searchQuery 
                ? `Nenhum recurso encontrado para a busca "${searchQuery}"`
                : "Nenhum recurso cadastrado nesta categoria"}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {itensByCategoria.map(({ categoria, itens }) => (
              <section key={categoria.id}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">
                    {categoria.icone === 'book-open' ? '📁' : '🔗'}
                  </span>
                  <h2 className="text-xl font-semibold text-foreground">
                    {categoria.nome}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {itens.map((item) => (
                    <KnowledgeCard
                      key={item.id}
                      title={item.nome}
                      description={item.descricao || ""}
                      iconName={item.icone}
                      href={item.link || "#"}
                      categoryId={item.categoria_id}
                      itemId={item.id}
                      tipo={item.tipo}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default KnowledgeContent;
