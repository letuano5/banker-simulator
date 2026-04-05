import { TabNav } from './TabNav';
import { ThemeToggle } from './ThemeToggle';
import { Cpu } from 'lucide-react';

type Tab = 'banker' | 'deadlock';

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: React.ReactNode;
}

export function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Cpu size={18} />
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm hidden sm:block">
              OS Simulator
            </span>
          </div>
          <TabNav activeTab={activeTab} onTabChange={onTabChange} />
          <ThemeToggle />
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
