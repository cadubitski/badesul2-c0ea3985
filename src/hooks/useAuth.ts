import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AdminRole } from "@/types/database";

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  adminRole: AdminRole | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isAdmin: false,
    adminRole: null,
    loading: true,
  });

  useEffect(() => {
    // Listener de mudança de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
        }));
        
        // Verificar role de admin após autenticação
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setAuthState(prev => ({
            ...prev,
            isAdmin: false,
            adminRole: null,
            loading: false,
          }));
        }
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
      }));
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao verificar role:', error);
        setAuthState(prev => ({
          ...prev,
          isAdmin: false,
          adminRole: null,
          loading: false,
        }));
        return;
      }
      
      setAuthState(prev => ({
        ...prev,
        isAdmin: !!data,
        adminRole: data?.role as AdminRole || null,
        loading: false,
      }));
    } catch (error) {
      console.error('Erro ao verificar role:', error);
      setAuthState(prev => ({
        ...prev,
        isAdmin: false,
        adminRole: null,
        loading: false,
      }));
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
  };
}
