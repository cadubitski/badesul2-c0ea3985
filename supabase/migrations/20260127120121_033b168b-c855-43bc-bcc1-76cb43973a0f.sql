-- Tabela para armazenar os dados de dashboards (Excel uploads)
CREATE TABLE public.dashboard_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES public.itens_rotinas(id) ON DELETE CASCADE,
    sheet_name TEXT NOT NULL,
    row_index INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para performance de busca por item
CREATE INDEX idx_dashboard_data_item_id ON public.dashboard_data(item_id);

-- Enable RLS
ALTER TABLE public.dashboard_data ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: leitura pública, modificação apenas para admins
CREATE POLICY "Dashboard data é público para leitura"
ON public.dashboard_data FOR SELECT
USING (true);

CREATE POLICY "Admins podem inserir dados"
ON public.dashboard_data FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar dados"
ON public.dashboard_data FOR DELETE
USING (is_admin(auth.uid()));

-- Criar bucket para armazenar arquivos Excel temporariamente (opcional)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('dashboard-uploads', 'dashboard-uploads', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket
CREATE POLICY "Admins podem fazer upload de arquivos"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'dashboard-uploads' 
    AND is_admin(auth.uid())
);

CREATE POLICY "Admins podem deletar arquivos"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'dashboard-uploads' 
    AND is_admin(auth.uid())
);

CREATE POLICY "Admins podem ler arquivos"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'dashboard-uploads' 
    AND is_admin(auth.uid())
);