import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search, 
  Star, 
  Heart,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Diamond,
  Gem
} from "lucide-react";
import PageNavigation from "@/components/page-navigation";
import type { CareTutorial, TutorialProgress } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface TutorialWithProgress extends CareTutorial {
  progress?: TutorialProgress;
}

export default function JewelryCare() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedJewelryType, setSelectedJewelryType] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTutorial, setCurrentTutorial] = useState<TutorialWithProgress | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Fetch tutorials with user progress
  const { data: tutorials = [], isLoading } = useQuery<TutorialWithProgress[]>({
    queryKey: ["/api/jewelry-care/tutorials", { 
      category: selectedCategory,
      jewelryType: selectedJewelryType,
      difficulty: selectedDifficulty,
      search: searchQuery
    }],
    enabled: true,
  });

  // Fetch user's care reminders
  const { data: reminders = [] } = useQuery({
    queryKey: ["/api/jewelry-care/reminders"],
    enabled: isAuthenticated,
  });

  // Update tutorial progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ tutorialId, step, isCompleted }: { 
      tutorialId: number; 
      step: number; 
      isCompleted?: boolean;
    }) => {
      const response = await fetch("/api/jewelry-care/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorialId, currentStep: step, isCompleted }),
      });
      if (!response.ok) throw new Error("Failed to update progress");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jewelry-care/tutorials"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to track your progress.",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/auth", 1500);
        return;
      }
      toast({
        title: "Update Failed",
        description: "Failed to update tutorial progress.",
        variant: "destructive",
      });
    },
  });

  // Like tutorial mutation
  const likeTutorialMutation = useMutation({
    mutationFn: async (tutorialId: number) => {
      const response = await fetch(`/api/jewelry-care/tutorials/${tutorialId}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like tutorial");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jewelry-care/tutorials"] });
      toast({
        title: "Tutorial Liked",
        description: "Thank you for your feedback!",
      });
    },
  });

  const categories = [
    { value: "all", label: "All Categories", icon: BookOpen },
    { value: "cleaning", label: "Cleaning", icon: Gem },
    { value: "storage", label: "Storage", icon: Diamond },
    { value: "maintenance", label: "Maintenance", icon: Clock },
    { value: "repair", label: "Repair", icon: AlertTriangle },
    { value: "prevention", label: "Prevention", icon: Lightbulb },
  ];

  const jewelryTypes = [
    { value: "all", label: "All Types" },
    { value: "rings", label: "Rings" },
    { value: "necklaces", label: "Necklaces" },
    { value: "earrings", label: "Earrings" },
    { value: "bracelets", label: "Bracelets" },
    { value: "watches", label: "Watches" },
    { value: "general", label: "General Care" },
  ];

  const difficulties = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleTutorialSelect = (tutorial: TutorialWithProgress) => {
    setCurrentTutorial(tutorial);
    setCurrentStep(tutorial.progress?.currentStep || 0);
    setIsPlaying(false);
  };

  const handleStepComplete = (stepIndex: number) => {
    if (!currentTutorial || !isAuthenticated) return;
    
    const isLastStep = stepIndex === (currentTutorial.steps as any[])?.length - 1;
    updateProgressMutation.mutate({
      tutorialId: currentTutorial.id,
      step: stepIndex + 1,
      isCompleted: isLastStep,
    });
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === "all" || tutorial.category === selectedCategory;
    const matchesType = selectedJewelryType === "all" || tutorial.jewelryType === selectedJewelryType;
    const matchesDifficulty = selectedDifficulty === "all" || tutorial.difficulty === selectedDifficulty;
    const matchesSearch = !searchQuery || 
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesType && matchesDifficulty && matchesSearch;
  });

  return (
    <div className="container-fluid p-responsive min-h-screen bg-gradient-to-br from-amber-50/30 via-white to-gold/5">
      <PageNavigation />
      {/* Hero Section */}
      <div className="text-center m-responsive">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="responsive-flex justify-center m-responsive-sm"
        >
          <Diamond className="h-8 w-8 sm:h-10 sm:w-10 text-gold" />
          <h1 className="heading-lg bg-gradient-to-r from-gold to-amber-600 bg-clip-text text-transparent">
            Jewelry Care Center
          </h1>
          <Gem className="h-8 w-8 sm:h-10 sm:w-10 text-gold" />
        </motion.div>
        <p className="responsive-text text-muted-foreground max-w-3xl mx-auto">
          Learn professional jewelry care techniques through interactive video tutorials. 
          Keep your precious pieces sparkling and maintain their value for generations.
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="m-responsive border-gold/20">
        <CardContent className="p-responsive">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tutorials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <select
                value={selectedJewelryType}
                onChange={(e) => setSelectedJewelryType(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                {jewelryTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border rounded-md bg-white"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>{diff.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 m-responsive">
        {/* Tutorial List */}
        <div className="lg:col-span-1">
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold" />
                Tutorials ({filteredTutorials.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredTutorials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tutorials found matching your criteria.</p>
                </div>
              ) : (
                filteredTutorials.map((tutorial) => (
                  <motion.div
                    key={tutorial.id}
                    whileHover={{ scale: 1.02 }}
                    className={`cursor-pointer transition-all duration-200 ${
                      currentTutorial?.id === tutorial.id ? 'ring-2 ring-gold' : ''
                    }`}
                    onClick={() => handleTutorialSelect(tutorial)}
                  >
                    <Card className="border-gold/10 hover:border-gold/30">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-amber-100 rounded-lg flex items-center justify-center">
                              {tutorial.thumbnailUrl ? (
                                <img 
                                  src={tutorial.thumbnailUrl} 
                                  alt={tutorial.title}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Play className="h-6 w-6 text-gold" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1 truncate">
                              {tutorial.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getDifficultyColor(tutorial.difficulty)}>
                                {tutorial.difficulty}
                              </Badge>
                              {tutorial.duration && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(tutorial.duration)}
                                </span>
                              )}
                            </div>
                            {tutorial.progress && (
                              <Progress 
                                value={(tutorial.progress.currentStep / ((tutorial.steps as any[])?.length || 1)) * 100} 
                                className="h-2"
                              />
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {tutorial.views} views
                              </span>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {tutorial.likes}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tutorial Player and Details */}
        <div className="lg:col-span-2">
          {currentTutorial ? (
            <div className="space-y-6">
              {/* Video Player */}
              <Card className="border-gold/20">
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-t-lg relative overflow-hidden">
                    {currentTutorial.videoUrl ? (
                      <video
                        className="w-full h-full object-cover"
                        src={currentTutorial.videoUrl}
                        poster={currentTutorial.thumbnailUrl}
                        controls
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">Video Coming Soon</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{currentTutorial.title}</h2>
                        <p className="text-muted-foreground mb-4">{currentTutorial.description}</p>
                        <div className="flex items-center gap-4">
                          <Badge className={getDifficultyColor(currentTutorial.difficulty)}>
                            {currentTutorial.difficulty}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {currentTutorial.jewelryType} • {currentTutorial.category}
                          </span>
                          {currentTutorial.duration && (
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDuration(currentTutorial.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => likeTutorialMutation.mutate(currentTutorial.id)}
                        className="flex items-center gap-2"
                      >
                        <Heart className="h-4 w-4" />
                        {currentTutorial.likes}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tutorial Steps */}
              <Tabs defaultValue="steps" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="steps">Steps</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="tips">Tips</TabsTrigger>
                  <TabsTrigger value="warnings">Warnings</TabsTrigger>
                </TabsList>

                <TabsContent value="steps" className="space-y-4">
                  <Card className="border-gold/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-gold" />
                        Step-by-Step Guide
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentTutorial.steps && (currentTutorial.steps as any[]).map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex gap-4 p-4 rounded-lg transition-all ${
                            index <= currentStep ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            index < currentStep ? 'bg-green-500 text-white' :
                            index === currentStep ? 'bg-gold text-white' : 'bg-gray-300 text-gray-600'
                          }`}>
                            {index < currentStep ? <CheckCircle className="h-4 w-4" /> : index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2">{step.title || `Step ${index + 1}`}</h4>
                            <p className="text-muted-foreground mb-3">{step.description}</p>
                            {step.image && (
                              <img 
                                src={step.image} 
                                alt={`Step ${index + 1}`}
                                className="w-full max-w-md h-48 object-cover rounded-lg mb-3"
                              />
                            )}
                            {isAuthenticated && index === currentStep && (
                              <Button
                                size="sm"
                                onClick={() => handleStepComplete(index)}
                                className="bg-gold hover:bg-gold/90"
                              >
                                Mark as Complete
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="materials">
                  <Card className="border-gold/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Diamond className="h-5 w-5 text-gold" />
                        Required Materials
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentTutorial.materials && (currentTutorial.materials as any[]).length > 0 ? (
                        <ul className="space-y-2">
                          {(currentTutorial.materials as any[]).map((material, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{material}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground">No specific materials required.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="tips">
                  <Card className="border-gold/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-gold" />
                        Expert Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentTutorial.tips && (currentTutorial.tips as any[]).length > 0 ? (
                        <div className="space-y-3">
                          {(currentTutorial.tips as any[]).map((tip, index) => (
                            <div key={index} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                              <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm">{tip}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No additional tips available.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="warnings">
                  <Card className="border-gold/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Important Warnings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {currentTutorial.warnings && (currentTutorial.warnings as any[]).length > 0 ? (
                        <div className="space-y-3">
                          {(currentTutorial.warnings as any[]).map((warning, index) => (
                            <div key={index} className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-700">{warning}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No specific warnings for this tutorial.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="border-gold/20 h-96 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a Tutorial</h3>
                <p>Choose a tutorial from the list to start learning jewelry care techniques.</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Care Reminders */}
      {isAuthenticated && reminders.length > 0 && (
        <Card className="m-responsive border-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              Upcoming Care Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reminders.slice(0, 6).map((reminder: any) => (
                <Card key={reminder.id} className="border-amber-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm">{reminder.careType}</h4>
                      <Badge variant="outline" className="text-xs">
                        {reminder.frequency}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {reminder.jewelryType} {reminder.metalType && `- ${reminder.metalType}`}
                    </p>
                    <p className="text-xs">
                      Due: {new Date(reminder.nextDue).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}