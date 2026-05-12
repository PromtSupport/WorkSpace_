import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Account } from '../types';
import { cn } from '../lib/utils';
import { Plus, Trash2, Eye, EyeOff, ExternalLink, Shield, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const [newAccount, setNewAccount] = useState({
    title: '',
    login: '',
    password: '',
    serviceUrl: '',
    notes: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'accounts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      setAccounts(docs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'accounts'));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'accounts'), {
        ...newAccount,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewAccount({ title: '', login: '', password: '', serviceUrl: '', notes: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'accounts');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эти учетные данные?')) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `accounts/${id}`);
    }
  };

  const togglePassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.login.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 md:space-y-12 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-0">
        <div>
          <h2 className="text-[10px] mono text-neutral-500 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-3 font-bold flex items-center gap-3">
            <Shield className="w-3 h-3 text-white opacity-40" />
            V-02: Крипто_Хранилище
          </h2>
          <p className="text-3xl md:text-4xl display text-white tracking-widest uppercase">Секретный Сейф</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-gothic w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Добавить Секрет
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-700 group-focus-within:text-white transition-colors" />
        <input 
          type="text"
          placeholder="Фильтр хранилища / Поиск по ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-gothic w-full pl-16 md:pl-20 py-6 md:py-8"
        />
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        <AnimatePresence>
          {filteredAccounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="command-panel p-6 md:p-10 rounded-none flex flex-col group border-white/5 bg-black"
            >
              <div className="flex items-start justify-between mb-10">
                <div className="w-14 h-14 bg-[#050505] border border-white/5 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-neutral-700 group-hover:text-white transition-colors" />
                </div>
                <button 
                  onClick={() => handleDelete(account.id!)}
                  className="p-3 text-neutral-800 hover:text-red-900 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h4 className="text-xl display mb-2 text-white tracking-widest">{account.title}</h4>
              <p className="text-[9px] mono text-neutral-600 mb-10 flex items-center gap-3 font-bold italic tracking-tighter">
                {account.serviceUrl ? (
                  <a href={account.serviceUrl} target="_blank" className="hover:text-white flex items-center gap-2 transition-colors uppercase">
                    {new URL(account.serviceUrl).hostname} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : 'LOCAL_ENDPOINT'}
              </p>

              <div className="space-y-6">
                <div className="p-6 bg-[#050505] border border-white/5 rounded-none">
                  <label className="block text-[8px] mono text-neutral-700 uppercase tracking-widest mb-3 font-bold">Идентификация</label>
                  <div className="text-xs font-mono text-neutral-400 flex items-center justify-between">
                    <span className="truncate mr-4 tracking-tighter font-bold">{account.login}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(account.login)}
                      className="text-[8px] text-neutral-600 uppercase font-bold hover:text-white transition-colors tracking-widest"
                    >
                      Копировать
                    </button>
                  </div>
                </div>
                <div className="p-6 bg-[#050505] border border-white/5 rounded-none">
                  <label className="block text-[8px] mono text-neutral-700 uppercase tracking-widest mb-3 font-bold">Ключ доступа</label>
                  <div className="text-xs font-mono text-neutral-400 flex items-center justify-between">
                    <span className={cn("truncate mr-4 tracking-widest", !showPassword[account.id!] && "blur-xl select-none opacity-20")}>
                      {showPassword[account.id!] ? account.password : 'HASHED_SECRET_LOG'}
                    </span>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => togglePassword(account.id!)}
                        className="text-neutral-800 hover:text-white transition-colors"
                      >
                        {showPassword[account.id!] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => account.password && navigator.clipboard.writeText(account.password)}
                        className="text-[8px] text-neutral-600 uppercase font-bold hover:text-white transition-colors tracking-widest"
                      >
                        Копировать
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {account.notes && (
                <div className="mt-10 pt-10 border-t border-white/5">
                  <p className="text-[9px] text-neutral-600 leading-loose mono uppercase font-bold italic tracking-tighter">{account.notes}</p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="command-panel max-w-2xl w-full p-8 md:p-16 rounded-none z-10 shadow-2xl border-white/10 overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl md:text-3xl display mb-8 md:mb-12 text-white tracking-widest uppercase">Новая Запись</h3>
              <form onSubmit={handleAdd} className="space-y-6 md:space-y-8 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Наименование</label>
                    <input 
                      required
                      value={newAccount.title}
                      onChange={(e) => setNewAccount({...newAccount, title: e.target.value})}
                      className="input-gothic w-full"
                      placeholder="Сервис / Ресурс"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Протокол / URL</label>
                    <input 
                      value={newAccount.serviceUrl}
                      onChange={(e) => setNewAccount({...newAccount, serviceUrl: e.target.value})}
                      className="input-gothic w-full"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Логин / Email</label>
                  <input 
                    required
                    value={newAccount.login}
                    onChange={(e) => setNewAccount({...newAccount, login: e.target.value})}
                    className="input-gothic w-full"
                    placeholder="..."
                  />
                </div>
                <div>
                  <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Пароль / Хеш</label>
                  <input 
                    required
                    type="password"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                    className="input-gothic w-full"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Контекстные_Данные</label>
                  <textarea 
                    value={newAccount.notes}
                    onChange={(e) => setNewAccount({...newAccount, notes: e.target.value})}
                    className="input-gothic w-full h-32 md:h-40 resize-none"
                    placeholder="..."
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 md:gap-8 pt-4 md:pt-8">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-grow py-4 md:py-5 border border-white/5 text-[9px] font-bold mono uppercase tracking-widest rounded-none hover:bg-white/5 transition-all text-neutral-600 order-2 sm:order-1"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    className="btn-gothic flex-grow order-1 sm:order-2"
                  >
                    Запечатать
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
