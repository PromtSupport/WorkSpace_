import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ChatMessage } from '../types';
import { Send, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useAuth } from '../App';

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(docs);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const text = inputText;
    setInputText('');

    try {
      await addDoc(collection(db, 'messages'), {
        text,
        senderId: user.uid,
        senderName: user.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="h-full flex flex-col bg-black rounded-none border border-white/5 overflow-hidden relative shadow-2xl">
      {/* Header */}
      <div className="p-10 border-b border-white/5 bg-black/80 backdrop-blur-3xl z-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-none bg-[#050505] border border-white/5 flex items-center justify-center relative">
            <span className="w-3 h-3 rounded-full bg-white absolute -top-1 -right-1 border-2 border-black animate-pulse opacity-40"></span>
            <Shield className="w-8 h-8 text-neutral-800" />
          </div>
          <div>
            <h4 className="text-xl display text-white tracking-widest uppercase">Связь_01</h4>
            <div className="flex items-center gap-3 mono text-[8px] text-neutral-600 uppercase tracking-[0.4em] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
              Канал Шифрования Активен
            </div>
          </div>
        </div>
        <div className="text-[9px] mono text-neutral-700 uppercase tracking-[0.3em] font-bold bg-[#050505] px-6 py-3 border border-white/5 italic">
          {messages.length} ПАКЕТОВ
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-grow p-12 space-y-12 overflow-y-auto custom-scrollbar bg-black"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex flex-col max-w-[80%] relative",
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {!isMe && (
                  <p className="text-[8px] mono text-neutral-700 uppercase tracking-[0.5em] mb-4 ml-2 font-bold italic">
                    {msg.senderName} &bull; УДАЛЕННЫЙ_УЗЕЛ
                  </p>
                )}
                <div className={cn(
                  "px-8 py-5 rounded-none text-sm leading-loose",
                  isMe 
                    ? "bg-white text-black font-bold uppercase tracking-widest display text-xs" 
                    : "bg-[#050505] border border-white/5 text-neutral-400 serif italic"
                )}>
                  {msg.text}
                </div>
                <div className={cn(
                  "flex items-center gap-4 mt-4 px-2 text-[8px] mono text-neutral-800 uppercase tracking-[0.4em] font-bold",
                  isMe && "flex-row-reverse"
                )}>
                  <span>{msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : '--:--'}</span>
                  <span className="opacity-20">&bull;</span>
                  <span className={cn(isMe ? "text-neutral-500" : "text-neutral-700")}>{isMe ? 'КУРАТОР' : 'УЧАСТНИК'}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-12 bg-black border-t border-white/5">
        <form onSubmit={handleSend} className="relative group">
          <input 
            type="text"
            placeholder="Передача потока данных..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="input-gothic w-full pl-10 pr-24 py-6"
          />
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-5 text-neutral-800 hover:text-white disabled:opacity-5 transition-all hover:scale-110 active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
        <div className="mt-8 flex items-center justify-center gap-10 opacity-10">
          <div className="h-[1px] flex-grow bg-white" />
          <p className="text-[8px] text-white mono uppercase tracking-[0.5em] font-bold italic">
            ЗАЩИЩЕННОЕ_ШИФРОВАНИЕ_АКТИВНО_V2
          </p>
          <div className="h-[1px] flex-grow bg-white" />
        </div>
      </div>
    </div>
  );
}
