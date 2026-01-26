-- =====================================================
-- TAREFA 1: INFRAESTRUTURA DE DADOS DO PORTAL BADESUL
-- =====================================================

-- 1. Criar enum para tipos de item
CREATE TYPE public.item_tipo AS ENUM ('link', 'faq', 'dashboard', 'manual');

-- 2. Criar enum para roles de admin
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin', 'editor');

-- =====================================================
-- TABELA: configuracoes_gerais
-- Armazena cores, títulos e configurações visuais
-- =====================================================
CREATE TABLE public.configuracoes_gerais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.configuracoes_gerais (chave, valor, descricao) VALUES
('cor_primaria', '#1e3a5f', 'Cor azul marinho do gradiente'),
('cor_secundaria', '#2e7d32', 'Cor verde bandeira do gradiente'),
('titulo_header', 'Banco de Conhecimento', 'Título principal do portal'),
('subtitulo_header', 'Central de Recursos e Procedimentos do Badesul', 'Subtítulo do portal');

-- =====================================================
-- TABELA: categorias
-- Grupos principais (Manuais, Links Úteis, etc.)
-- =====================================================
CREATE TABLE public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    icone TEXT DEFAULT 'folder',
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir categorias padrão
INSERT INTO public.categorias (nome, descricao, icone, ordem) VALUES
('Manuais e Procedimentos', 'Documentação e procedimentos operacionais', 'book-open', 1),
('Links Úteis', 'Links para sistemas e ferramentas', 'link-2', 2);

-- =====================================================
-- TABELA: itens_rotinas
-- Itens internos (FAQs, Links, Dashboards)
-- =====================================================
CREATE TABLE public.itens_rotinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE CASCADE NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    link TEXT,
    tipo item_tipo DEFAULT 'link',
    icone TEXT DEFAULT 'file',
    ordem INT DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    prompt_instrucao TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir itens padrão (migrando dados estáticos)
-- Primeiro, obter IDs das categorias
DO $$
DECLARE
    cat_manuais UUID;
    cat_links UUID;
BEGIN
    SELECT id INTO cat_manuais FROM public.categorias WHERE nome = 'Manuais e Procedimentos';
    SELECT id INTO cat_links FROM public.categorias WHERE nome = 'Links Úteis';
    
    -- Itens de Manuais e Procedimentos
    INSERT INTO public.itens_rotinas (categoria_id, nome, descricao, link, tipo, icone, ordem) VALUES
    (cat_manuais, 'FAQs', 'Perguntas frequentes e respostas', 'https://drive.google.com/drive/folders/1vbSAQ94isGRR8dmfyO3XgYRaz6DqlCHl?usp=drive_link', 'faq', 'help-circle', 1),
    (cat_manuais, 'Assistente IA', 'IA para auxiliar em dúvidas e procedimentos', 'https://gemini.google.com/gem/245dfc56d0fa?ts=6971292b', 'link', 'bot', 2),
    (cat_manuais, 'Abrir Chamado', 'Sistema OTOBO para chamados', 'https://helpdesk.badesul.com.br/otobo/index.pl', 'link', 'headphones', 3);
    
    -- Itens de Links Úteis
    INSERT INTO public.itens_rotinas (categoria_id, nome, descricao, link, tipo, icone, ordem) VALUES
    (cat_links, 'Protheus Produção', 'Sistema Protheus de Produção', 'https://badesul133883.protheus.cloudtotvs.com.br:4010/webapp/', 'link', 'monitor', 1),
    (cat_links, 'Protheus Validação Folha', 'Sistema Protheus de Validação da Folha', 'http://badesul134150.protheus.cloudtotvs.com.br:2352/webapp/', 'link', 'monitor', 2),
    (cat_links, 'Protheus Atendimento', 'Sistema Protheus de Atendimento', 'https://badesul173428.protheus.cloudtotvs.com.br:4010/webapp/', 'link', 'monitor', 3);
END $$;

-- =====================================================
-- TABELA: admin_roles (roles separados por segurança)
-- =====================================================
CREATE TABLE public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role admin_role NOT NULL DEFAULT 'editor',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- =====================================================
-- FUNÇÃO: Verificar se usuário tem role de admin
-- =====================================================
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID, _role admin_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Função para verificar se é qualquer tipo de admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_roles
        WHERE user_id = _user_id
    )
$$;

-- =====================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_configuracoes_gerais_updated_at
BEFORE UPDATE ON public.configuracoes_gerais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at
BEFORE UPDATE ON public.categorias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itens_rotinas_updated_at
BEFORE UPDATE ON public.itens_rotinas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.configuracoes_gerais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_rotinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: configuracoes_gerais
-- Leitura pública (todos podem ver configurações)
CREATE POLICY "Configurações são públicas para leitura"
ON public.configuracoes_gerais FOR SELECT
USING (true);

-- Apenas admins podem modificar
CREATE POLICY "Admins podem modificar configurações"
ON public.configuracoes_gerais FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- POLÍTICAS: categorias
-- Leitura pública para categorias ativas
CREATE POLICY "Categorias ativas são públicas"
ON public.categorias FOR SELECT
USING (ativo = true OR public.is_admin(auth.uid()));

-- Admins podem fazer CRUD completo
CREATE POLICY "Admins podem criar categorias"
ON public.categorias FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar categorias"
ON public.categorias FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar categorias"
ON public.categorias FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- POLÍTICAS: itens_rotinas
-- Leitura pública para itens ativos
CREATE POLICY "Itens ativos são públicos"
ON public.itens_rotinas FOR SELECT
USING (ativo = true OR public.is_admin(auth.uid()));

-- Admins podem fazer CRUD completo
CREATE POLICY "Admins podem criar itens"
ON public.itens_rotinas FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem atualizar itens"
ON public.itens_rotinas FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar itens"
ON public.itens_rotinas FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- POLÍTICAS: admin_roles
-- Apenas super_admin pode ver/modificar roles
CREATE POLICY "Super admins podem ver roles"
ON public.admin_roles FOR SELECT
TO authenticated
USING (public.has_admin_role(auth.uid(), 'super_admin') OR user_id = auth.uid());

CREATE POLICY "Super admins podem criar roles"
ON public.admin_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_admin_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins podem atualizar roles"
ON public.admin_roles FOR UPDATE
TO authenticated
USING (public.has_admin_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins podem deletar roles"
ON public.admin_roles FOR DELETE
TO authenticated
USING (public.has_admin_role(auth.uid(), 'super_admin'));