import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppDataProvider } from '@/context/AppDataContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          {children}
        </main>
      </div>
    </AppDataProvider>
  );
}
