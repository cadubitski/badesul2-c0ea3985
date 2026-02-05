
## Rastreamento de Eventos com Google Analytics

### Resumo
Implementar rastreamento automático de eventos de clique em todos os componentes dinâmicos do site, incluindo cards, categorias, links de acesso rápido e interações com dashboards.

### Abordagem Técnica

A solução utiliza um **hook centralizado** (`useAnalytics`) que abstrai todas as chamadas ao `gtag()`, permitindo rastreamento consistente em qualquer componente sem repetição de código.

### O que será rastreado

| Componente | Evento | Informações Capturadas |
|------------|--------|------------------------|
| KnowledgeCard | `card_click` | título, categoria, tipo (link/dashboard) |
| KnowledgeSidebar | `category_click` | nome da categoria |
| Links de Acesso Rápido | `quick_link_click` | destino (Chamado, Assistente IA) |
| Busca | `search` | termo buscado |
| Dashboard | `dashboard_view`, `chart_click` | nome do dashboard, dados clicados |
| Admin | `admin_access` | tentativa de acesso |

### Arquitetura

```text
┌────────────────────────────────────────────────────────┐
│                    useAnalytics()                       │
│  Hook centralizado para todos os eventos de tracking   │
├────────────────────────────────────────────────────────┤
│  trackEvent(eventName, params)                         │
│  trackCardClick(title, category, type)                 │
│  trackCategoryClick(categoryName)                      │
│  trackSearch(searchTerm)                               │
│  trackDashboardView(dashboardName)                     │
└────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
   KnowledgeCard   Sidebar      Header/Search    Dashboard
```

### Detalhes de Implementação

**1. Criar hook `useAnalytics` (`src/hooks/useAnalytics.ts`)**
- Função centralizada que verifica se `gtag` existe
- Métodos tipados para cada tipo de evento
- Funciona com componentes dinâmicos automaticamente

**2. Atualizar `KnowledgeCard.tsx`**
- Adicionar tracking no `handleClick`
- Enviar: título do card, categoria, tipo (link/dashboard)

**3. Atualizar `KnowledgeSidebar.tsx`**
- Rastrear cliques em categorias dinâmicas
- Rastrear cliques em links de acesso rápido
- Rastrear tentativas de acesso admin

**4. Atualizar `KnowledgeHeader.tsx`**
- Rastrear buscas (com debounce para evitar excesso)

**5. Atualizar `DashboardViewer.tsx`**
- Rastrear visualização de dashboard
- Rastrear cliques em gráficos (drilldown)

### Segurança e Performance

- O código verifica se `gtag` existe antes de chamar (evita erros)
- Eventos são enviados de forma assíncrona (não bloqueia UI)
- Nenhuma informação sensível é enviada ao GA
- Funciona automaticamente com novos itens criados pelo admin

### Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/useAnalytics.ts` | **Criar** - Hook centralizado |
| `src/components/KnowledgeCard.tsx` | Modificar - Adicionar tracking |
| `src/components/KnowledgeSidebar.tsx` | Modificar - Adicionar tracking |
| `src/components/KnowledgeHeader.tsx` | Modificar - Adicionar tracking de busca |
| `src/components/DashboardViewer.tsx` | Modificar - Adicionar tracking |

### Por que é seguro?

1. **Não altera lógica existente** - Apenas adiciona chamadas de tracking após ações já existentes
2. **Failsafe** - Se o GA não carregar, o site continua funcionando normalmente
3. **Componentes dinâmicos** - O tracking usa os dados que já existem nos componentes, então novos itens criados pelo admin são automaticamente rastreados
