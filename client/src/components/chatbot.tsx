import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX, Camera, Upload, Shirt, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface UserProfile {
  age?: string;
  lifestyle?: string;
  faceShape?: string;
  skinTone?: string;
  style?: string;
  occasions?: string[];
}

export default function Chatbot() {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [conversationStage, setConversationStage] = useState<'greeting' | 'age' | 'lifestyle' | 'ai' | 'recommendations' | 'face_analysis' | 'style_consultation' | 'occasion_selection'>('greeting');
  const [analysisMode, setAnalysisMode] = useState<'face' | 'outfit' | 'occasion' | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sessionId] = useState(() => Date.now().toString());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user memory
  const { data: userMemory } = useQuery({
    queryKey: ['/api/chatbot/memory'],
    enabled: isAuthenticated,
  });

  // Chat mutation with AI
  const chatMutation = useMutation({
    mutationFn: async ({ message, userProfile }: { message: string; userProfile?: UserProfile }) => {
      const response = await apiRequest('/api/chatbot/chat', 'POST', { message, userProfile });
      return response;
    },
  });

  // Face shape analysis mutation
  const faceAnalysisMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest('/api/chatbot/analyze-face', 'POST', { image: imageData });
      return response;
    },
  });

  // Fashion styling mutation
  const fashionAnalysisMutation = useMutation({
    mutationFn: async ({ imageData, occasion }: { imageData: string; occasion?: string }) => {
      const response = await apiRequest('/api/chatbot/analyze-outfit', 'POST', { image: imageData, occasion });
      return response;
    },
  });

  // Occasion-based recommendations mutation
  const occasionRecommendationMutation = useMutation({
    mutationFn: async ({ occasion, style, budget }: { occasion: string; style?: string; budget?: string }) => {
      const response = await apiRequest('/api/chatbot/recommend-occasion', 'POST', { occasion, style, budget });
      return response;
    },
  });

  // Speech-to-text mutation
  const speechToTextMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/chatbot/speech-to-text', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      return response.json();
    },
  });

  // Save memory mutation
  const saveMemoryMutation = useMutation({
    mutationFn: async (memory: UserProfile) => {
      return await apiRequest('/api/chatbot/memory', 'POST', memory);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && isAuthenticated) {
      // Load user memory and personalize greeting
      if (userMemory) {
        const greeting = userMemory.age 
          ? `Namaste ji! Welcome back. I remember you're ${userMemory.age} years old. How can I help you with jewelry today?`
          : "Namaste! I'm Sunaarji, your personal jewelry consultant. I remember our previous conversations. How may I assist you today, beta?";
        addBotMessage(greeting);
        setConversationStage('ai');
        setUserProfile({ age: userMemory.age || '', lifestyle: userMemory.lifestyle || '' });
      } else {
        addBotMessage("Namaste! I'm Sunaarji, your personal jewelry consultant. May I ask your age, beta?");
        setConversationStage('age');
      }
    } else if (isOpen && messages.length === 0 && !isAuthenticated) {
      addBotMessage("Namaste! I'm Sunaarji, your personal jewelry consultant. To provide personalized recommendations and remember our conversations, please log in first, ji.");
    }
  }, [isOpen, isAuthenticated, userMemory]);

  const addBotMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const getJewelryRecommendations = (age: string, lifestyle: string): string => {
    const ageNum = parseInt(age);
    const lifestyleLower = lifestyle.toLowerCase();

    let recommendations = "";

    // Base recommendations by age
    if (ageNum <= 25) {
      recommendations += "For your age, I'd suggest starting with versatile pieces that can transition from day to night. ";
    } else if (ageNum <= 40) {
      recommendations += "At your stage in life, investing in quality statement pieces alongside everyday essentials works beautifully. ";
    } else {
      recommendations += "With your experience and elegance, you can carry both traditional and contemporary pieces with grace. ";
    }

    // Lifestyle-specific recommendations
    if (lifestyleLower.includes('office') || lifestyleLower.includes('work') || lifestyleLower.includes('professional')) {
      recommendations += "\n\nFor office wear, ji:\n• Lightweight silver or gold studs - they won't distract but add sophistication\n• A delicate chain with a small pendant\n• A simple bracelet or watch\n• Avoid heavy earrings that might be uncomfortable during long work hours";
    }

    if (lifestyleLower.includes('traditional') || lifestyleLower.includes('festival') || lifestyleLower.includes('wedding')) {
      recommendations += "\n\nFor traditional occasions, baisaheb:\n• A beautiful gold-plated choker with matching bangles\n• Jhumkas or chandbali earrings for that ethnic touch\n• A statement necklace for special celebrations\n• Don't forget a nose ring if it suits your style!";
    }

    if (lifestyleLower.includes('travel') || lifestyleLower.includes('frequent')) {
      recommendations += "\n\nFor your travels, beta:\n• Minimal and durable pieces that won't get damaged\n• Silver jewelry - easier to maintain than gold\n• Avoid precious stones for everyday travel\n• Consider a versatile pendant that works with any outfit";
    }

    if (lifestyleLower.includes('party') || lifestyleLower.includes('social') || lifestyleLower.includes('events')) {
      recommendations += "\n\nFor parties and social events:\n• Statement earrings that catch the light beautifully\n• A bold necklace or layered chains\n• Cocktail rings for that glamorous touch\n• Remember - let one piece be the star, don't overdo it!";
    }

    if (lifestyleLower.includes('casual') || lifestyleLower.includes('everyday')) {
      recommendations += "\n\nFor everyday casual wear:\n• Simple hoops or studs that you can forget you're wearing\n• A delicate chain you never need to remove\n• A watch that doubles as jewelry\n• Small rings that won't get in the way of daily tasks";
    }

    if (lifestyleLower.includes('sport') || lifestyleLower.includes('gym') || lifestyleLower.includes('active')) {
      recommendations += "\n\nFor your active lifestyle:\n• Silicone or fabric-based jewelry that won't break\n• Avoid long chains or dangly earrings\n• Consider a sports watch as your main accessory\n• Save the beautiful pieces for after your workout!";
    }

    // General closing advice
    recommendations += "\n\nRemember beta, good jewelry should make YOU shine, not overshadow your natural beauty. Start with basics and build your collection slowly. Quality over quantity, always! 💫";

    return recommendations;
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        speechToTextMutation.mutate(audioBlob, {
          onSuccess: (data) => {
            if (data.text.trim()) {
              setInputValue(data.text);
              handleSendMessage(data.text);
            }
          },
        });
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
      recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  // Text-to-speech function
  const speakMessage = async (text: string) => {
    if (!audioEnabled) return;
    
    try {
      const response = await fetch('/api/chatbot/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const decodedData = await audioContext.decodeAudioData(audioBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = decodedData;
        source.connect(audioContext.destination);
        source.start();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const userInput = messageText || inputValue.trim();
    if (!userInput) return;

    addUserMessage(userInput);
    setInputValue("");

    if (!isAuthenticated) {
      setTimeout(() => {
        addBotMessage("To provide personalized recommendations and save our conversation, please log in first, ji.");
      }, 500);
      return;
    }

    // Use AI for all conversations after initial setup
    if (conversationStage === 'ai' || conversationStage === 'recommendations') {
      chatMutation.mutate({ message: userInput, userProfile }, {
        onSuccess: (response: any) => {
          addBotMessage(response.response);
          if (audioEnabled) {
            speakMessage(response.response);
          }
        },
      });
      return;
    }

    // Handle initial conversation stages
    setTimeout(async () => {
      switch (conversationStage) {
        case 'age':
          const newProfile = { ...userProfile, age: userInput };
          setUserProfile(newProfile);
          addBotMessage("Thank you! Now, can you describe your day-to-day life? Tell me about your work, social activities, or any special occasions you attend regularly, ji.");
          setConversationStage('lifestyle');
          break;

        case 'lifestyle':
          const updatedProfile = { ...userProfile, lifestyle: userInput };
          setUserProfile(updatedProfile);
          
          // Save user memory
          await saveMemoryMutation.mutateAsync(updatedProfile);
          
          // Switch to AI mode
          setConversationStage('ai');
          
          // Get AI response
          chatMutation.mutate({ 
            message: `Based on my age (${updatedProfile.age}) and lifestyle (${updatedProfile.lifestyle}), what jewelry would you recommend?`,
            userProfile: updatedProfile 
          }, {
            onSuccess: (response: any) => {
              addBotMessage(response.response);
              if (audioEnabled) {
                speakMessage(response.response);
              }
            },
          });
          break;
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      addBotMessage("I'm sorry beta, I couldn't access your camera. Please ensure camera permissions are enabled and try uploading an image instead.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setUploadedImage(imageData);
      stopCamera();
      
      if (analysisMode === 'face') {
        analyzeFaceShape(imageData);
      } else if (analysisMode === 'outfit') {
        analyzeOutfit(imageData);
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        
        if (analysisMode === 'face') {
          analyzeFaceShape(imageData);
        } else if (analysisMode === 'outfit') {
          analyzeOutfit(imageData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFaceShape = (imageData: string) => {
    addBotMessage("Let me analyze your face shape to suggest the perfect jewelry for you, beta...");
    
    faceAnalysisMutation.mutate(imageData, {
      onSuccess: (response: any) => {
        const faceShape = response.faceShape;
        const recommendations = response.recommendations;
        
        setUserProfile(prev => ({ ...prev, faceShape }));
        
        addBotMessage(`Based on your beautiful ${faceShape} face shape, here are my personalized recommendations: ${recommendations}`);
        
        if (audioEnabled) {
          speakMessage(`I can see you have a lovely ${faceShape} face shape. ${recommendations}`);
        }
      },
      onError: () => {
        addBotMessage("I'm having trouble analyzing the image right now, beta. Please try again or describe your face shape to me.");
      }
    });
  };

  const analyzeOutfit = (imageData: string, occasion?: string) => {
    addBotMessage("Let me analyze your outfit and suggest jewelry that would complement it perfectly...");
    
    fashionAnalysisMutation.mutate({ imageData, occasion }, {
      onSuccess: (response: any) => {
        const suggestions = response.suggestions;
        const styleAnalysis = response.styleAnalysis;
        
        addBotMessage(`Looking at your outfit, I can see it has a ${styleAnalysis} style. Here are my jewelry suggestions: ${suggestions}`);
        
        if (audioEnabled) {
          speakMessage(`Your outfit has a lovely ${styleAnalysis} style. ${suggestions}`);
        }
      },
      onError: () => {
        addBotMessage("I'm having trouble analyzing your outfit right now, beta. Please describe your outfit to me and I'll suggest jewelry accordingly.");
      }
    });
  };

  const getOccasionRecommendations = (occasion: string, style?: string, budget?: string) => {
    addBotMessage(`Let me suggest the perfect jewelry collection for your ${occasion}...`);
    
    occasionRecommendationMutation.mutate({ occasion, style, budget }, {
      onSuccess: (response: any) => {
        const recommendations = response.recommendations;
        const products = response.products;
        
        addBotMessage(`For your ${occasion}, I recommend: ${recommendations}`);
        
        if (products && products.length > 0) {
          addBotMessage("I've found some beautiful pieces from our collection that would be perfect for this occasion. Let me show you:");
          // Display product recommendations
        }
        
        if (audioEnabled) {
          speakMessage(`For your ${occasion}, ${recommendations}`);
        }
      },
      onError: () => {
        addBotMessage("Let me suggest some general jewelry options for your occasion based on my expertise.");
      }
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gold hover:bg-gold/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <div className="absolute -top-12 right-0 bg-black text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap">
          Chat with Sunaarji! 💍
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 h-96 shadow-2xl border-2 border-gold/20">
        <CardHeader className="bg-gradient-to-r from-gold to-gold/80 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Sunaarji</CardTitle>
                <p className="text-sm text-white/90">Jewelry Consultant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-80">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-gold text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.content.split('\n').map((line, index) => (
                    <div key={index} className={line.startsWith('•') ? 'ml-2' : ''}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className={`${audioEnabled ? 'text-gold' : 'text-gray-400'}`}
                title={audioEnabled ? 'Audio enabled' : 'Audio disabled'}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              {isAuthenticated && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={speechToTextMutation.isPending}
                    className={`${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}
                    title={isRecording ? 'Stop recording' : 'Start voice message'}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  
                  {/* Face Analysis Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAnalysisMode('face');
                      startCamera();
                    }}
                    className="text-purple-600 hover:text-purple-700"
                    title="Face shape analysis"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  
                  {/* Fashion Styling Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAnalysisMode('outfit');
                      startCamera();
                    }}
                    className="text-pink-600 hover:text-pink-700"
                    title="Outfit styling analysis"
                  >
                    <Shirt className="h-4 w-4" />
                  </Button>
                  
                  {/* Occasion Recommendations Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAnalysisMode('occasion');
                      addBotMessage("Tell me about your upcoming occasion, beta! Is it a wedding, festival, office party, or something special?");
                    }}
                    className="text-emerald-600 hover:text-emerald-700"
                    title="Occasion-based recommendations"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  
                  {/* Image Upload Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700"
                    title="Upload image for analysis"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
            
            {/* Camera View */}
            {showCamera && (
              <div className="mb-3 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-32 object-cover rounded-lg bg-black"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={captureImage}
                    className="bg-gold hover:bg-gold/90 text-white"
                  >
                    Capture
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={stopCamera}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {/* Uploaded Image Preview */}
            {uploadedImage && (
              <div className="mb-3">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded for analysis" 
                  className="w-full h-32 object-cover rounded-lg"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !isAuthenticated 
                    ? "Please log in to chat..." 
                    : isRecording 
                      ? "Recording..." 
                      : "Type your message..."
                }
                disabled={!isAuthenticated || isRecording || chatMutation.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!isAuthenticated || !inputValue.trim() || chatMutation.isPending}
                className="bg-gold hover:bg-gold/90 text-white"
              >
                {chatMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {/* Loading States */}
            {(faceAnalysisMutation.isPending || fashionAnalysisMutation.isPending || occasionRecommendationMutation.isPending) && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gold"></div>
                <span>
                  {faceAnalysisMutation.isPending && "Analyzing your beautiful features..."}
                  {fashionAnalysisMutation.isPending && "Studying your style..."}
                  {occasionRecommendationMutation.isPending && "Finding perfect jewelry for your occasion..."}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "Recording..." : "Type your message or click mic to speak..."}
                className="flex-1"
                disabled={isRecording}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || chatMutation.isPending || isRecording}
                size="sm"
                className="bg-gold hover:bg-gold/90"
              >
                {chatMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {speechToTextMutation.isPending && (
              <div className="text-xs text-gray-500 mt-1">Processing voice...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}