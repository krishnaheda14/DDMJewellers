import { storage } from "./storage";

// Calculate next payment date based on frequency
export function calculateNextPaymentDate(
  frequency: string,
  lastPaymentDate?: Date,
  dayOfWeek?: number,
  dayOfMonth?: number
): Date {
  const now = new Date();
  const baseDate = lastPaymentDate || now;
  
  switch (frequency) {
    case 'daily':
      const nextDay = new Date(baseDate);
      nextDay.setDate(nextDay.getDate() + 1);
      return nextDay;
      
    case 'weekly':
      const nextWeek = new Date(baseDate);
      const currentDay = nextWeek.getDay();
      const targetDay = dayOfWeek || 1; // Default to Monday
      const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
      nextWeek.setDate(nextWeek.getDate() + daysUntilTarget);
      return nextWeek;
      
    case 'monthly':
      const nextMonth = new Date(baseDate);
      const targetDate = dayOfMonth || 1; // Default to 1st of month
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(Math.min(targetDate, new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate()));
      return nextMonth;
      
    default:
      return new Date(baseDate.getTime() + 24 * 60 * 60 * 1000); // Default to daily
  }
}

// Process autopay for all eligible accounts
export async function processAutopayments(): Promise<void> {
  try {
    console.log('Processing autopayments...');
    
    // Get all active accounts with autopay enabled
    const allAccounts = await storage.getGullakAccounts();
    const eligibleAccounts = allAccounts.filter(account => 
      account.status === 'active' && 
      account.autoPayEnabled && 
      account.nextPaymentDate && 
      new Date(account.nextPaymentDate) <= new Date()
    );

    console.log(`Found ${eligibleAccounts.length} eligible accounts for autopay`);

    for (const account of eligibleAccounts) {
      try {
        await processAccountAutopay(account);
      } catch (error) {
        console.error(`Failed to process autopay for account ${account.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in processAutopayments:', error);
  }
}

// Process autopay for a specific account
async function processAccountAutopay(account: any): Promise<void> {
  const paymentAmount = parseFloat(account.paymentAmount);
  const currentBalance = parseFloat(account.currentBalance || '0');
  const targetAmount = parseFloat(account.targetAmount);
  
  // Check if target is already reached
  if (currentBalance >= targetAmount) {
    console.log(`Account ${account.id} has reached target amount`);
    await storage.updateGullakAccount(account.id, {
      status: 'completed',
      completedAt: new Date()
    });
    return;
  }

  // Get current gold/silver rates
  const goldRates = await storage.getCurrentGoldRates();
  const metalRate = account.metalType === 'gold' ? goldRates.rate24k : goldRates.silverRate || '85';
  const goldValue = (paymentAmount / parseFloat(metalRate)).toFixed(6);

  // Create autopay transaction
  const transaction = await storage.createGullakTransaction({
    gullakAccountId: account.id,
    userId: account.userId,
    amount: account.paymentAmount,
    type: 'auto_pay',
    goldRate: metalRate,
    goldValue: goldValue,
    description: `Automatic ${account.paymentFrequency} payment`,
    status: 'completed',
    transactionDate: new Date()
  });

  // Update account balance and payment tracking
  const newBalance = currentBalance + paymentAmount;
  const nextPaymentDate = calculateNextPaymentDate(
    account.paymentFrequency,
    new Date(),
    account.paymentDayOfWeek,
    account.paymentDayOfMonth
  );

  await storage.updateGullakAccount(account.id, {
    currentBalance: newBalance.toString(),
    lastPaymentDate: new Date(),
    nextPaymentDate: nextPaymentDate,
    totalPayments: (account.totalPayments || 0) + 1,
    status: newBalance >= targetAmount ? 'completed' : 'active',
    completedAt: newBalance >= targetAmount ? new Date() : null
  });

  console.log(`Processed autopay for account ${account.id}: ₹${paymentAmount} added, new balance: ₹${newBalance}`);
}

// Setup autopay scheduler (runs every hour)
export function startAutopayScheduler(): void {
  // Run immediately
  processAutopayments();
  
  // Run every hour
  setInterval(() => {
    processAutopayments();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
  
  console.log('Gullak autopay scheduler started');
}

// Manual trigger for testing
export async function triggerAutopayForAccount(accountId: number): Promise<void> {
  const account = await storage.getGullakAccount(accountId);
  if (!account) {
    throw new Error('Account not found');
  }
  
  if (!account.autoPayEnabled) {
    throw new Error('Autopay is not enabled for this account');
  }
  
  await processAccountAutopay(account);
}