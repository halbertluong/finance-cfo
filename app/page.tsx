'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CSVDropzone } from '@/components/upload/CSVDropzone';
import { ColumnMapper } from '@/components/upload/ColumnMapper';
import { useAnalysis } from '@/hooks/useAnalysis';
import { ParsedCSV, ColumnMapping } from '@/models/types';
import { TrendingUp, Sparkles, BarChart3, Trophy, ArrowRight, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

type Step = 'landing' | 'upload' | 'mapping' | 'options' | 'processing';

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('landing');

  const handleSignOut = async () => {
    await signOut(auth);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/sign-in');
  };
  const [csv, setCsv] = useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [netWorth, setNetWorth] = useState('');
  const [previousNetWorth, setPreviousNetWorth] = useState('');
  const { progress, report, error, runAnalysis } = useAnalysis();

  useEffect(() => {
    import('@/lib/db/api-client').then(({ hasAnyData }) =>
      hasAnyData().then((has) => { if (has) router.push('/dashboard'); })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCSVParsed = (parsed: ParsedCSV) => {
    setCsv(parsed);
    setStep('mapping');
  };

  const handleMappingConfirmed = (m: ColumnMapping) => {
    setMapping(m);
    setStep('options');
  };

  const handleStartAnalysis = async () => {
    if (!csv || !mapping) return;
    setStep('processing');
    await runAnalysis(csv.rows, mapping, {
      familyName: familyName || 'My Family',
      netWorth: netWorth ? parseFloat(netWorth.replace(/,/g, '')) : undefined,
      previousNetWorth: previousNetWorth ? parseFloat(previousNetWorth.replace(/,/g, '')) : undefined,
    });
  };

  useEffect(() => {
    if (report && step === 'processing') {
      router.push('/dashboard');
    }
  }, [report, step, router]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Sign Out */}
      <div className="fixed top-4 right-4 z-20">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI-Powered Family CFO Report
                </div>
                <h1 className="text-5xl font-black leading-tight">
                  Your Family&apos;s
                  <br />
                  <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                    Financial State
                  </span>
                  <br />
                  of the Union
                </h1>
                <p className="text-white/50 text-lg max-w-lg mx-auto">
                  Upload your bank CSV. Get a beautiful slide deck with AI-powered insights,
                  spending analysis, and a CFO score for your family.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <BarChart3 className="w-5 h-5" />, title: 'Macro & Micro Analysis', desc: 'Spending trends, net worth, savings rate' },
                  { icon: <Sparkles className="w-5 h-5" />, title: 'AI Categorization', desc: 'Claude identifies merchants & patterns' },
                  { icon: <TrendingUp className="w-5 h-5" />, title: 'Beautiful Slide Deck', desc: 'CFO-style presentation for your family' },
                  { icon: <Trophy className="w-5 h-5" />, title: 'Gamified Scoring', desc: 'CFO score, grades, and achievements' },
                ].map((f) => (
                  <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="text-violet-400 mb-2">{f.icon}</div>
                    <p className="text-white font-semibold text-sm">{f.title}</p>
                    <p className="text-white/40 text-xs mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="text-center space-y-3">
                <button
                  onClick={() => setStep('upload')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-8 py-4 rounded-2xl text-base transition-all duration-200 shadow-2xl shadow-violet-500/20"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-white/20 text-xs">Your data stays in your browser. Nothing is uploaded to a server.</p>
              </div>
            </motion.div>
          )}

          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-6"
            >
              <div>
                <button onClick={() => setStep('landing')} className="text-white/40 hover:text-white/70 text-sm mb-4 transition-colors">
                  ← Back
                </button>
                <h2 className="text-3xl font-bold">Upload Your CSV</h2>
                <p className="text-white/50 mt-2">
                  Export from Chase, Amex, Capital One, Mint, or any bank that supports CSV export.
                </p>
              </div>
              <CSVDropzone onParsed={handleCSVParsed} />
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
                <p className="text-xs text-white/40 uppercase tracking-wider">How to export your CSV</p>
                <ul className="text-sm text-white/60 space-y-1">
                  <li>• <strong className="text-white/80">Chase:</strong> Accounts → Activity → Download Account Activity</li>
                  <li>• <strong className="text-white/80">Amex:</strong> Account → Statements → Download</li>
                  <li>• <strong className="text-white/80">Mint:</strong> Transactions → Export</li>
                  <li>• <strong className="text-white/80">Any bank:</strong> Look for &quot;Export&quot; or &quot;Download&quot; on your transactions page</li>
                </ul>
              </div>
            </motion.div>
          )}

          {step === 'mapping' && csv && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-6"
            >
              <div>
                <button onClick={() => setStep('upload')} className="text-white/40 hover:text-white/70 text-sm mb-4 transition-colors">
                  ← Back
                </button>
                <h2 className="text-3xl font-bold">Map Your Columns</h2>
              </div>
              <ColumnMapper csv={csv} onMappingConfirmed={handleMappingConfirmed} />
            </motion.div>
          )}

          {step === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              className="space-y-6"
            >
              <div>
                <button onClick={() => setStep('mapping')} className="text-white/40 hover:text-white/70 text-sm mb-4 transition-colors">
                  ← Back
                </button>
                <h2 className="text-3xl font-bold">A Few Details</h2>
                <p className="text-white/50 mt-2">Optional but makes the presentation much more personal.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Family Name</label>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="e.g. Johnson"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Current Net Worth <span className="text-white/30">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={netWorth}
                      onChange={(e) => setNetWorth(e.target.value)}
                      placeholder="e.g. 250,000"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1.5">
                      Prior Period Net Worth <span className="text-white/30">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={previousNetWorth}
                      onChange={(e) => setPreviousNetWorth(e.target.value)}
                      placeholder="e.g. 220,000"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartAnalysis}
                className="w-full py-4 rounded-2xl font-semibold text-base bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-2xl shadow-violet-500/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Generate My CFO Report
              </button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-8 py-12"
            >
              <div className="w-20 h-20 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />

              <div>
                <p className="text-2xl font-bold text-white">{progress.message}</p>
                <p className="text-white/40 text-sm mt-2">{progress.percent}% complete</p>
              </div>

              <div className="max-w-sm mx-auto">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-red-300 text-sm max-w-sm mx-auto">
                  <p className="font-semibold mb-1">Something went wrong</p>
                  <p className="text-red-400/70">{error}</p>
                  <button
                    onClick={() => setStep('options')}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Go back and try again
                  </button>
                </div>
              )}

              <p className="text-white/20 text-xs">
                Claude is reading your transactions. This takes 15–60 seconds depending on volume.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
