import { useState } from 'react';
import { useAppContext } from '../AppContext';
import { formatCurrency, formatDate } from '../utils/formatting';

function NumericInput({ label, value, onChange, prefix, min = 0 }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');

  const handleFocus = () => {
    setEditing(true);
    setRaw(value ? String(value) : '');
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseFloat(raw.replace(/,/g, ''));
    onChange(isNaN(parsed) || parsed < min ? min : parsed);
  };

  const display = editing ? raw : (value ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) : '0.00');

  return (
    <div>
      <label className="block text-sm text-steel-blue mb-1">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-primary/50 text-sm">{prefix}</span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={display}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => setRaw(e.target.value)}
          className={`w-full bg-dark-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none ${prefix ? 'pl-7' : ''}`}
        />
      </div>
    </div>
  );
}

export default function InputsPanel() {
  const { loanInputs, updateInput, summary, extraPaymentOverrides, clearAllOverrides } = useAppContext();
  const hasOverrides = Object.keys(extraPaymentOverrides).length > 0;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-accent mb-4">Loan Parameters</h2>

      <div className="bg-dark-bg rounded-lg p-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumericInput
            label="Loan Balance"
            value={loanInputs.loanBalance}
            onChange={(v) => updateInput('loanBalance', v)}
            prefix="$"
          />

          <div>
            <label className="block text-sm text-steel-blue mb-1">Annual Interest Rate (%)</label>
            <input
              type="number"
              step="0.001"
              min="0"
              max="100"
              value={loanInputs.annualRate || ''}
              onChange={(e) => updateInput('annualRate', parseFloat(e.target.value) || 0)}
              className="w-full bg-dark-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
              placeholder="e.g. 6.5"
            />
          </div>

          <div>
            <label className="block text-sm text-steel-blue mb-1">Term (Years)</label>
            <input
              type="number"
              step="1"
              min="1"
              max="50"
              value={loanInputs.termYears || ''}
              onChange={(e) => updateInput('termYears', parseInt(e.target.value) || 1)}
              className="w-full bg-dark-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-steel-blue mb-1">Payment Frequency</label>
            <select
              value={loanInputs.frequency}
              onChange={(e) => updateInput('frequency', e.target.value)}
              className="w-full bg-dark-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="yearly">Yearly</option>
              <option value="quarterly">Quarterly</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-steel-blue mb-1">Loan Start Date</label>
            <input
              type="date"
              value={loanInputs.startDate}
              onChange={(e) => updateInput('startDate', e.target.value)}
              className="w-full bg-dark-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-steel-blue mb-1">First Payment Date</label>
            <input
              type="date"
              value={loanInputs.firstPaymentDate}
              onChange={(e) => updateInput('firstPaymentDate', e.target.value)}
              className="w-full bg-dark-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <NumericInput
            label="Global Extra Payment"
            value={loanInputs.globalExtraPayment}
            onChange={(v) => updateInput('globalExtraPayment', v)}
            prefix="$"
          />
        </div>

        {hasOverrides && (
          <button
            onClick={clearAllOverrides}
            className="mt-4 px-4 py-2 bg-negative/20 border border-negative text-negative text-sm rounded hover:bg-negative/30 transition-colors"
          >
            Clear All Extra Payment Overrides ({Object.keys(extraPaymentOverrides).length})
          </button>
        )}
      </div>

      {/* Quick Summary */}
      {summary.scheduledPayment > 0 && (
        <div className="mt-6 bg-section-bg rounded-lg p-4 border border-border">
          <h3 className="text-sm font-bold text-accent mb-3">Quick Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-steel-blue">Standard Payment:</span>
              <span className="ml-2 font-medium">{formatCurrency(summary.scheduledPayment)}</span>
            </div>
            <div>
              <span className="text-steel-blue">Total Payments:</span>
              <span className="ml-2 font-medium">{summary.numberOfPayments}</span>
            </div>
            <div>
              <span className="text-steel-blue">Payoff Date:</span>
              <span className="ml-2 font-medium">{formatDate(summary.payoffDate)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
