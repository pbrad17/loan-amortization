import { AppProvider, useAppContext } from './AppContext';
import InputsPanel from './components/InputsPanel';
import SchedulePanel from './components/SchedulePanel';
import PdfPanel from './components/PdfPanel';
import SessionControls from './components/SessionControls';

const TABS = [
  { id: 'inputs', label: 'Inputs' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'pdf', label: 'PDF Report' },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useAppContext();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-dark-bg/50 border border-border hover:border-accent transition-colors"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

function AppContent() {
  const { activeTab, setActiveTab } = useAppContext();

  return (
    <div className="min-h-screen bg-title-bg text-text-primary">
      {/* Header */}
      <div className="bg-section-bg border-b-2 border-accent px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="7" y1="13" x2="7" y2="13.01"/><line x1="12" y1="13" x2="12" y2="13.01"/><line x1="17" y1="13" x2="17" y2="13.01"/><line x1="7" y1="17" x2="7" y2="17.01"/><line x1="12" y1="17" x2="12" y2="17.01"/>
            </svg>
            <h1 className="text-2xl font-bold tracking-wide">Loan Amortization Calculator</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://planning-tool-belt.vercel.app"
              className="p-2 rounded-lg bg-dark-bg/50 border border-border hover:border-accent transition-colors"
              title="Back to Tool Belt"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </a>
            <SessionControls />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-dark-bg border-b border-border flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-header-bg text-accent border-b-2 border-accent'
                : 'text-text-primary/70 hover:text-text-primary hover:bg-alt-bg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'inputs' && <InputsPanel />}
        {activeTab === 'schedule' && <SchedulePanel />}
        {activeTab === 'pdf' && <PdfPanel />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
