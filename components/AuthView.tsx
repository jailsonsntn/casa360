
import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  LayoutDashboard, 
  Wallet, 
  HeartPulse, 
  CheckCircle, 
  UserPlus, 
  LogIn,
  Mail,
  Lock,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface AuthViewProps {
  onLogin: (email: string, isNew?: boolean) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'intro' | 'login' | 'signup'>('intro');
  const [slide, setSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const slides = [
    {
      title: "Sua casa em 360°",
      desc: "Uma gestão completa, desde as tarefas do dia a dia até o controle financeiro avançado.",
      icon: <LayoutDashboard className="w-16 h-16 text-indigo-500" />,
      color: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "Saúde & Finanças",
      desc: "Controle de medicamentos com alarmes e fluxo de caixa detalhado para sua residência.",
      icon: <HeartPulse className="w-16 h-16 text-rose-500" />,
      color: "bg-rose-50 dark:bg-rose-900/20"
    },
    {
      title: "Tudo Sincronizado",
      desc: "Instale no seu celular e receba notificações inteligentes para nunca esquecer nada.",
      icon: <Sparkles className="w-16 h-16 text-amber-500" />,
      color: "bg-amber-50 dark:bg-amber-900/20"
    }
  ];

  const handleNextSlide = () => {
    if (slide < slides.length - 1) setSlide(slide + 1);
    else setMode('login');
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, mode === 'signup');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-500">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
        
        {mode === 'intro' && (
          <div className="flex flex-col h-full">
            <div className={`p-12 flex items-center justify-center ${slides[slide].color} transition-colors duration-500`}>
              <div className="animate-float">
                {slides[slide].icon}
              </div>
            </div>
            <div className="p-10 space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{slides[slide].title}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{slides[slide].desc}</p>
              </div>
              
              <div className="flex justify-center gap-2">
                {slides.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${slide === i ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}></div>
                ))}
              </div>

              <button 
                onClick={handleNextSlide}
                className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
              >
                {slide === slides.length - 1 ? 'Começar Agora' : 'Continuar'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div className="p-10 space-y-8">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Casa360 Intelligent Home</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all shadow-xl shadow-indigo-200 dark:shadow-none mt-4"
              >
                {mode === 'login' ? <><LogIn className="w-4 h-4" /> Entrar</> : <><UserPlus className="w-4 h-4" /> Criar Conta</>}
              </button>
            </form>

            <div className="text-center pt-2">
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
              >
                {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já possui conta? Faça login'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Versão 2.1 • Personal Project</p>
    </div>
  );
};

export default AuthView;
