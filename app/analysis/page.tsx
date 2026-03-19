'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const STEPS = [
  { key: 'parsing', label: 'Parsing transactions', icon: '📄' },
  { key: 'categorizing', label: 'AI categorization', icon: '🤖' },
  { key: 'analyzing', label: 'Analyzing patterns', icon: '🔍' },
  { key: 'generating-narrative', label: 'Writing your CFO report', icon: '✍️' },
  { key: 'done', label: 'Report ready!', icon: '🎉' },
];

interface Props {
  // passed via sessionStorage
}

export default function AnalysisPage() {
  const router = useRouter();

  useEffect(() => {
    // This page is just a loading screen - actual analysis happens on home page
    // and navigates here. If no progress data, go back.
    const hasData = sessionStorage.getItem('cfo-analyzing');
    if (!hasData) router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full mx-auto mb-6"
        />
        <p className="text-white text-lg font-semibold">Analyzing...</p>
      </div>
    </div>
  );
}
