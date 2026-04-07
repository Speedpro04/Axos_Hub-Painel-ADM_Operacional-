import React, { useState, useEffect } from 'react'
import { login, signup, getCurrentUser, AuthUser } from '../services/auth'
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Sparkles } from 'lucide-react'

interface LoginPageProps {
  onLogin: (user: AuthUser) => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carrega usuario logado ao montar
  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) onLogin(user)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = isSignUp
        ? await signup(email, password, nome)
        : await login(email, password)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.user) {
        onLogin(result.user)
      }
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-inter p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00A3FF]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#00A3FF]/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-6">
            <svg viewBox="0 0 120 100" className="w-16 h-13 filter drop-shadow-[0_0_12px_rgba(0,163,255,0.4)]" aria-hidden="true">
              <defs>
                <linearGradient id="metal_grad" x1="15" y1="20" x2="95" y2="80" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset="0.5" stopColor="#94A3B8" />
                  <stop offset="1" stopColor="#475569" />
                </linearGradient>
                <linearGradient id="blue_swoosh" x1="10" y1="70" x2="100" y2="35" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#00A3FF" stopOpacity="0" />
                  <stop offset="0.6" stopColor="#00A3FF" />
                  <stop offset="1" stopColor="#60E0FF" />
                </linearGradient>
              </defs>
              <path d="M15 20L45 50L15 80H35L55 60L75 80H95L65 50L95 20H75L55 40L35 20H15Z" fill="url(#metal_grad)" />
              <path d="M10 70C5 50 15 20 100 35" stroke="url(#blue_swoosh)" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            SOLARA <span className="text-[#00A3FF]">CONNECT</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Sistema de Atendimento Inteligente
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-10">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight mb-1">
              {isSignUp ? 'Criar Conta' : 'Acessar Painel'}
            </h2>
            <p className="text-slate-400 text-sm mb-8 font-medium">
              {isSignUp
                ? 'Cadastre-se para gerenciar sua clínica'
                : 'Entre com suas credenciais de acesso'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[18px] outline-none focus:border-[#00A3FF] focus:ring-2 focus:ring-[#00A3FF]/10 text-slate-800 font-medium text-sm transition-all placeholder:text-slate-300"
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[18px] outline-none focus:border-[#00A3FF] focus:ring-2 focus:ring-[#00A3FF]/10 text-slate-800 font-medium text-sm transition-all placeholder:text-slate-300"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-[18px] outline-none focus:border-[#00A3FF] focus:ring-2 focus:ring-[#00A3FF]/10 text-slate-800 font-medium text-sm transition-all placeholder:text-slate-300"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#00A3FF] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium px-5 py-3 rounded-[18px] animate-in fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00A3FF] text-white py-4 rounded-[18px] font-bold text-sm uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isSignUp ? 'Criar Conta' : 'Entrar no Painel'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                  setPassword('')
                }}
                className="text-sm font-medium text-slate-400 hover:text-[#00A3FF] transition-colors"
              >
                {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
              </button>
            </div>
          </div>

          {/* Footer do card */}
          <div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-[#00A3FF]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Powered by Solara Connect AI
            </span>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          &copy; 2026 Solara Connect. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
