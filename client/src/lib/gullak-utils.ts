// Gullak utility functions for gold savings calculations

export interface GoldRates {
  rate_24k: string;
  rate_22k: string;
  rate_18k: string;
  currency: string;
}

export interface GullakAccount {
  id: number;
  name: string;
  dailyAmount: string;
  targetGoldWeight: string;
  targetAmount: string;
  currentBalance: string;
  status: string;
  autoPayEnabled: boolean;
  nextPaymentDate?: Date;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GullakTransaction {
  id: number;
  amount: string;
  type: string;
  goldRate?: string;
  goldValue?: string;
  description?: string;
  status: string;
  transactionDate: Date;
}

// Calculate progress percentage
export function calculateProgress(currentBalance: string, targetAmount: string): number {
  const current = parseFloat(currentBalance);
  const target = parseFloat(targetAmount);
  return target > 0 ? Math.min((current / target) * 100, 100) : 0;
}

// Calculate days remaining to reach target
export function calculateDaysRemaining(currentBalance: string, targetAmount: string, dailyAmount: string): number {
  const current = parseFloat(currentBalance);
  const target = parseFloat(targetAmount);
  const daily = parseFloat(dailyAmount);
  
  if (daily <= 0 || current >= target) return 0;
  
  const remaining = target - current;
  return Math.ceil(remaining / daily);
}

// Calculate equivalent gold weight based on current savings
export function calculateCurrentGoldWeight(currentBalance: string, goldRate: string): number {
  const balance = parseFloat(currentBalance);
  const rate = parseFloat(goldRate);
  
  if (rate <= 0) return 0;
  
  return balance / rate; // Returns weight in grams
}

// Format currency amount
export function formatCurrency(amount: string | number, currency: string = 'INR'): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
}

// Format gold weight
export function formatGoldWeight(weight: number): string {
  return `${weight.toFixed(3)}g`;
}

// Calculate target amount based on gold weight and rate
export function calculateTargetAmount(goldWeight: string, goldRate: string): number {
  const weight = parseFloat(goldWeight);
  const rate = parseFloat(goldRate);
  
  return weight * rate;
}

// Validate Gullak account data
export function validateGullakAccount(data: {
  name: string;
  dailyAmount: string;
  targetGoldWeight: string;
}): string[] {
  const errors: string[] = [];
  
  if (!data.name.trim()) {
    errors.push('Account name is required');
  }
  
  const dailyAmount = parseFloat(data.dailyAmount);
  if (isNaN(dailyAmount) || dailyAmount <= 0) {
    errors.push('Daily amount must be a positive number');
  }
  
  const goldWeight = parseFloat(data.targetGoldWeight);
  if (isNaN(goldWeight) || goldWeight <= 0) {
    errors.push('Target gold weight must be a positive number');
  }
  
  return errors;
}

// Get status color for badges
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'paused':
      return 'bg-yellow-100 text-yellow-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Calculate next payment date
export function calculateNextPaymentDate(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // Set to 9 AM
  return tomorrow;
}

// Format date for display
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date and time for display
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}