export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatWeight(weight: string | number): string {
  const num = typeof weight === 'string' ? parseFloat(weight) : weight;
  return `${num.toFixed(3)} grams`;
}

export function calculateProgress(current: string | number, target: string | number): number {
  const currentNum = typeof current === 'string' ? parseFloat(current) : current;
  const targetNum = typeof target === 'string' ? parseFloat(target) : target;
  
  if (targetNum === 0) return 0;
  return Math.min((currentNum / targetNum) * 100, 100);
}

export function getDaysUntilTarget(
  currentAmount: string | number,
  targetAmount: string | number,
  dailyAmount: string | number
): number {
  const current = typeof currentAmount === 'string' ? parseFloat(currentAmount) : currentAmount;
  const target = typeof targetAmount === 'string' ? parseFloat(targetAmount) : targetAmount;
  const daily = typeof dailyAmount === 'string' ? parseFloat(dailyAmount) : dailyAmount;
  
  if (daily === 0) return Infinity;
  
  const remaining = target - current;
  if (remaining <= 0) return 0;
  
  return Math.ceil(remaining / daily);
}

export function formatDaysRemaining(days: number): string {
  if (days === Infinity) return 'Never';
  if (days === 0) return 'Target reached!';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) return `${months} month${months > 1 ? 's' : ''}`;
    return `${months} month${months > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (remainingDays === 0) return `${years} year${years > 1 ? 's' : ''}`;
  
  const months = Math.floor(remainingDays / 30);
  return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`;
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'paused':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'completed':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'cancelled':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getMetalIcon(metalType: string): string {
  switch (metalType?.toLowerCase()) {
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    default:
      return '💰';
  }
}

export function calculateMetalAmount(
  savedAmount: string | number,
  currentRate: string | number
): number {
  const amount = typeof savedAmount === 'string' ? parseFloat(savedAmount) : savedAmount;
  const rate = typeof currentRate === 'string' ? parseFloat(currentRate) : currentRate;
  
  if (rate === 0) return 0;
  return amount / rate;
}