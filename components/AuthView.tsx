
import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  HeartPulse,
  UserPlus,
  LogIn,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Inbox,
  Home,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AuthViewProps {
  onLogin: (email: string, isNew?: boolean) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'intro' | 'login' | 'signup'>('intro');
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMode, setSuccessMode] = useState(false);

  const slides = [
    {
      title: "Casa360",
      subtitle: "Gestão Residencial Inteligente",
      desc: "Controle total da sua casa: finanças, tarefas, saúde e compras em um só lugar.",
      icon: <Home className="w-20 h-20 text-indigo-500" />,
      gradient: "from-indigo-500/20 to-purple-500/20",
      features: ["Dashboard interativo", "Controle financeiro", "Gestão de tarefas"]
    },
    {
      title: "Recursos Avançados",
      subtitle: "Tecnologia para o seu dia a dia",
      desc: "Notificações inteligentes, relatórios detalhados e sincronização automática entre dispositivos.",
      icon: <Sparkles className="w-20 h-20 text-amber-500" />,
      gradient: "from-amber-500/20 to-orange-500/20",
      features: ["Notificações push", "Relatórios gráficos", "Backup automático"]
    },
    {
      title: "Para Toda Família",
      subtitle: "Organização coletiva",
      desc: "Gerencie perfis individuais, atribua responsabilidades e mantenha todos conectados e produtivos.",
      icon: <HeartPulse className="w-20 h-20 text-rose-500" />,
      gradient: "from-rose-500/20 to-pink-500/20",
      features: ["Perfis familiares", "Controle de saúde", "Lista de compras"]
    }
  ];

  const handleNextSlide = () => {
    if (slide < slides.length - 1) setSlide(slide + 1);
    else setMode('login');
  };

  const handlePrevSlide = () => {
    if (slide > 0) setSlide(slide - 1);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 text-center space-y-8 border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <Inbox className="w-10 h-10 text-white animate-bounce" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Verifique seu e-mail</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Enviamos um link de confirmação para <span className="font-semibold text-indigo-600">{email}</span>.
              Clique no link para ativar sua conta.
            </p>
          </div>
          <button
            onClick={() => { setSuccessMode(false); setMode('login'); setPassword(''); }}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header with landing page link */}
      <div className="absolute top-6 left-6 z-10">
        <button
          onClick={() => window.open('landing.html', '_blank')}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors text-sm font-medium"
        >
          <Home className="w-4 h-4" />
          Ver Site
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">

          {mode === 'intro' && (
            <div className="flex flex-col h-full min-h-[600px]">
              {/* Slide Content */}
              <div className={`flex-1 p-12 flex flex-col items-center justify-center bg-gradient-to-br ${slides[slide].gradient} transition-all duration-500`}>
                <div className="text-center space-y-6">
                  <div className="animate-bounce-gentle">
                    {slides[slide].icon}
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{slides[slide].title}</h1>
                    <p className="text-lg font-medium text-indigo-600">{slides[slide].subtitle}</p>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-xs">{slides[slide].desc}</p>
                  </div>

                  {/* Features List */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {slides[slide].features.map((feature, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/60 backdrop-blur-sm rounded-full text-xs font-medium text-slate-700">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="p-8 space-y-6">
                <div className="flex justify-center gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlide(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        slide === i ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  {slide > 0 && (
                    <button
                      onClick={handlePrevSlide}
                      className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-semibold text-sm hover:bg-slate-200 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                  )}
                  <button
                    onClick={handleNextSlide}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    {slide === slides.length - 1 ? 'Começar' : 'Próximo'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <div className="p-10 space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {mode === 'login' ? 'Bem-vindo de volta!' : 'Criar conta'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {mode === 'login' ? 'Entre na sua conta Casa360' : 'Junte-se à família Casa360'}
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-sm animate-in slide-in-from-top duration-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-5">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="text-xs text-slate-500 mt-1">Mínimo 6 caracteres</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
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
                      Criar Conta
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-4">
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError(null);
                  }}
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Fazer login'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Casa360 • Versão 2.4 • Gestão Residencial Inteligente
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
