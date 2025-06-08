import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Gift, Target, Crown, Diamond, Medal, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoyaltyBadge {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: string;
  pointsRequired: number;
  isActive: boolean;
}

interface UserBadge {
  id: number;
  badgeId: number;
  earnedAt: string;
  level: number;
  isNew: boolean;
  badge: LoyaltyBadge;
}

interface LoyaltyProfile {
  id: number;
  userId: string;
  totalPoints: number;
  availablePoints: number;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  tierProgress: number;
  streak: number;
  lifetimeSpent: string;
}

interface LoyaltyReward {
  id: number;
  name: string;
  description: string;
  type: string;
  pointsCost: number;
  value: string;
  tierRequired?: string;
  isActive: boolean;
}

const getTierIcon = (tier: string) => {
  switch (tier) {
    case "bronze": return <Medal className="w-6 h-6 text-amber-600" />;
    case "silver": return <Award className="w-6 h-6 text-gray-400" />;
    case "gold": return <Trophy className="w-6 h-6 text-yellow-500" />;
    case "platinum": return <Star className="w-6 h-6 text-blue-400" />;
    case "diamond": return <Diamond className="w-6 h-6 text-purple-500" />;
    default: return <Medal className="w-6 h-6 text-gray-400" />;
  }
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "common": return "bg-gray-100 border-gray-300 text-gray-700";
    case "rare": return "bg-blue-100 border-blue-300 text-blue-700";
    case "epic": return "bg-purple-100 border-purple-300 text-purple-700";
    case "legendary": return "bg-gradient-to-r from-yellow-400 to-orange-500 border-yellow-300 text-white";
    default: return "bg-gray-100 border-gray-300 text-gray-700";
  }
};

const BadgeCard = ({ badge, userBadge }: { badge: LoyaltyBadge; userBadge?: UserBadge }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.05 }}
    className="relative"
  >
    <Card className={`${getRarityColor(badge.rarity)} border-2 transition-all duration-300 hover:shadow-lg ${userBadge ? 'opacity-100' : 'opacity-50'}`}>
      <CardHeader className="text-center p-4">
        <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center rounded-full bg-white/20">
          <Crown className="w-8 h-8" />
        </div>
        <CardTitle className="text-sm font-semibold">{badge.name}</CardTitle>
        {userBadge && userBadge.isNew && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white animate-pulse">
            NEW!
          </Badge>
        )}
      </CardHeader>
      <CardContent className="text-center p-4 pt-0">
        <p className="text-xs mb-2">{badge.description}</p>
        <Badge variant="outline" className="text-xs">
          {badge.rarity.toUpperCase()}
        </Badge>
        {userBadge && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              Level {userBadge.level}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
);

