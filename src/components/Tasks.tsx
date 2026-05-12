import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Task, TaskStatus, Importance } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, Clock, User, MoreHorizontal, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../App';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    importance: 'medium' as Importance,
    deadline: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(docs);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tasks'));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'tasks'), {
        ...newTask,
        status: 'todo',
        creatorId: user.uid,
        creatorName: user.displayName,
        createdAt: serverTimestamp(),
        deadline: newTask.deadline ? new Date(newTask.deadline) : null
      });
      setIsAdding(false);
      setNewTask({ title: '', description: '', importance: 'medium', deadline: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const toggleStatus = async (task: Task) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      'todo': 'in_progress',
      'in_progress': 'completed',
      'completed': 'todo'
    };
    try {
      await updateDoc(doc(db, 'tasks', task.id!), {
        status: nextStatus[task.status]
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);

  return (
    <div className="space-y-8 md:space-y-12 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-0">
        <div>
          <h2 className="text-[10px] mono text-neutral-500 uppercase tracking-[0.3em] md:tracking-[0.5em] mb-3 font-bold flex items-center gap-3">
            <CheckCircle2 className="w-3 h-3 text-white opacity-40" />
            V-03: Манифест_Задач
          </h2>
          <p className="text-3xl md:text-4xl display text-white tracking-widest uppercase">Задачи</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="btn-gothic w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Внести Задачу
        </button>
      </div>

      <div className="flex gap-12 border-b border-white/5 pb-4 overflow-x-auto custom-scrollbar whitespace-nowrap">
        {(['all', 'todo', 'in_progress', 'completed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-4 py-4 text-[9px] mono uppercase tracking-[0.4em] transition-all relative font-bold",
              filter === s ? "text-white" : "text-neutral-700 hover:text-neutral-400"
            )}
          >
            {s === 'all' ? 'ВЕСЬ_ЛОГ' : 
             s === 'todo' ? 'К_ИСПОЛНЕНИЮ' :
             s === 'in_progress' ? 'В_РАБОТЕ' : 'ЗАВЕРШЕНО'}
            {filter === s && (
              <motion.div layoutId="filter-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="command-panel group p-6 md:p-10 rounded-none flex items-start md:items-center gap-4 md:gap-10 border-white/5 bg-black"
            >
              <button 
                onClick={() => toggleStatus(task)}
                className="flex-shrink-0 transition-all hover:scale-110 active:scale-95 pt-1 md:pt-0"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-white opacity-40" />
                ) : task.status === 'in_progress' ? (
                  <Clock className="w-8 h-8 md:w-10 md:h-10 text-white animate-pulse" />
                ) : (
                  <Circle className="w-8 h-8 md:w-10 md:h-10 text-neutral-900 border border-white/10 hover:border-white/40 transition-colors" />
                )}
              </button>

              <div className="flex-grow min-w-0">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mb-4">
                  <h4 className={cn(
                    "text-lg md:text-xl display truncate tracking-widest transition-all",
                    task.status === 'completed' ? "opacity-20 line-through italic" : "text-white"
                  )}>
                    {task.title}
                  </h4>
                  <span className={cn(
                    "text-[7px] md:text-[8px] mono uppercase tracking-[0.3em] md:tracking-[0.4em] px-3 py-1 rounded-none border font-bold italic w-fit",
                    task.importance === 'high' ? "text-white bg-white/5 border-white/20" :
                    task.importance === 'medium' ? "text-neutral-500 border-neutral-800" :
                    "text-neutral-700 border-neutral-900"
                  )}>
                    {task.importance === 'high' ? 'КРИТИЧЕСКИ' : task.importance === 'medium' ? 'СТАНДАРТ' : 'НИЗКИЙ'}_ПРИОРИТЕТ
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 text-[8px] text-neutral-600 mono uppercase tracking-[0.3em] font-bold">
                  <div className="flex items-center gap-3">
                    <User className="w-3.5 h-3.5 md:w-4 h-4 text-neutral-800" />
                    {task.creatorId === user?.uid ? 'ВЫ' : (task as any).creatorName === 'Саша' ? 'САША' : (task as any).creatorName === 'Ася' ? 'АСЯ' : 'ВНЕШНИЙ'}
                  </div>
                  {task.deadline && (
                    <div className="flex items-center gap-3 font-bold italic">
                      <Calendar className="w-3.5 h-3.5 md:w-4 h-4 text-neutral-800" />
                      СРОК: {format(task.deadline.toDate(), 'yyyy.MM.dd', { locale: ru })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDelete(task.id!)}
                  className="p-2 md:p-4 text-neutral-900 hover:text-red-950 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredTasks.length === 0 && !loading && (
          <div className="py-40 text-center command-panel rounded-none border-dashed border-white/5 bg-transparent">
            <p className="text-neutral-800 text-[10px] mono uppercase tracking-[0.6em] font-bold italic">Пустота: Записей не обнаружено</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
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
              <h3 className="text-2xl md:text-3xl display mb-8 md:mb-12 text-white tracking-widest uppercase">Инициация_Задачи</h3>
              <form onSubmit={handleAdd} className="space-y-6 md:space-y-8 text-left">
                <div>
                  <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Заголовок_Задачи</label>
                  <input 
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="input-gothic w-full"
                    placeholder="Краткое описание..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div>
                    <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Приоритет</label>
                    <div className="relative">
                      <select 
                        value={newTask.importance}
                        onChange={(e) => setNewTask({...newTask, importance: e.target.value as Importance})}
                        className="input-gothic w-full appearance-none cursor-pointer"
                      >
                        <option value="low">Низкий</option>
                        <option value="medium">Стандарт</option>
                        <option value="high">Критический</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-700">
                        <MoreHorizontal className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Крайний_Срок</label>
                    <input 
                      type="date"
                      value={newTask.deadline}
                      onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                      className="input-gothic w-full color-invert"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] mono text-neutral-600 uppercase tracking-widest mb-3 md:mb-4 font-bold">Опер_Блок_Данных</label>
                  <textarea 
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
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
                    Развернуть_Протокол
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
