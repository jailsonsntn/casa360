
import React, { useState } from 'react';
import {
  UserPlus,
  LogIn,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Inbox,
  Home,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

interface AuthViewProps {
  onLogin: (email: string, isNew?: boolean) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMode, setSuccessMode] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      setError('Login indisponível no momento. Configuração do Supabase ausente no deploy.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (signUpError) throw signUpError;
        setSuccessMode(true);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      setError(err.message || 'Ocorreu um erro. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  if (successMode) {
    return (
      <div className="min-h-screen bg-[#050b1f] text-slate-100 flex items-center justify-center p-4 sm:p-6" style={{ backgroundImage: 'radial-gradient(circle at 12% -16%, rgba(124,107,255,0.25) 0%, rgba(124,107,255,0) 42%), radial-gradient(circle at 90% 4%, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0) 34%)' }}>
        <div className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-slate-950/75 backdrop-blur p-6 sm:p-8 text-center space-y-6 shadow-2xl shadow-slate-950/60">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border border-cyan-400/40 bg-slate-900/90">
            <img src="/assets/logo.png" alt="Logo Casa360" className="w-10 h-10 object-contain" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Verifique seu e-mail</h2>
            <p className="text-sm text-slate-300 break-words">
              Enviamos um link de confirmação para <span className="font-semibold text-cyan-300">{email}</span>.
              É só clicar nele para ativar sua conta.
            </p>
          </div>
          <button
            onClick={() => { setSuccessMode(false); setMode('login'); setPassword(''); }}
            className="w-full bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-400 transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();

  return (
    <div className="min-h-screen bg-[#050b1f] text-slate-100 flex flex-col px-4 sm:px-0 pt-4 sm:pt-0" style={{ backgroundImage: 'radial-gradient(circle at 12% -16%, rgba(124,107,255,0.25) 0%, rgba(124,107,255,0) 42%), radial-gradient(circle at 90% 4%, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0) 34%)' }}>
      {!isNative && (
      <div className="relative sm:absolute top-0 sm:top-5 left-0 sm:left-5 z-10 mb-4 sm:mb-0">
        <button
          onClick={() => window.location.assign('/')}
          className="flex items-center gap-2 text-slate-300 hover:text-cyan-300 transition-colors text-sm font-medium"
        >
          <Home className="w-4 h-4" />
          Voltar para início
        </button>
      </div>
      )}

      <div className="flex-1 flex items-center justify-center py-2 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-indigo-500/30 bg-slate-950/75 backdrop-blur shadow-2xl shadow-slate-950/60 p-5 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl border border-cyan-400/40 bg-slate-900/90 flex items-center justify-center text-white mx-auto">
              <img src="/assets/logo.png" alt="Logo Casa360" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              {mode === 'login' ? 'Bem-vindo(a) ao Casa360' : 'Criar sua conta'}
            </h2>
            <p className="text-sm text-slate-300">
              {mode === 'login' ? 'Entre para continuar organizando sua casa com tranquilidade.' : 'Cadastre-se para começar a organizar a rotina da sua família.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-400/40 p-3 rounded-xl flex items-center gap-2 text-rose-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!isSupabaseConfigured && !error && (
            <div className="bg-amber-500/10 border border-amber-400/40 p-3 rounded-xl flex items-center gap-2 text-amber-200 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Ambiente sem configuração de autenticação.
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-900/85 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-900/85 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900/85 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Criar conta
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="text-sm font-medium text-slate-300 hover:text-cyan-300 transition-colors"
            >
              {mode === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
