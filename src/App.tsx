import React, { useState, useEffect } from 'react';
import { QueueProvider } from './context/QueueContext';
import { Navbar, ViewMode } from './components/Navbar';
import { TvDisplay } from './components/TvDisplay';
import { AttendantPanel } from './components/AttendantPanel';
import { KioskTotem } from './components/KioskTotem';
import { AdminMetrics } from './components/AdminMetrics';

const QueueApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('tv');

  // Keyboard shortcuts to easily switch between views on production terminals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1') setCurrentView('tv');
      if (e.key === '2') setCurrentView('attendant');
      if (e.key === '3') setCurrentView('kiosk');
      if (e.key === '4') setCurrentView('admin');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1">
        {currentView === 'tv' && <TvDisplay />}
        {currentView === 'attendant' && <AttendantPanel />}
        {currentView === 'kiosk' && <KioskTotem />}
        {currentView === 'admin' && <AdminMetrics />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <QueueProvider>
      <QueueApp />
    </QueueProvider>
  );
}
