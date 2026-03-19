import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppDataProvider } from '@/context/AppDataContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AppDataProvider>
  );
}
