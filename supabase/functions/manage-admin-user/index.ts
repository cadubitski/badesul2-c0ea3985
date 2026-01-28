import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verificar autenticação do chamador
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Authorization header missing or invalid');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Criar cliente com o token do usuário
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validar o token usando getClaims
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getUser(token);
    
    if (claimsError || !claimsData.user) {
      console.log('Token validation failed:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;
    console.log('Authenticated user:', userId);

    // Verificar role do chamador usando service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('admin_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Role check result:', roleData, roleError?.message);

    if (roleError) {
      console.error('Error checking role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData || roleData.role !== 'super_admin') {
      console.log('User is not super_admin:', roleData?.role);
      return new Response(
        JSON.stringify({ error: 'Apenas super_admin pode gerenciar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, email, password, role, userId: targetUserId } = body;
    
    console.log('Action requested:', action, 'by user:', userId);

    if (action === 'create') {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email e senha são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Creating user with email:', email);

      // Criar usuário usando admin API
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User created:', userData.user.id);

      // Adicionar role
      const { error: roleInsertError } = await supabaseAdmin
        .from('admin_roles')
        .insert({
          user_id: userData.user.id,
          role: role || 'editor',
        });

      if (roleInsertError) {
        console.error('Error inserting role:', roleInsertError);
        // Tentar deletar o usuário criado
        await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
        return new Response(
          JSON.stringify({ error: 'Erro ao configurar permissões: ' + roleInsertError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User admin created successfully:', email);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário criado com sucesso',
          userId: userData.user.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: 'ID do usuário é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Não permitir auto-exclusão
      if (targetUserId === userId) {
        return new Response(
          JSON.stringify({ error: 'Você não pode excluir a si mesmo' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Deleting user:', targetUserId);

      // Deletar role primeiro
      const { error: deleteRoleError } = await supabaseAdmin
        .from('admin_roles')
        .delete()
        .eq('user_id', targetUserId);

      if (deleteRoleError) {
        console.error('Error deleting role:', deleteRoleError);
      }

      // Deletar usuário
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

      if (deleteUserError) {
        console.error('Error deleting user:', deleteUserError);
        return new Response(
          JSON.stringify({ error: deleteUserError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User admin removed:', targetUserId);

      return new Response(
        JSON.stringify({ success: true, message: 'Usuário removido com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor: ' + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
