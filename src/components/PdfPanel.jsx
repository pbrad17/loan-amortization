import { useState, useCallback } from 'react';
import {
  Document, Page, Text, View, StyleSheet, pdf,
} from '@react-pdf/renderer';
import { useAppContext } from '../AppContext';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatting';

const PALETTES = {
  dark: {
    titleBg: '#1A2E3D', darkBg: '#1E3242', altBg: '#243A4A',
    sectionBg: '#2A4F65', headerBg: '#345B72', accent: '#F5A623',
    steelBlue: '#5B8FA8', text: '#FFFFFF', border: '#3D6B8E',
    positive: '#9BB55E', negative: '#E88D4F',
  },
  light: {
    titleBg: '#F0F4F8', darkBg: '#FFFFFF', altBg: '#E8EDF2',
    sectionBg: '#D0DAE4', headerBg: '#B8C8D8', accent: '#D4890A',
    steelBlue: '#4A7A94', text: '#1A2E3D', border: '#B0C4D8',
    positive: '#6B8F2E', negative: '#C5652A',
  },
};

function makeStyles(c) {
  return StyleSheet.create({
    page: { backgroundColor: c.titleBg, padding: 30, fontFamily: 'Helvetica', color: c.text },
    header: { backgroundColor: c.sectionBg, padding: 12, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: c.accent },
    title: { fontSize: 16, fontWeight: 'bold', color: c.text },
    subtitle: { fontSize: 9, color: c.steelBlue, marginTop: 3 },
    sectionTitle: { fontSize: 11, fontWeight: 'bold', color: c.steelBlue, backgroundColor: c.sectionBg, padding: 5, marginTop: 8, borderLeftWidth: 2, borderLeftColor: c.steelBlue },
    tableHeader: { flexDirection: 'row', backgroundColor: c.headerBg, paddingVertical: 4, paddingHorizontal: 4 },
    th: { fontSize: 7, fontWeight: 'bold', color: c.text },
    row: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: c.border },
    rowAlt: { backgroundColor: c.altBg },
    rowEven: { backgroundColor: c.darkBg },
    totalRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, borderTopWidth: 1.5, borderTopColor: c.accent, backgroundColor: c.darkBg },
    cell: { fontSize: 7, color: c.text },
    cellAccent: { fontSize: 7, color: c.accent, fontWeight: 'bold' },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    summaryItem: { width: '25%', paddingVertical: 4, paddingHorizontal: 6 },
    summaryLabel: { fontSize: 7, color: c.steelBlue },
    summaryValue: { fontSize: 9, fontWeight: 'bold', color: c.text },
  });
}

const stylesCache = {
  dark: makeStyles(PALETTES.dark),
  light: makeStyles(PALETTES.light),
};

const COLS = [
  { key: 'period', label: '#', width: '5%', align: 'left' },
  { key: 'paymentDate', label: 'Date', width: '13%', align: 'left' },
  { key: 'beginningBalance', label: 'Beg. Balance', width: '14%', align: 'right' },
  { key: 'totalPayment', label: 'Total Payment', width: '14%', align: 'right' },
  { key: 'principalPortion', label: 'Principal', width: '14%', align: 'right' },
  { key: 'interestPortion', label: 'Interest', width: '14%', align: 'right' },
  { key: 'extraPayment', label: 'Extra', width: '12%', align: 'right' },
  { key: 'endingBalance', label: 'End. Balance', width: '14%', align: 'right' },
];

const ROWS_PER_PAGE = 40;

