// Utility functions for Gullak (Gold Savings) feature

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function calculateProgress(currentBalance: string, targetAmount: string): number {
  const current = parseFloat(currentBalance) || 0;
  const target = parseFloat(targetAmount) || 1;
  
  const progress = (current / target) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export function calculateGoldWeight(amount: string, goldRate: string): number {
  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(goldRate) || 1;
  
  return amountNum / rateNum;
}

export function formatWeight(weight: number): string {
  if (weight < 1) {
    return `${(weight * 1000).toFixed(2)}mg`;
  } else if (weight < 1000) {
    return `${weight.toFixed(3)}g`;
  } else {
    return `${(weight / 1000).toFixed(3)}kg`;
  }
}

export function calculateDaysToTarget(
  currentBalance: string,
  targetAmount: string,
  dailyAmount: string
): number {
  const current = parseFloat(currentBalance) || 0;
  const target = parseFloat(targetAmount) || 0;
  const daily = parseFloat(dailyAmount) || 1;
  
  const remaining = target - current;
  if (remaining <= 0) return 0;
  
  return Math.ceil(remaining / daily);
}

export function getNextPaymentDate(lastPaymentDate?: string): Date {
  const today = new Date();
  const nextPayment = new Date(today);
  
  if (lastPaymentDate) {
    const lastPayment = new Date(lastPaymentDate);
    nextPayment.setTime(lastPayment.getTime() + (24 * 60 * 60 * 1000)); // Add 1 day
  } else {
    nextPayment.setDate(today.getDate() + 1); // Tomorrow
  }
  
  return nextPayment;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getAccountStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function calculateMonthlyContribution(dailyAmount: string): number {
  return parseFloat(dailyAmount) * 30;
}

export function calculateYearlyContribution(dailyAmount: string): number {
  return parseFloat(dailyAmount) * 365;
}

export function getGullakInsights(accounts: any[]): {
  totalSaved: number;
  totalTargets: number;
  averageProgress: number;
  activeAccounts: number;
} {
  const totalSaved = accounts.reduce((sum, account) => 
    sum + (parseFloat(account.currentBalance) || 0), 0
  );
  
  const totalTargets = accounts.reduce((sum, account) => 
    sum + (parseFloat(account.targetAmount) || 0), 0
  );
  
  const averageProgress = accounts.length > 0 
    ? accounts.reduce((sum, account) => 
        sum + calculateProgress(account.currentBalance, account.targetAmount), 0
      ) / accounts.length
    : 0;
  
  const activeAccounts = accounts.filter(account => 
    account.status === 'active'
  ).length;
  
  return {
    totalSaved,
    totalTargets,
    averageProgress,
    activeAccounts,
  };
}