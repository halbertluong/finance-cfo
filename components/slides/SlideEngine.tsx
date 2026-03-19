'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Grid3X3, Presentation } from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  component: ReactNode;
}

interface Props {
  slides: Slide[];
}

export function SlideEngine({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [mode, setMode] = useState<'present' | 'review'>('present');

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > current ? 1 : -1);
      setCurrent(Math.max(0, Math.min(slides.length - 1, index)));
    },
    [current, slides.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (mode !== 'present') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, mode]);

  if (mode === 'review') {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="sticky top-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-lg border-b border-white/10 px-6 py-3 flex items-center justify-between">
          <span className="text-white/60 text-sm">Review Mode — {slides.length} slides</span>
          <button
            onClick={() => setMode('present')}
            className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Presentation className="w-4 h-4" />
            Present Mode
          </button>
        </div>
        <div className="max-w-4xl mx-auto py-8 px-6 space-y-8">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              onClick={() => { setCurrent(i); setMode('present'); }}
              className="rounded-2xl overflow-hidden border border-white/10 cursor-pointer hover:border-violet-500/50 transition-all duration-200 aspect-video"
            >
              <div className="w-full h-full scale-[0.5] origin-top-left" style={{ width: '200%', height: '200%' }}>
                {slide.component}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] overflow-hidden">
      {/* Slide content */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {slides[current].component}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="absolute bottom-6 inset-x-0 flex items-center justify-center gap-4 z-50">
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Dot nav */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-violet-400' : 'w-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === slides.length - 1}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Top controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setMode('review')}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2"
        >
          <Grid3X3 className="w-3.5 h-3.5" />
          Review
        </button>
      </div>

      {/* Slide counter */}
      <div className="absolute top-4 left-4 z-50 text-xs text-white/30">
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}
