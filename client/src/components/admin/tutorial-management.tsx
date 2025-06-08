import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Plus, Edit, Trash2, Upload, Video, Clock, Eye } from "lucide-react";

interface Tutorial {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  jewelry_type: string;
  difficulty: string;
  duration: string;
  materials: string[];
  tools: string[];
  steps: any[];
  tips: string[];
  warnings: string[];
  is_featured: boolean;
  is_active: boolean;
  views: number;
  likes: number;
  created_at: string;
}

interface TutorialFormData {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  category: string;
  jewelryType: string;
  difficulty: string;
  duration: string;
  materials: string;
  tools: string;
  steps: string;
  tips: string;
  warnings: string;
  isFeatured: boolean;
  isActive: boolean;
}

const initialFormData: TutorialFormData = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  category: "cleaning",
  jewelryType: "rings",
  difficulty: "beginner",
  duration: "",
  materials: "",
  tools: "",
  steps: "",
  tips: "",
  warnings: "",
  isFeatured: false,
  isActive: true,
};

export default function TutorialManagement() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [formData, setFormData] = useState<TutorialFormData>(initialFormData);

  const { data: tutorials = [], isLoading } = useQuery<Tutorial[]>({
    queryKey: ["/api/jewelry-care/tutorials"],
  });

  const createTutorialMutation = useMutation({
    mutationFn: async (data: TutorialFormData) => {
      const payload = {
        ...data,
        materials: data.materials.split(',').map(m => m.trim()).filter(Boolean),
        tools: data.tools.split(',').map(t => t.trim()).filter(Boolean),
        steps: data.steps ? JSON.parse(data.steps) : [],
        tips: data.tips.split('\n').filter(Boolean),
        warnings: data.warnings.split('\n').filter(Boolean),
      };
      
      if (editingTutorial) {
        return await apiRequest("PUT", `/api/admin/jewelry-care/tutorials/${editingTutorial.id}`, payload);
      } else {
        return await apiRequest("POST", "/api/admin/jewelry-care/tutorials", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jewelry-care/tutorials"] });
      toast({
        title: "Success",
        description: `Tutorial ${editingTutorial ? "updated" : "created"} successfully`,
      });
      handleCloseForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: `Failed to ${editingTutorial ? "update" : "create"} tutorial`,
        variant: "destructive",
      });
    },
  });

  const deleteTutorialMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/jewelry-care/tutorials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jewelry-care/tutorials"] });
      toast({
        title: "Success",
        description: "Tutorial deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete tutorial",
        variant: "destructive",
      });
    },
  });

  const handleOpenForm = (tutorial?: Tutorial) => {
    if (tutorial) {
      setEditingTutorial(tutorial);
      setFormData({
        title: tutorial.title,
        description: tutorial.description,
        videoUrl: tutorial.video_url,
        thumbnailUrl: tutorial.thumbnail_url,
        category: tutorial.category,
        jewelryType: tutorial.jewelry_type,
        difficulty: tutorial.difficulty,
        duration: tutorial.duration,
        materials: tutorial.materials.join(', '),
        tools: tutorial.tools.join(', '),
        steps: JSON.stringify(tutorial.steps, null, 2),
        tips: tutorial.tips.join('\n'),
        warnings: tutorial.warnings.join('\n'),
        isFeatured: tutorial.is_featured,
        isActive: tutorial.is_active,
      });
    } else {
      setEditingTutorial(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTutorial(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTutorialMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this tutorial?")) {
      deleteTutorialMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-deep-navy">Care Tutorials</h2>
          <p className="text-warm-gray">Manage jewelry care video tutorials</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenForm()}
              className="bg-gold hover:bg-gold/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTutorial ? "Edit Tutorial" : "Add New Tutorial"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 5 minutes"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
                  <Input
                    id="thumbnailUrl"
                    type="url"
                    placeholder="https://example.com/thumbnail.jpg"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="prevention">Prevention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jewelryType">Jewelry Type</Label>
                  <Select
                    value={formData.jewelryType}
                    onValueChange={(value) => setFormData({ ...formData, jewelryType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rings">Rings</SelectItem>
                      <SelectItem value="necklaces">Necklaces</SelectItem>
                      <SelectItem value="earrings">Earrings</SelectItem>
                      <SelectItem value="bracelets">Bracelets</SelectItem>
                      <SelectItem value="watches">Watches</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="materials">Materials (comma-separated)</Label>
                  <Textarea
                    id="materials"
                    placeholder="Soft cloth, mild soap, warm water"
                    value={formData.materials}
                    onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tools">Tools (comma-separated)</Label>
                  <Textarea
                    id="tools"
                    placeholder="Soft brush, polishing cloth, jewelry cleaner"
                    value={formData.tools}
                    onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="steps">Steps (JSON format)</Label>
                <Textarea
                  id="steps"
                  placeholder='[{"title": "Step 1", "description": "Description", "timeSeconds": 30}]'
                  value={formData.steps}
                  onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tips">Tips (one per line)</Label>
                  <Textarea
                    id="tips"
                    placeholder="Always work in good lighting&#10;Use gentle circular motions"
                    value={formData.tips}
                    onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="warnings">Warnings (one per line)</Label>
                  <Textarea
                    id="warnings"
                    placeholder="Avoid harsh chemicals&#10;Do not use on pearls"
                    value={formData.warnings}
                    onChange={(e) => setFormData({ ...formData, warnings: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                  />
                  <Label htmlFor="featured">Featured Tutorial</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gold hover:bg-gold/90 text-white"
                  disabled={createTutorialMutation.isPending}
                >
                  {createTutorialMutation.isPending ? "Saving..." : "Save Tutorial"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorials.map((tutorial) => (
          <Card key={tutorial.id} className="overflow-hidden">
            <div className="aspect-video relative overflow-hidden">
              <img
                src={tutorial.thumbnail_url}
                alt={tutorial.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Video className="h-12 w-12 text-white" />
              </div>
              <div className="absolute top-2 right-2 space-x-2">
                {tutorial.is_featured && (
                  <Badge className="bg-gold text-white">Featured</Badge>
                )}
                {!tutorial.is_active && (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-2">{tutorial.title}</CardTitle>
              <div className="flex items-center justify-between text-sm text-warm-gray">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{tutorial.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{tutorial.views}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-warm-gray line-clamp-2 mb-3">
                {tutorial.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {tutorial.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {tutorial.difficulty}
                  </Badge>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenForm(tutorial)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(tutorial.id)}
                    disabled={deleteTutorialMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tutorials.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Upload className="h-12 w-12 text-warm-gray mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-deep-navy mb-2">No tutorials yet</h3>
            <p className="text-warm-gray mb-4">
              Start by uploading your first jewelry care tutorial
            </p>
            <Button onClick={() => handleOpenForm()} className="bg-gold hover:bg-gold/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Tutorial
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}