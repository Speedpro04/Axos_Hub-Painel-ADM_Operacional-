import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  nome: string
}

export async function login(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const message = error.message.includes('Invalid login credentials')
      ? 'Email ou senha incorretos'
      : `Erro ao entrar: ${error.message}`
    return { user: null, error: message }
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email || '',
      nome: data.user.user_metadata?.nome || data.user.email?.split('@')[0] || 'Usuario',
    },
    error: null,
  }
}

export async function signup(email: string, password: string, nome: string): Promise<{ user: AuthUser | null; error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
    },
  })

  if (error) {
    return { user: null, error: error.message }
  }

  return {
    user: {
      id: data.user?.id || '',
      email: data.user?.email || '',
      nome: data.user?.user_metadata?.nome || email.split('@')[0],
    },
    error: null,
  }
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null

  return {
    id: data.user.id,
    email: data.user.email || '',
    nome: data.user.user_metadata?.nome || data.user.email?.split('@')[0] || 'Usuario',
  }
}

// Listener de mudanças de auth (login, logout, refresh)
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        nome: session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuario',
      })
    } else {
      callback(null)
    }
  })
}
