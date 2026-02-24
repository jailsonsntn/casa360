
import React, { useState } from 'react';
import {
  Sparkles,
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
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center space-y-6">
          <div className="w-14 h-14 bg-teal-600 rounded-xl flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Verifique seu e-mail</h2>
            <p className="text-sm text-slate-600 break-words">
              Enviamos um link de confirmação para <span className="font-semibold text-teal-700">{email}</span>.
              É só clicar nele para ativar sua conta.
            </p>
          </div>
          <button
            onClick={() => { setSuccessMode(false); setMode('login'); setPassword(''); }}
            className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col px-4 sm:px-0 pt-4 sm:pt-0">
      <div className="relative sm:absolute top-0 sm:top-5 left-0 sm:left-5 z-10 mb-4 sm:mb-0">
        <button
          onClick={() => window.location.assign('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-teal-700 transition-colors text-sm font-medium"
        >
          <Home className="w-4 h-4" />
          Voltar para início
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center py-2 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
              {mode === 'login' ? 'Bem-vindo(a) ao Casa360' : 'Criar sua conta'}
            </h2>
            <p className="text-sm text-slate-600">
              {mode === 'login' ? 'Entre para continuar organizando sua casa com tranquilidade.' : 'Cadastre-se para começar a organizar a rotina da sua família.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {!isSupabaseConfigured && !error && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Ambiente sem configuração de autenticação.
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full bg-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
              className="text-sm font-medium text-slate-600 hover:text-teal-700 transition-colors"
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
