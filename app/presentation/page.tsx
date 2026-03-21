'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SlideEngine } from '@/components/slides/SlideEngine';
import { TitleSlide } from '@/components/slides/slides/TitleSlide';
import { ExecutiveSummarySlide } from '@/components/slides/slides/ExecutiveSummarySlide';
import { SpendingBreakdownSlide } from '@/components/slides/slides/SpendingBreakdownSlide';
import { MonthlyTrendsSlide } from '@/components/slides/slides/MonthlyTrendsSlide';
import { TopMerchantsSlide } from '@/components/slides/slides/TopMerchantsSlide';
import { CategoryReportCardsSlide } from '@/components/slides/slides/CategoryReportCardsSlide';
import { HabitsSlide } from '@/components/slides/slides/HabitsSlide';
import { CFOScoreSlide } from '@/components/slides/slides/CFOScoreSlide';
import { AchievementsSlide } from '@/components/slides/slides/AchievementsSlide';
import { SignOffSlide } from '@/components/slides/slides/SignOffSlide';
import { AnalysisReport } from '@/models/types';
import { loadLatestReport } from '@/lib/db/api-client';

export default function PresentationPage() {
  const router = useRouter();
  const [report, setReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    loadLatestReport().then((r) => {
      if (!r) { router.push('/'); return; }
      setReport(r);
    }).catch(() => router.push('/'));
  }, [router]);

  if (!report) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const slides = [
    { id: 'title', title: 'Cover', component: <TitleSlide report={report} /> },
    { id: 'exec', title: 'Executive Summary', component: <ExecutiveSummarySlide report={report} /> },
    { id: 'spending', title: 'Spending Breakdown', component: <SpendingBreakdownSlide report={report} /> },
    { id: 'monthly', title: 'Monthly Trends', component: <MonthlyTrendsSlide report={report} /> },
    { id: 'merchants', title: 'Top Merchants', component: <TopMerchantsSlide report={report} /> },
    { id: 'report-cards', title: 'Category Report Cards', component: <CategoryReportCardsSlide report={report} /> },
    { id: 'good-habits', title: 'Good Habits', component: <HabitsSlide report={report} type="good" /> },
    { id: 'bad-habits', title: 'Habits to Watch', component: <HabitsSlide report={report} type="bad" /> },
    { id: 'score', title: 'CFO Score', component: <CFOScoreSlide report={report} /> },
    { id: 'achievements', title: 'Achievements', component: <AchievementsSlide report={report} /> },
    { id: 'signoff', title: 'Sign Off', component: <SignOffSlide report={report} /> },
  ];

  return <SlideEngine slides={slides} />;
}