export default function LoyaltyPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const queryClient = useQueryClient();

  const { data: loyaltyProfile } = useQuery({
    queryKey: ["/api/loyalty/profile"],
  });

  const { data: userBadges = [] } = useQuery({
    queryKey: ["/api/loyalty/badges"],
  });

  const { data: availableBadges = [] } = useQuery({
    queryKey: ["/api/loyalty/badges/available"],
  });

  const { data: loyaltyRewards = [] } = useQuery({
    queryKey: ["/api/loyalty/rewards"],
  });

  const { data: challenges = [] } = useQuery({
    queryKey: ["/api/loyalty/challenges"],
  });

  const redeemRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const response = await apiRequest("POST", `/api/loyalty/rewards/${rewardId}/redeem`);
      if (!response.ok) throw new Error("Failed to redeem reward");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty"] });
    },
  });

  const profile = loyaltyProfile as LoyaltyProfile;
  const tierThresholds = {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 15000,
    diamond: 50000
  };

  const nextTier = profile?.tier === "bronze" ? "silver" : 
                  profile?.tier === "silver" ? "gold" :
                  profile?.tier === "gold" ? "platinum" :
                  profile?.tier === "platinum" ? "diamond" : null;

  const nextTierThreshold = nextTier ? tierThresholds[nextTier as keyof typeof tierThresholds] : 0;
  const currentTierThreshold = tierThresholds[profile?.tier as keyof typeof tierThresholds] || 0;
  const progressToNextTier = nextTier ? 
    ((profile?.totalPoints || 0) - currentTierThreshold) / (nextTierThreshold - currentTierThreshold) * 100 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-2">
            DDM Loyalty Program
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Collect badges, earn rewards, and unlock exclusive benefits
          </p>
        </motion.div>

        {profile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-gray-800 dark:to-gray-700 border-amber-200 dark:border-gray-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getTierIcon(profile.tier)}
                    <div>
                      <CardTitle className="text-xl capitalize">{profile.tier} Member</CardTitle>
                      <CardDescription>{profile.availablePoints.toLocaleString()} points available</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Points</p>
                    <p className="text-2xl font-bold text-amber-600">{profile.totalPoints.toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {nextTier && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress to {nextTier}</span>
                      <span>{Math.round(progressToNextTier)}%</span>
                    </div>
                    <Progress value={progressToNextTier} className="h-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {nextTierThreshold - (profile.totalPoints || 0)} points to {nextTier}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <Target className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                    <p className="text-sm font-semibold">{profile.streak}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Day Streak</p>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <Gift className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                    <p className="text-sm font-semibold">₹{profile.lifetimeSpent}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Lifetime Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-gray-800 border border-amber-200 dark:border-gray-600">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-gray-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-gray-700">
              Badge Collection
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-gray-700">
              Rewards
            </TabsTrigger>
            <TabsTrigger value="challenges" className="data-[state=active]:bg-amber-100 dark:data-[state=active]:bg-gray-700">
              Challenges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span>Recent Badges</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {userBadges.slice(0, 6).map((userBadge: UserBadge) => (
                      <BadgeCard key={userBadge.id} badge={userBadge.badge} userBadge={userBadge} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-green-500" />
                    <span>Available Rewards</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loyaltyRewards.slice(0, 3).map((reward: LoyaltyReward) => (
                      <div key={reward.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <div>
                          <p className="font-medium text-sm">{reward.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{reward.pointsCost} points</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => redeemRewardMutation.mutate(reward.id)}
                          disabled={!profile || profile.availablePoints < reward.pointsCost}
                        >
                          Redeem
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span>Active Challenges</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {challenges.slice(0, 3).map((challenge: any) => (
                      <div key={challenge.id} className="space-y-2">
                        <div className="flex justify-between">
                          <p className="font-medium text-sm">{challenge.name}</p>
                          <Badge variant="outline" className="text-xs">{challenge.type}</Badge>
                        </div>
                        <Progress value={challenge.progress || 0} className="h-1" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="badges" className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <AnimatePresence>
                {availableBadges.map((badge: LoyaltyBadge) => {
                  const userBadge = userBadges.find((ub: UserBadge) => ub.badgeId === badge.id);
                  return (
                    <BadgeCard key={badge.id} badge={badge} userBadge={userBadge} />
                  );
                })}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loyaltyRewards.map((reward: LoyaltyReward) => (
                <Card key={reward.id} className="border-amber-200 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-2xl font-bold text-amber-600">{reward.pointsCost}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">points</p>
                      </div>
                      {reward.value && (
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">₹{reward.value}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">value</p>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => redeemRewardMutation.mutate(reward.id)}
                      disabled={!profile || profile.availablePoints < reward.pointsCost || redeemRewardMutation.isPending}
                    >
                      {redeemRewardMutation.isPending ? "Redeeming..." : "Redeem Reward"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {challenges.map((challenge: any) => (
                <Card key={challenge.id} className="border-blue-200 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{challenge.name}</span>
                      <Badge variant="outline">{challenge.type}</Badge>
                    </CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(challenge.progress || 0)}%</span>
                      </div>
                      <Progress value={challenge.progress || 0} className="h-2" />
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">Rewards</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {challenge.rewards?.points || 0} points
                          </p>
                        </div>
                        {challenge.completedAt && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}