function AmortizationDoc({ loanInputs, schedule, summary, theme }) {
  const s = stylesCache[theme] || stylesCache.light;

  const pages = [];
  for (let i = 0; i < schedule.length; i += ROWS_PER_PAGE) {
    pages.push(schedule.slice(i, i + ROWS_PER_PAGE));
  }

  const formatVal = (key, row) => {
    if (key === 'period') return String(row.period);
    if (key === 'paymentDate') return formatDate(row.paymentDate);
    return formatCurrency(row[key]);
  };

  return (
    <Document>
      {/* Summary Page */}
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Loan Amortization Report</Text>
          <Text style={s.subtitle}>
            {formatCurrency(loanInputs.loanBalance)} at {formatPercent(loanInputs.annualRate)} for {loanInputs.termYears} years ({loanInputs.frequency})
          </Text>
        </View>

        <View style={s.summaryGrid}>
          {[
            ['Loan Balance', formatCurrency(loanInputs.loanBalance)],
            ['Annual Rate', formatPercent(loanInputs.annualRate)],
            ['Term', `${loanInputs.termYears} years`],
            ['Frequency', loanInputs.frequency],
            ['Standard Payment', formatCurrency(summary.scheduledPayment)],
            ['Total Interest', formatCurrency(summary.totalInterest)],
            ['Total Payments', formatCurrency(summary.totalPayments)],
            ['Payoff Date', formatDate(summary.payoffDate)],
            ['# of Payments', String(summary.numberOfPayments)],
            ...(summary.paymentsSaved > 0 ? [['Payments Saved', String(summary.paymentsSaved)]] : []),
            ...(summary.interestSaved > 0 ? [['Interest Saved', formatCurrency(summary.interestSaved)]] : []),
          ].map(([label, value]) => (
            <View key={label} style={s.summaryItem}>
              <Text style={s.summaryLabel}>{label}</Text>
              <Text style={s.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>Amortization Schedule</Text>

        {/* First chunk of rows on summary page */}
        <View style={s.tableHeader}>
          {COLS.map(col => (
            <Text key={col.key} style={[s.th, { width: col.width, textAlign: col.align }]}>{col.label}</Text>
          ))}
        </View>
        {(pages[0] || []).map((row, i) => (
          <View key={row.period} style={[s.row, i % 2 === 0 ? s.rowEven : s.rowAlt]}>
            {COLS.map(col => (
              <Text key={col.key} style={[s.cell, { width: col.width, textAlign: col.align }]}>
                {formatVal(col.key, row)}
              </Text>
            ))}
          </View>
        ))}
      </Page>

      {/* Continuation pages */}
      {pages.slice(1).map((chunk, pageIdx) => (
        <Page key={pageIdx + 1} size="LETTER" style={s.page}>
          <View style={s.tableHeader}>
            {COLS.map(col => (
              <Text key={col.key} style={[s.th, { width: col.width, textAlign: col.align }]}>{col.label}</Text>
            ))}
          </View>
          {chunk.map((row, i) => (
            <View key={row.period} style={[s.row, i % 2 === 0 ? s.rowEven : s.rowAlt]}>
              {COLS.map(col => (
                <Text key={col.key} style={[s.cell, { width: col.width, textAlign: col.align }]}>
                  {formatVal(col.key, row)}
                </Text>
              ))}
            </View>
          ))}
        </Page>
      ))}
    </Document>
  );
}

export default function PdfPanel() {
  const { loanInputs, schedule, summary, theme } = useAppContext();
  const [generating, setGenerating] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const fileName = `Loan_Amortization_Report_${today}.pdf`;

  const handleGenerate = useCallback(async () => {
    if (!schedule.length) return;
    setGenerating(true);
    try {
      const blob = await pdf(
        <AmortizationDoc
          loanInputs={loanInputs}
          schedule={schedule}
          summary={summary}
          theme={theme}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF generation failed:', e);
    }
    setGenerating(false);
  }, [loanInputs, schedule, summary, theme, fileName]);

  return (
    <div>
      <h2 className="text-xl font-bold text-accent mb-4">Generate PDF Report</h2>

      <div className="max-w-2xl space-y-4">
        <div className="bg-dark-bg rounded-lg p-4 border border-border">
          <p className="text-sm text-steel-blue mb-3">
            Generate a complete loan amortization report as a PDF document. The report includes the loan summary and full amortization schedule.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating || !schedule.length}
            className="px-4 py-2 bg-accent/80 border border-accent text-title-bg text-sm font-semibold rounded hover:bg-accent disabled:opacity-50"
          >
            {generating ? 'Generating PDF...' : `Download ${fileName}`}
          </button>
          {!schedule.length && (
            <p className="text-negative text-xs mt-2">Enter loan parameters on the Inputs tab first.</p>
          )}
        </div>

        <div className="text-xs text-text-primary/40">
          The report uses your current theme ({theme} mode) for styling.
        </div>
      </div>
    </div>
  );
}
