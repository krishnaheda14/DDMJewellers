import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Coins, TrendingUp, Calendar, Target, Pause, Play, Settings, Home, ArrowLeft } from "lucide-react";
import { PageTransition } from "@/components/loading/page-transition";
import PageNavigation from "@/components/page-navigation";
import { Link } from "wouter";
import { formatCurrency, calculateProgress } from "@/lib/gullak-utils";

interface GullakAccount {
  id: number;
  name: string;
  dailyAmount: string;
  targetGoldWeight: string;
  targetAmount: string;
  currentBalance: string;
  status: string;
  autoPayEnabled: boolean;
  nextPaymentDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface GullakTransaction {
  id: number;
  amount: string;
  type: string;
  goldRate: string | null;
  goldValue: string | null;
  description: string | null;
  transactionDate: string;
}

interface GoldRate {
  rate24k: string;
  rate22k: string;
  rate18k: string;
  effectiveDate: string;
}

export default function Gullak() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  // Fetch Gullak accounts
  const { data: gullakAccounts = [], isLoading: accountsLoading } = useQuery<GullakAccount[]>({
    queryKey: ["/api/gullak/accounts"],
    enabled: isAuthenticated,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch current gold rates
  const { data: goldRates } = useQuery<GoldRate>({
    queryKey: ["/api/gullak/gold-rates"],
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  // Fetch transactions for selected account
  const { data: transactions = [] } = useQuery<GullakTransaction[]>({
    queryKey: ["/api/gullak/transactions", selectedAccount],
    enabled: isAuthenticated && selectedAccount !== null,
    staleTime: 30 * 1000, // 30 seconds for transaction data
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  });

  // Toggle auto-pay mutation
  const toggleAutoPayMutation = useMutation({
    mutationFn: async ({ accountId, autoPayEnabled }: { accountId: number; autoPayEnabled: boolean }) => {
      return apiRequest("PATCH", `/api/gullak/accounts/${accountId}`, { autoPayEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gullak/accounts"] });
    },
  });

  // Manual deposit mutation
  const depositMutation = useMutation({
    mutationFn: async ({ accountId, amount }: { accountId: number; amount: string }) => {
      return apiRequest("POST", `/api/gullak/transactions`, {
        gullakAccountId: accountId,
        amount,
        type: "deposit",
        description: "Manual deposit",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gullak/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/gullak/transactions", selectedAccount] });
    },
  });

  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="container-narrow p-responsive text-center">
          <h1 className="heading-md m-responsive">Please log in to access Gullak</h1>
          <Link href="/auth">
            <Button className="btn-responsive touch-friendly">Log In</Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  if (accountsLoading) {
    return (
      <PageTransition>
        <div className="container-fluid p-responsive">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 m-responsive-sm"></div>
            <div className="responsive-grid-3 gap-responsive">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 sm:h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageNavigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Gullak - Gold Savings</h1>
            <p className="text-gray-600">Save daily, own gold monthly</p>
          </div>
          <Link href="/gullak/create">
            <Button className="bg-gold hover:bg-gold/90">
              <Plus className="h-4 w-4 mr-2" />
              Create New Gullak
            </Button>
          </Link>
        </div>

        {/* Gold Rates Card */}
        {goldRates && (
          <Card className="mb-8 border-gold/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-gold">
                <TrendingUp className="h-5 w-5" />
                Today's Gold Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gold/5 rounded-lg">
                  <div className="text-sm text-gray-600">24K Gold</div>
                  <div className="text-2xl font-bold text-gold">₹{goldRates.rate24k}/g</div>
                </div>
                <div className="text-center p-4 bg-gold/5 rounded-lg">
                  <div className="text-sm text-gray-600">22K Gold</div>
                  <div className="text-2xl font-bold text-gold">₹{goldRates.rate22k}/g</div>
                </div>
                <div className="text-center p-4 bg-gold/5 rounded-lg">
                  <div className="text-sm text-gray-600">18K Gold</div>
                  <div className="text-2xl font-bold text-gold">₹{goldRates.rate18k}/g</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {gullakAccounts.length === 0 ? (
          // Empty state
          <Card className="text-center py-12">
            <CardContent>
              <Coins className="h-16 w-16 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Start Your Gold Savings Journey</h3>
              <p className="text-gray-600 mb-6">
                Create your first Gullak account and start saving for gold with daily auto-pay
              </p>
              <Link href="/gullak/create">
                <Button className="bg-gold hover:bg-gold/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Gullak
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          // Gullak accounts grid
          <Tabs defaultValue="accounts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="accounts">My Gullak Accounts</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            </TabsList>

            <TabsContent value="accounts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gullakAccounts.map((account: GullakAccount) => {
                  const progress = calculateProgress(account.currentBalance, account.targetAmount);
                  const goldWeight = goldRates ? 
                    (parseFloat(account.currentBalance) / parseFloat(goldRates.rate24k)).toFixed(3) : "0";

                  return (
                    <Card key={account.id} className="border-gold/20 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                          <Badge variant={account.status === "active" ? "default" : "secondary"}>
                            {account.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>

                        {/* Balance & Target */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Current Balance</div>
                            <div className="font-semibold text-gold">₹{formatCurrency(account.currentBalance)}</div>
                            <div className="text-xs text-gray-500">{goldWeight}g gold</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Target</div>
                            <div className="font-semibold">{account.targetGoldWeight}g</div>
                            <div className="text-xs text-gray-500">₹{formatCurrency(account.targetAmount)}</div>
                          </div>
                        </div>

                        {/* Daily Amount */}
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div>
                            <div className="text-sm text-gray-600">Daily Auto-pay</div>
                            <div className="font-semibold">₹{formatCurrency(account.dailyAmount)}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleAutoPayMutation.mutate({
                              accountId: account.id,
                              autoPayEnabled: !account.autoPayEnabled
                            })}
                            disabled={toggleAutoPayMutation.isPending}
                          >
                            {account.autoPayEnabled ? 
                              <Pause className="h-4 w-4" /> : 
                              <Play className="h-4 w-4" />
                            }
                          </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAccount(account.id)}
                            className="flex-1"
                          >
                            View Details
                          </Button>
                          {progress >= 100 && (
                            <Link href={`/gullak/order/${account.id}`}>
                              <Button size="sm" className="bg-gold hover:bg-gold/90">
                                <Target className="h-4 w-4 mr-1" />
                                Order Gold
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              {selectedAccount ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">No transactions found</p>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <div className="font-medium capitalize">{transaction.type}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(transaction.transactionDate).toLocaleDateString()}
                              </div>
                              {transaction.description && (
                                <div className="text-xs text-gray-500">{transaction.description}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gold">
                                +₹{formatCurrency(transaction.amount)}
                              </div>
                              {transaction.goldValue && (
                                <div className="text-xs text-gray-500">
                                  {transaction.goldValue}g gold
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a Gullak account to view transaction history</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PageTransition>
  );
}