import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatting';

function ExtraPaymentCell({ period, value, isOverridden, globalExtra }) {
  const { setExtraOverride, clearOverride } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');

  const handleClick = () => {
    setEditing(true);
    setRaw(String(value));
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseFloat(raw.replace(/,/g, ''));
    if (isNaN(parsed) || parsed < 0) {
      clearOverride(period);
      return;
    }
    if (parsed === globalExtra) {
      clearOverride(period);
    } else {
      setExtraOverride(period, parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-20 bg-dark-bg border border-accent rounded px-1 py-0.5 text-xs text-text-primary focus:outline-none text-right"
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className={`cursor-pointer hover:underline inline-flex items-center gap-1 ${isOverridden ? 'text-accent font-medium' : ''}`}
    >
      {formatCurrency(value)}
      {isOverridden && (
        <button
          onClick={(e) => { e.stopPropagation(); clearOverride(period); }}
          className="text-negative hover:text-negative/80 text-xs leading-none"
          title="Reset to global default"
        >
          x
        </button>
      )}
    </span>
  );
}

export default function SchedulePanel() {
  const { loanInputs, schedule, summary } = useAppContext();

  if (!schedule.length) {
    return (
      <div className="text-steel-blue">
        Enter loan parameters on the Inputs tab to generate a schedule.
      </div>
    );
  }

  return (
    <div>
      {/* Summary Card */}
      <div className="bg-section-bg rounded-lg p-4 border border-border mb-6">
        <h3 className="text-sm font-bold text-accent mb-3">Loan Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-steel-blue block">Balance</span>
            <span className="font-medium">{formatCurrency(loanInputs.loanBalance)}</span>
          </div>
          <div>
            <span className="text-steel-blue block">Rate</span>
            <span className="font-medium">{formatPercent(loanInputs.annualRate)}</span>
          </div>
          <div>
            <span className="text-steel-blue block">Term</span>
            <span className="font-medium">{loanInputs.termYears} years ({loanInputs.frequency})</span>
          </div>
          <div>
            <span className="text-steel-blue block">Standard Payment</span>
            <span className="font-medium">{formatCurrency(summary.scheduledPayment)}</span>
          </div>
          <div>
            <span className="text-steel-blue block">Total Interest</span>
            <span className="font-medium">{formatCurrency(summary.totalInterest)}</span>
          </div>
          <div>
            <span className="text-steel-blue block">Total Payments</span>
            <span className="font-medium">{formatCurrency(summary.totalPayments)}</span>
          </div>
          <div>
            <span className="text-steel-blue block">Payoff Date</span>
            <span className="font-medium">{formatDate(summary.payoffDate)}</span>
          </div>
          <div>
            <span className="text-steel-blue block"># of Payments</span>
            <span className="font-medium">{summary.numberOfPayments}</span>
          </div>
        </div>
        {(summary.paymentsSaved > 0 || summary.interestSaved > 0) && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-positive block">Payments Saved</span>
              <span className="font-medium text-positive">{summary.paymentsSaved}</span>
            </div>
            <div>
              <span className="text-positive block">Interest Saved</span>
              <span className="font-medium text-positive">{formatCurrency(summary.interestSaved)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Amortization Table */}
      <div className="bg-dark-bg rounded-lg border border-border overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-header-bg text-text-primary">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Payment Date</th>
                <th className="px-3 py-2 text-right">Beginning Balance</th>
                <th className="px-3 py-2 text-right">Total Payment</th>
                <th className="px-3 py-2 text-right">Principal</th>
                <th className="px-3 py-2 text-right">Interest</th>
                <th className="px-3 py-2 text-right">Extra Payment</th>
                <th className="px-3 py-2 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, i) => (
                <tr key={row.period} className={i % 2 === 0 ? 'bg-dark-bg' : 'bg-alt-bg'}>
                  <td className="px-3 py-1.5 text-steel-blue">{row.period}</td>
                  <td className="px-3 py-1.5">{formatDate(row.paymentDate)}</td>
                  <td className="px-3 py-1.5 text-right">{formatCurrency(row.beginningBalance)}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(row.totalPayment)}</td>
                  <td className="px-3 py-1.5 text-right">{formatCurrency(row.principalPortion)}</td>
                  <td className="px-3 py-1.5 text-right">{formatCurrency(row.interestPortion)}</td>
                  <td className="px-3 py-1.5 text-right">
                    <ExtraPaymentCell
                      period={row.period}
                      value={row.extraPayment}
                      isOverridden={row.isOverridden}
                      globalExtra={loanInputs.globalExtraPayment || 0}
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right">{formatCurrency(row.endingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
