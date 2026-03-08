import { useState, useRef } from 'react';
import { useAppContext, SCHEDULE_COLS } from '../AppContext';
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

function formatCell(key, row) {
  if (key === 'period') return String(row.period);
  if (key === 'paymentDate') return formatDate(row.paymentDate);
  return formatCurrency(row[key]);
}

export default function SchedulePanel() {
  const { loanInputs, schedule, summary, columnOrder, setColumnOrder } = useAppContext();
  const dragCol = useRef(null);
  const dragOverCol = useRef(null);

  const orderedCols = columnOrder
    .map(key => SCHEDULE_COLS.find(c => c.key === key))
    .filter(Boolean);

  const handleDragStart = (key) => {
    dragCol.current = key;
  };

  const handleDragOver = (e, key) => {
    e.preventDefault();
    dragOverCol.current = key;
  };

  const handleDrop = () => {
    if (!dragCol.current || !dragOverCol.current || dragCol.current === dragOverCol.current) return;
    const newOrder = [...columnOrder];
    const fromIdx = newOrder.indexOf(dragCol.current);
    const toIdx = newOrder.indexOf(dragOverCol.current);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragCol.current);
    setColumnOrder(newOrder);
    dragCol.current = null;
    dragOverCol.current = null;
  };

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

      <p className="text-xs text-steel-blue mb-2">Drag column headers to reorder.</p>

      {/* Amortization Table */}
      <div className="bg-dark-bg rounded-lg border border-border overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-header-bg text-text-primary">
                {orderedCols.map(col => (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={() => handleDragStart(col.key)}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDrop={handleDrop}
                    className={`px-3 py-2 text-${col.align} cursor-grab active:cursor-grabbing select-none`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, i) => (
                <tr key={row.period} className={i % 2 === 0 ? 'bg-dark-bg' : 'bg-alt-bg'}>
                  {orderedCols.map(col => (
                    <td
                      key={col.key}
                      className={`px-3 py-1.5 text-${col.align}${col.key === 'period' ? ' text-steel-blue' : ''}${col.key === 'totalPayment' ? ' font-medium' : ''}`}
                    >
                      {col.key === 'extraPayment' ? (
                        <ExtraPaymentCell
                          period={row.period}
                          value={row.extraPayment}
                          isOverridden={row.isOverridden}
                          globalExtra={loanInputs.globalExtraPayment || 0}
                        />
                      ) : (
                        formatCell(col.key, row)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
