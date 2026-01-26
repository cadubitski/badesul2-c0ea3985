// Tipos do banco de dados do portal Badesul

export type ItemTipo = 'link' | 'faq' | 'dashboard' | 'manual';
export type AdminRole = 'super_admin' | 'admin' | 'editor';

export interface ConfiguracaoGeral {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  created_at: string;
  updated_at: string;
}

export interface Categoria {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemRotina {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  link: string | null;
  tipo: ItemTipo;
  icone: string;
  ordem: number;
  ativo: boolean;
  prompt_instrucao: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamento
  categoria?: Categoria;
}

export interface AdminRoleRecord {
  id: string;
  user_id: string;
  role: AdminRole;
  created_at: string;
}

// Configurações agrupadas para uso no frontend
export interface PortalConfig {
  corPrimaria: string;
  corSecundaria: string;
  tituloHeader: string;
  subtituloHeader: string;
}

// Mapear chaves do banco para o objeto config
export const configKeyMap: Record<string, keyof PortalConfig> = {
  'cor_primaria': 'corPrimaria',
  'cor_secundaria': 'corSecundaria',
  'titulo_header': 'tituloHeader',
  'subtitulo_header': 'subtituloHeader',
};
