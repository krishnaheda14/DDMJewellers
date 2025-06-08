export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(numAmount);
};

export const calculateGoldWeight = (amount: string, rate: string): number => {
  const amountNum = parseFloat(amount);
  const rateNum = parseFloat(rate);
  return amountNum / rateNum;
};

export const formatWeight = (weight: number): string => {
  return `${weight.toFixed(3)}g`;
};

export const calculateProgress = (current: string, target: string): number => {
  const currentNum = parseFloat(current);
  const targetNum = parseFloat(target);
  return targetNum > 0 ? Math.min((currentNum / targetNum) * 100, 100) : 0;
};

export const getDaysRemaining = (targetDate: Date): number => {
  const now = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getMetalColor = (metalType: string): string => {
  switch (metalType.toLowerCase()) {
    case 'gold':
      return 'text-yellow-600';
    case 'silver':
      return 'text-gray-500';
    case 'platinum':
      return 'text-gray-700';
    default:
      return 'text-gold';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'text-green-600';
    case 'paused':
      return 'text-yellow-600';
    case 'completed':
      return 'text-blue-600';
    case 'cancelled':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};