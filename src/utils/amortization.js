export function getPeriodsPerYear(frequency) {
  switch (frequency) {
    case 'yearly': return 1;
    case 'quarterly': return 4;
    case 'monthly': return 12;
    case 'weekly': return 52;
    case 'daily': return 365;
    default: return 12;
  }
}

export function calculatePayment(balance, periodicRate, totalPeriods) {
  if (balance <= 0 || totalPeriods <= 0) return 0;
  if (periodicRate === 0) return balance / totalPeriods;
  return balance * (periodicRate * Math.pow(1 + periodicRate, totalPeriods)) /
    (Math.pow(1 + periodicRate, totalPeriods) - 1);
}

function addPeriod(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
  }
  return d;
}

function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateSchedule(loanInputs, extraPaymentOverrides = {}) {
  const {
    loanBalance,
    annualRate,
    termYears,
    frequency,
    firstPaymentDate,
    globalExtraPayment,
  } = loanInputs;

  if (loanBalance <= 0 || termYears <= 0) return [];

  const periodsPerYear = getPeriodsPerYear(frequency);
  const periodicRate = (annualRate / 100) / periodsPerYear;
  const totalPeriods = Math.round(termYears * periodsPerYear);
  const scheduledPayment = calculatePayment(loanBalance, periodicRate, totalPeriods);

  const schedule = [];
  let balance = loanBalance;
  let paymentDate = new Date(firstPaymentDate + 'T00:00:00');

  for (let period = 1; balance > 0.005; period++) {
    const interestPortion = balance * periodicRate;
    let principalPortion = scheduledPayment - interestPortion;

    const isOverridden = period in extraPaymentOverrides;
    const extraPayment = isOverridden ? extraPaymentOverrides[period] : (globalExtraPayment || 0);

    // Cap principal + extra so we don't overpay
    if (principalPortion + extraPayment >= balance) {
      const finalPrincipal = balance;
      const finalExtra = 0;
      const totalPayment = interestPortion + finalPrincipal;
      schedule.push({
        period,
        paymentDate: toDateString(paymentDate),
        beginningBalance: balance,
        scheduledPayment: totalPayment,
        principalPortion: finalPrincipal,
        interestPortion,
        extraPayment: finalExtra,
        isOverridden: false,
        totalPayment,
        endingBalance: 0,
      });
      break;
    }

    if (principalPortion > balance) {
      principalPortion = balance;
    }

    const totalPayment = scheduledPayment + extraPayment;
    const endingBalance = balance - principalPortion - extraPayment;

    schedule.push({
      period,
      paymentDate: toDateString(paymentDate),
      beginningBalance: balance,
      scheduledPayment,
      principalPortion,
      interestPortion,
      extraPayment,
      isOverridden,
      totalPayment,
      endingBalance: Math.max(0, endingBalance),
    });

    balance = Math.max(0, endingBalance);
    paymentDate = addPeriod(paymentDate, frequency);
  }

  return schedule;
}

export function getScheduleSummary(schedule, loanInputs) {
  if (!schedule.length) {
    return {
      totalPayments: 0,
      totalInterest: 0,
      totalPrincipal: 0,
      totalExtraPayments: 0,
      payoffDate: null,
      numberOfPayments: 0,
    };
  }

  const periodsPerYear = getPeriodsPerYear(loanInputs.frequency);
  const totalPeriods = Math.round(loanInputs.termYears * periodsPerYear);
  const periodicRate = (loanInputs.annualRate / 100) / periodsPerYear;
  const scheduledPayment = calculatePayment(loanInputs.loanBalance, periodicRate, totalPeriods);
  const totalScheduledPayments = scheduledPayment * totalPeriods;
  const totalScheduledInterest = totalScheduledPayments - loanInputs.loanBalance;

  let totalPayments = 0;
  let totalInterest = 0;
  let totalPrincipal = 0;
  let totalExtraPayments = 0;

  for (const row of schedule) {
    totalPayments += row.totalPayment;
    totalInterest += row.interestPortion;
    totalPrincipal += row.principalPortion;
    totalExtraPayments += row.extraPayment;
  }

  const payoffDate = schedule[schedule.length - 1].paymentDate;
  const paymentsSaved = totalPeriods - schedule.length;
  const interestSaved = totalScheduledInterest - totalInterest;

  return {
    totalPayments,
    totalInterest,
    totalPrincipal,
    totalExtraPayments,
    payoffDate,
    numberOfPayments: schedule.length,
    scheduledPayment,
    paymentsSaved: paymentsSaved > 0 ? paymentsSaved : 0,
    interestSaved: interestSaved > 0.01 ? interestSaved : 0,
  };
}
