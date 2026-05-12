/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  KeyRound, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  User as UserIcon,
  Shield
} from 'lucide-react';
import { auth, googleProvider } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Context & Types ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// --- Components ---
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Chat from './components/Chat';

type View = 'dashboard' | 'accounts' | 'tasks' | 'calendar' | 'chat';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Custom login state
  const [loginInput, setLoginInput] = useState('');
  const [passInput, setPassInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if session exists in localStorage
    const savedUser = localStorage.getItem('gothic_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validUsers = [
      { id: 'Sasha', login: 'Саша', pass: 'dhjvjj!A_', display: 'Саша' },
      { id: 'Asya', login: 'Ася', pass: 'асяпароль1_', display: 'Ася' }
    ];

    const match = validUsers.find(u => u.login === loginInput && u.pass === passInput);

    if (match) {
      const newUser = { uid: match.id, displayName: match.display, email: 'vbbubuludu@gmail.com' };
      setUser(newUser);
      localStorage.setItem('gothic_user', JSON.stringify(newUser));
      setError('');
    } else {
      setError('ACCESS_DENIED: Invalid Credentials');
    }
  };

  const handleLogOut = () => {
    setUser(null);
    localStorage.removeItem('gothic_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center text-white mono uppercase tracking-[0.5em] font-bold">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-10"
        >
          <div className="relative">
            <div className="w-16 h-16 border border-white/10 border-t-white rounded-none animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-white/40 display">Initiating_Curator_Protocol</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#000000] relative flex items-center justify-center px-6 overflow-hidden">
        <div className="noise-overlay" />
        <div className="scanline" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="command-panel max-w-md w-full p-8 md:p-16 rounded-none z-10 border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.02)] bg-[#0A0A0A]/90 backdrop-blur-3xl"
        >
          <div className="w-20 h-20 md:w-24 md:h-24 bg-black border border-white/10 rounded-none flex items-center justify-center mx-auto mb-8 md:mb-10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_100%)]" />
            <Shield className="w-10 h-10 text-white relative z-10 opacity-60" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/20 animate-[scanline_4s_linear_infinite]" />
          </div>

          <h1 hospitals-id="login-title" className="text-3xl text-white tracking-[0.3em] display mb-2">WorkSpace</h1>
          <p className="text-neutral-600 text-[10px] mono uppercase tracking-[0.4em] mb-12 font-bold italic">
            &mdash; Хранилище ограниченного доступа &mdash;
          </p>

          <form onSubmit={handleCustomLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[9px] mono text-neutral-500 uppercase tracking-widest text-left font-bold">Идентификатор</label>
              <input 
                type="text" 
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="UID"
                className="input-gothic w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[9px] mono text-neutral-500 uppercase tracking-widest text-left font-bold">Шифр-пароль</label>
              <input 
                type="password" 
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="PASSPHRASE"
                className="input-gothic w-full"
              />
            </div>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[9px] mono text-red-800 uppercase tracking-widest font-bold"
              >
                ОШИБКА: Доступ запрещен
              </motion.p>
            )}

            <button 
              type="submit"
              className="btn-gothic w-full mt-4"
            >
              Установить соединение
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5">
             <p className="text-[8px] mono text-neutral-700 tracking-[0.5em] uppercase font-bold italic">
               Осн. MMXXIV &bull; Режим тишины
             </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Аналитика', icon: LayoutDashboard },
    { id: 'accounts', label: 'Сейф', icon: KeyRound },
    { id: 'tasks', label: 'Задачи', icon: CheckSquare },
    { id: 'calendar', label: 'График', icon: CalendarIcon },
    { id: 'chat', label: 'Связь', icon: MessageSquare },
  ];

  return (
    <AuthContext.Provider value={{ user, loading, signIn: async () => {}, logOut: async () => handleLogOut() }}>
      <div className="min-h-screen bg-[#000000] text-[#FFFFFF] flex overflow-hidden serif">
        <div className="noise-overlay" />
        <div className="scanline" />

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-white/5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
            !isSidebarOpen && "-translate-x-full"
          )}
        >
          <div className="h-full flex flex-col pt-12 pb-8 px-8">
            <div className="mb-10 md:mb-16 relative">
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden absolute -right-4 -top-4 p-2 text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-xl md:text-2xl display text-white tracking-[0.2em] flex items-center gap-3">
                PROMT
                <span className="text-neutral-500">&amp;</span>
                SUPPORT
              </h1>
              <p className="text-[9px] md:text-[10px] mono text-neutral-600 uppercase tracking-[0.3em] font-bold mt-2">Joint_Operations</p>
            </div>

            <nav className="flex-grow space-y-2 md:space-y-4">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as any);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 py-3 text-[10px] mono uppercase tracking-[0.2em] transition-all group relative",
                    activeView === item.id 
                      ? "text-white" 
                      : "text-neutral-600 hover:text-neutral-300"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", activeView === item.id ? "text-white opacity-100" : "text-neutral-700 group-hover:text-neutral-500")} />
                  {item.label}
                  {activeView === item.id && (
                    <motion.div layoutId="nav-active" className="absolute -left-8 w-1 h-4 bg-white" />
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8 border-t border-white/5">
              <div className="flex items-center space-x-4 p-4 bg-[#0A0A0A] border border-white/5 mb-8 font-mono text-[9px] group cursor-default">
                <div className="w-10 h-10 bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5 text-neutral-700" />
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold truncate text-neutral-200 tracking-widest">{user.displayName || 'КУРАТОР'}</p>
                  <p className="text-neutral-600 uppercase tracking-widest text-[8px] mt-1">Канал активен</p>
                </div>
              </div>
              <button 
                onClick={handleLogOut}
                className="w-full flex items-center gap-3 py-3 text-[9px] mono uppercase tracking-[0.3em] text-neutral-700 hover:text-white transition-all italic border border-white/5 px-4"
              >
                <LogOut className="w-3 h-3" />
                Разорвать связь
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#000000] relative w-full">
          <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-12 bg-black/80 backdrop-blur-3xl z-40">
            <div className="flex items-center gap-4 md:gap-8">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-neutral-500 hover:text-white p-2 -ml-2"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <h2 className="text-[9px] md:text-[10px] display text-neutral-500 tracking-[0.3em] md:tracking-[0.5em] truncate max-w-[150px] md:max-w-none">{activeView}</h2>
            </div>
            
            <div className="flex items-center gap-6 md:gap-12">
              <div className="hidden sm:flex items-center space-x-3">
                <span className="w-1 h-1 bg-white opacity-20"></span>
                <span className="text-[8px] text-neutral-700 mono uppercase tracking-[0.4em] font-bold italic">Зашифрованный_канал</span>
              </div>
              <div className="text-[9px] text-neutral-500 mono uppercase tracking-[0.3em] font-bold">
                {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </header>

          <div className="flex-grow overflow-y-auto p-4 sm:p-8 md:p-12 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.02)_0%,transparent_50%)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="h-full"
              >
                {activeView === 'dashboard' && <Dashboard />}
                {activeView === 'accounts' && <Accounts />}
                {activeView === 'tasks' && <Tasks />}
                {activeView === 'calendar' && <Calendar />}
                {activeView === 'chat' && <Chat />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
