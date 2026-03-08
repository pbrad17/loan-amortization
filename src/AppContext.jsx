import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { generateSchedule, getScheduleSummary } from './utils/amortization';

const AppContext = createContext();

const todayStr = new Date().toISOString().split('T')[0];

export const SCHEDULE_COLS = [
  { key: 'period', label: '#', align: 'left' },
  { key: 'paymentDate', label: 'Payment Date', align: 'left' },
  { key: 'beginningBalance', label: 'Beginning Balance', align: 'right' },
  { key: 'scheduledPayment', label: 'Regular Payment', align: 'right' },
  { key: 'extraPayment', label: 'Extra Payment', align: 'right' },
  { key: 'totalPayment', label: 'Total Payment', align: 'right' },
  { key: 'principalPortion', label: 'Principal', align: 'right' },
  { key: 'interestPortion', label: 'Interest', align: 'right' },
  { key: 'endingBalance', label: 'Ending Balance', align: 'right' },
];

const DEFAULT_COL_ORDER = SCHEDULE_COLS.map(c => c.key);

export function AppProvider({ children }) {
  const [loanInputs, setLoanInputs] = useState({
    loanBalance: 0,
    annualRate: 0,
    termYears: 30,
    frequency: 'monthly',
    startDate: todayStr,
    globalExtraPayment: 0,
  });

  const [extraPaymentOverrides, setExtraPaymentOverrides] = useState({});
  const [activeTab, setActiveTab] = useState('inputs');
  const [theme, setTheme] = useState(() => localStorage.getItem('amort-theme') || 'light');
  const [columnOrder, setColumnOrder] = useState(DEFAULT_COL_ORDER);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('amort-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const updateInput = useCallback((field, value) => {
    setLoanInputs(prev => ({ ...prev, [field]: value }));
  }, []);

  const setExtraOverride = useCallback((period, amount) => {
    setExtraPaymentOverrides(prev => {
      const next = { ...prev };
      next[period] = amount;
      return next;
    });
  }, []);

  const clearOverride = useCallback((period) => {
    setExtraPaymentOverrides(prev => {
      const next = { ...prev };
      delete next[period];
      return next;
    });
  }, []);

  const clearAllOverrides = useCallback(() => {
    setExtraPaymentOverrides({});
  }, []);

  const schedule = useMemo(
    () => generateSchedule(loanInputs, extraPaymentOverrides),
    [loanInputs, extraPaymentOverrides]
  );

  const summary = useMemo(
    () => getScheduleSummary(schedule, loanInputs),
    [schedule, loanInputs]
  );

  const loadSession = useCallback((data) => {
    if (data.loanInputs) setLoanInputs(data.loanInputs);
    if (data.extraPaymentOverrides) {
      const parsed = {};
      for (const [k, v] of Object.entries(data.extraPaymentOverrides)) {
        parsed[Number(k)] = v;
      }
      setExtraPaymentOverrides(parsed);
    }
  }, []);

  const value = {
    loanInputs, updateInput, setLoanInputs,
    extraPaymentOverrides, setExtraOverride, clearOverride, clearAllOverrides,
    schedule, summary,
    activeTab, setActiveTab,
    theme, toggleTheme,
    columnOrder, setColumnOrder,
    loadSession,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  return useContext(AppContext);
}
