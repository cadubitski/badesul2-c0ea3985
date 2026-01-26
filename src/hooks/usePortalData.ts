import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ConfiguracaoGeral, 
  Categoria, 
  ItemRotina, 
  PortalConfig, 
  configKeyMap 
} from "@/types/database";

// Hook para configurações gerais
export function useConfiguracoes() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: async (): Promise<PortalConfig> => {
      const { data, error } = await supabase
        .from('configuracoes_gerais')
        .select('*');
      
      if (error) throw error;
      
      const config: PortalConfig = {
        corPrimaria: '#1e3a5f',
        corSecundaria: '#2e7d32',
        tituloHeader: 'Banco de Conhecimento',
        subtituloHeader: 'Central de Recursos e Procedimentos do Badesul',
      };
      
      (data as ConfiguracaoGeral[]).forEach((item) => {
        const key = configKeyMap[item.chave];
        if (key) {
          config[key] = item.valor;
        }
      });
      
      return config;
    },
  });
}

// Hook para categorias
export function useCategorias(includeInactive = false) {
  return useQuery({
    queryKey: ['categorias', includeInactive],
    queryFn: async (): Promise<Categoria[]> => {
      let query = supabase
        .from('categorias')
        .select('*')
        .order('ordem', { ascending: true });
      
      if (!includeInactive) {
        query = query.eq('ativo', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Categoria[];
    },
  });
}

// Hook para itens de rotina
export function useItensRotinas(categoriaId?: string, includeInactive = false) {
  return useQuery({
    queryKey: ['itens_rotinas', categoriaId, includeInactive],
    queryFn: async (): Promise<ItemRotina[]> => {
      let query = supabase
        .from('itens_rotinas')
        .select(`
          *,
          categoria:categorias(*)
        `)
        .order('ordem', { ascending: true });
      
      if (categoriaId) {
        query = query.eq('categoria_id', categoriaId);
      }
      
      if (!includeInactive) {
        query = query.eq('ativo', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ItemRotina[];
    },
  });
}

// Hook para atualizar configuração
export function useUpdateConfiguracao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chave, valor }: { chave: string; valor: string }) => {
      const { error } = await supabase
        .from('configuracoes_gerais')
        .update({ valor })
        .eq('chave', chave);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
    },
  });
}

// Hook para CRUD de categorias
export function useCategoriaMutations() {
  const queryClient = useQueryClient();
  
  const create = useMutation({
    mutationFn: async (categoria: Omit<Categoria, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('categorias')
        .insert(categoria)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
  
  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Categoria> & { id: string }) => {
      const { error } = await supabase
        .from('categorias')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
  
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
    },
  });
  
  return { create, update, remove };
}

// Hook para CRUD de itens
export function useItemMutations() {
  const queryClient = useQueryClient();
  
  const create = useMutation({
    mutationFn: async (item: Omit<ItemRotina, 'id' | 'created_at' | 'updated_at' | 'categoria'>) => {
      const { data, error } = await supabase
        .from('itens_rotinas')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_rotinas'] });
    },
  });
  
  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ItemRotina> & { id: string }) => {
      // Remove categoria do update pois é um relacionamento
      const { categoria, ...updateData } = updates as any;
      
      const { error } = await supabase
        .from('itens_rotinas')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_rotinas'] });
    },
  });
  
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('itens_rotinas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_rotinas'] });
    },
  });
  
  return { create, update, remove };
}
