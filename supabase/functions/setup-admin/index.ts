import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Cliente com service role para operações administrativas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password, setupKey } = await req.json();

    // Chave de setup inicial para segurança (só permite setup uma vez)
    const SETUP_KEY = 'badesul-setup-2024';
    
    if (setupKey !== SETUP_KEY) {
      return new Response(
        JSON.stringify({ error: 'Chave de setup inválida' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe um super_admin
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_roles')
      .select('id')
      .eq('role', 'super_admin')
      .maybeSingle();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: 'Já existe um administrador configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar usuário
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma o email automaticamente
    });

    if (createError) {
      console.error('Erro ao criar usuário:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Adicionar role de super_admin
    const { error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .insert({
        user_id: userData.user.id,
        role: 'super_admin',
      });

    if (roleError) {
      console.error('Erro ao adicionar role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Usuário criado mas erro ao configurar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin criado com sucesso:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Administrador criado com sucesso',
        userId: userData.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no setup:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
