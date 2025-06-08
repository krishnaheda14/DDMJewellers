export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function calculateProgress(currentBalance: string, targetAmount: string): number {
  const current = parseFloat(currentBalance);
  const target = parseFloat(targetAmount);
  if (target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

export function calculateGoldWeight(amount: string, goldRate: string): string {
  const amountNum = parseFloat(amount);
  const rateNum = parseFloat(goldRate);
  if (rateNum === 0) return "0";
  return (amountNum / rateNum).toFixed(3);
}

export function calculateGoldValue(weight: string, goldRate: string): string {
  const weightNum = parseFloat(weight);
  const rateNum = parseFloat(goldRate);
  return (weightNum * rateNum).toFixed(2);
}

export function getDaysToTarget(currentBalance: string, targetAmount: string, dailyAmount: string): number {
  const current = parseFloat(currentBalance);
  const target = parseFloat(targetAmount);
  const daily = parseFloat(dailyAmount);
  
  if (daily === 0 || current >= target) return 0;
  
  const remaining = target - current;
  return Math.ceil(remaining / daily);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getNextPaymentDate(lastPaymentDate?: string): Date {
  const baseDate = lastPaymentDate ? new Date(lastPaymentDate) : new Date();
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate;
}