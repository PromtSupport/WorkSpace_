import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CalendarEvent } from '../types';
import { Plus, Trash2, Calendar as CalIcon, MapPin, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday, isTomorrow, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    location: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'calendar'), orderBy('start', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
      setEvents(docs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'calendar'));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'calendar'), {
        ...newEvent,
        start: new Date(newEvent.start),
        end: new Date(newEvent.end),
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewEvent({ title: '', description: '', start: '', end: '', location: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'calendar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'calendar', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `calendar/${id}`);
    }
  };

  const groupedEvents = events.reduce((acc: Record<string, CalendarEvent[]>, event) => {
    const date = format(event.start.toDate(), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-12 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[10px] mono text-neutral-500 uppercase tracking-[0.5em] mb-3 font-bold flex items-center gap-3">
            <Clock className="w-3 h-3 text-white opacity-40" />
            V-04: Темпоральный_Лог
          </h2>
          <p className="text-4xl display text-white tracking-widest uppercase">График</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-gothic"
        >
          <Plus className="w-4 h-4" />
          Внести Сессию
        </button>
      </div>

      <div className="space-y-20">
        {Object.entries(groupedEvents).map(([date, dayEvents]: [string, any]) => (
          <div key={date} className="relative">
            <div className="flex items-center gap-12 mb-12">
              <div className="text-7xl font-light tracking-tighter tabular-nums text-white serif italic opacity-80">
                {format(new Date(date), 'dd')}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] mono text-neutral-500 uppercase tracking-[0.5em] font-bold">
                  {format(new Date(date), 'MMMM yyyy', { locale: ru })}
                </p>
                <p className="text-xs font-bold text-white uppercase tracking-[0.3em] italic">
                  {isToday(new Date(date)) ? 'Сегодня' : isTomorrow(new Date(date)) ? 'Следующий цикл' : format(new Date(date), 'EEEE', { locale: ru })}
                </p>
              </div>
              <div className="flex-grow h-[1px] bg-white/5" />
            </div>

            <div className="space-y-10 pl-16 border-l border-white/5 mx-6">
              {dayEvents.map((event: any) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="command-panel group p-10 rounded-none flex items-start justify-between border-white/5 bg-black"
                >
                  <div className="flex gap-12">
                    <div className="text-right min-w-[100px] pt-2">
                      <p className="text-sm font-bold text-white mono tracking-tighter italic">{format(event.start.toDate(), 'HH:mm', { locale: ru })}</p>
                      <p className="text-[10px] text-neutral-700 mono font-bold">{format(event.end.toDate(), 'HH:mm', { locale: ru })}</p>
                    </div>
                    <div className="space-y-6">
                      <h4 className="text-2xl display tracking-widest text-white uppercase">{event.title}</h4>
                      {event.description && <p className="text-xs text-neutral-500 leading-loose max-w-2xl serif italic">{event.description}</p>}
                      {event.location && (
                        <div className="flex items-center gap-4 text-[9px] text-neutral-600 mono uppercase tracking-[0.3em] font-bold">
                          <MapPin className="w-4 h-4 text-neutral-800" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(event.id!)}
                    className="p-4 text-neutral-900 hover:text-red-950 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {events.length === 0 && !loading && (
          <div className="py-40 text-center command-panel rounded-none border-dashed border-white/5 bg-transparent">
            <p className="text-neutral-800 text-[10px] mono uppercase tracking-[0.6em] font-bold italic">Мировой_Архив_Пуст: Сессии не активны</p>
          </div>
        )}
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
              className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            />
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="command-panel max-w-2xl w-full p-16 rounded-none z-10 shadow-2xl border-white/10"
            >
              <h3 className="text-3xl display mb-12 text-white tracking-widest uppercase">Лог_События</h3>
              <form onSubmit={handleAdd} className="space-y-8">
                <div>
                  <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-4 font-bold">Идентификатор_Сессии</label>
                  <input 
                    required
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="input-gothic w-full"
                    placeholder="Напр. СИСТЕМНАЯ_ПРОВЕРКА"
                  />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-4 font-bold">Начало</label>
                    <input 
                      required
                      type="datetime-local"
                      value={newEvent.start}
                      onChange={(e) => setNewEvent({...newEvent, start: e.target.value})}
                      className="input-gothic w-full color-invert"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-4 font-bold">Конец</label>
                    <input 
                      required
                      type="datetime-local"
                      value={newEvent.end}
                      onChange={(e) => setNewEvent({...newEvent, end: e.target.value})}
                      className="input-gothic w-full color-invert"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-4 font-bold">Узел_Связи / Локация</label>
                  <input 
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                    className="input-gothic w-full"
                    placeholder="Физический или Цифровой UID"
                  />
                </div>
                <div>
                  <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-4 font-bold">Метаданные / Операции</label>
                  <textarea 
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="input-gothic w-full h-40 resize-none"
                    placeholder="..."
                  />
                </div>
                <div className="flex gap-8 pt-8">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-grow py-5 border border-white/5 text-[9px] font-bold mono uppercase tracking-widest rounded-none hover:bg-white/5 transition-all text-neutral-600"
                  >
                    Отмена
                  </button>
                  <button 
                    type="submit"
                    className="btn-gothic flex-grow"
                  >
                    Подтвердить_Выполнение
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
