'use client';

import { useState } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Goal } from '@/models/types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { differenceInMonths, format } from 'date-fns';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const GOAL_COLORS = ['#16a34a', '#2563eb', '#9333ea', '#f59e0b', '#ec4899', '#0891b2'];
const GOAL_ICONS = ['🏠', '🚗', '✈️', '📚', '💍', '🏖️', '🎓', '💰', '🏋️', '🐶', '👶', '🔧', '🎸', '🌱', '💊', '🎯'];

function ProgressRing({ percent, color, size = 80 }: { percent: number; color: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(percent / 100, 1));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={8}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
}

function GoalModal({ goal, onSave, onClose }: { goal?: Goal; onSave: (g: Goal) => void; onClose: () => void }) {
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(String(goal?.targetAmount ?? ''));
  const [current, setCurrent] = useState(String(goal?.currentAmount ?? '0'));
  const [deadline, setDeadline] = useState(goal?.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : '');
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0]);
  const [icon, setIcon] = useState(goal?.icon ?? '🎯');

  const handleSave = () => {
    if (!name || !target) return;
    onSave({
      id: goal?.id ?? uuidv4(),
      name,
      targetAmount: parseFloat(target),
      currentAmount: parseFloat(current) || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      color,
      icon,
      createdAt: goal?.createdAt ?? new Date(),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Goal Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency Fund"
          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Target Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0"
              className="w-full bg-white border border-gray-300 rounded-xl pl-7 pr-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Current Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0"
              className="w-full bg-white border border-gray-300 rounded-xl pl-7 pr-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Target Date (optional)</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Color</label>
        <div className="flex gap-2">
          {GOAL_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full border-2 transition-all"
              style={{ background: c, borderColor: c === color ? '#1f2937' : 'transparent' }} />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_ICONS.map((em) => (
            <button key={em} onClick={() => setIcon(em)}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${em === icon ? 'bg-green-100 ring-1 ring-green-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {em}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={!name || !target}
          className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
          {goal ? 'Update' : 'Create'} Goal
        </button>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const { goals, upsertGoal, removeGoal, isLoading } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | undefined>();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updateVal, setUpdateVal] = useState('');

  const activeGoals = goals.filter((g) => !g.completedAt);
  const completedGoals = goals.filter((g) => !!g.completedAt);

  const handleUpdateProgress = async (goal: Goal) => {
    const n = parseFloat(updateVal);
    if (isNaN(n)) return;
    const completed = n >= goal.targetAmount ? new Date() : undefined;
    await upsertGoal({ ...goal, currentAmount: n, completedAt: completed });
    setUpdatingId(null);
    setUpdateVal('');
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 text-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Goals</h1>
        <button onClick={() => { setEditing(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon="🎯" title="No goals yet" description="Set savings goals to stay motivated and track your progress."
          action={<button onClick={() => setModalOpen(true)} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">Create First Goal</button>} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map((goal, i) => {
              const percent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const monthsLeft = goal.deadline ? differenceInMonths(new Date(goal.deadline), new Date()) : null;
              const completed = goal.currentAmount >= goal.targetAmount;

              return (
                <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className={`bg-white border rounded-2xl p-5 shadow-sm relative overflow-hidden ${completed ? 'border-green-300' : 'border-gray-100'}`}>
                  {completed && (
                    <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-bl-xl font-medium">
                      ✓ Achieved!
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <ProgressRing percent={percent} color={goal.color} size={56} />
                        <span className="absolute inset-0 flex items-center justify-center text-lg">{goal.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{goal.name}</p>
                        <p className="text-xs text-gray-400">{percent.toFixed(0)}% funded</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(goal); setModalOpen(true); }} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-600 rounded transition-colors"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => removeGoal(goal.id)} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: goal.color }} className="font-bold">{fmt(goal.currentAmount)}</span>
                      <span className="text-gray-400">of {fmt(goal.targetAmount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: goal.color }}
                        initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }}
                        transition={{ duration: 0.8, delay: i * 0.07 }} />
                    </div>
                  </div>

                  {monthsLeft !== null && (
                    <p className="text-xs text-gray-400 mt-2">
                      {monthsLeft <= 0 ? '⚠️ Past deadline' : `${monthsLeft} month${monthsLeft !== 1 ? 's' : ''} to go`}
                      {goal.deadline && ` · ${format(new Date(goal.deadline), 'MMM yyyy')}`}
                    </p>
                  )}

                  {updatingId === goal.id ? (
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-gray-400 text-sm">$</span>
                      <input autoFocus type="number" value={updateVal} onChange={(e) => setUpdateVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateProgress(goal); if (e.key === 'Escape') setUpdatingId(null); }}
                        className="flex-1 bg-white border border-green-400 rounded-lg px-2 py-1 text-sm text-gray-900 focus:outline-none" />
                      <button onClick={() => handleUpdateProgress(goal)} className="text-green-600"><Check className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setUpdatingId(goal.id); setUpdateVal(String(goal.currentAmount)); }}
                      className="w-full mt-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                      Update Progress
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {completedGoals.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-semibold">Completed Goals</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center gap-3 opacity-60">
                    <span className="text-2xl">{goal.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-medium">{goal.name}</p>
                      <p className="text-xs text-gray-400">{fmt(goal.targetAmount)} · {goal.completedAt ? format(new Date(goal.completedAt), 'MMM yyyy') : ''}</p>
                    </div>
                    <button onClick={() => removeGoal(goal.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Goal' : 'New Goal'} width="max-w-lg">
        <GoalModal goal={editing}
          onSave={async (g) => { await upsertGoal(g); setModalOpen(false); }}
          onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
