import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Mic, Square, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

interface UserProfile {
  age?: string;
  lifestyle?: string;
}

interface UserMemory {
  id: number;
  userId: string;
  age?: string | null;
  lifestyle?: string | null;
  preferences?: any | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

// Global chatbot state to persist across page navigation
let globalChatbotState = {
  isOpen: false,
  messages: [] as Message[],
  userProfile: { age: '', lifestyle: '' } as UserProfile,
  conversationStage: 'greeting' as 'greeting' | 'age' | 'lifestyle' | 'ai' | 'recommendations'
};

export default function EnhancedChatbot() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  // State management with persistence across navigation
  const [isOpen, setIsOpen] = useState(globalChatbotState.isOpen);
  const [messages, setMessages] = useState<Message[]>(globalChatbotState.messages);
  const [inputValue, setInputValue] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile>(globalChatbotState.userProfile);
  const [conversationStage, setConversationStage] = useState(globalChatbotState.conversationStage);
  
  // Voice chat states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [sessionId] = useState(() => Date.now().toString());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load user memory
  const { data: userMemory } = useQuery<UserMemory>({
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

  // Sync state with global state
  useEffect(() => {
    globalChatbotState = {
      isOpen,
      messages,
      userProfile,
      conversationStage
    };
  }, [isOpen, messages, userProfile, conversationStage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = useCallback((content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
    
    // Auto-play bot response if audio is enabled
    if (audioEnabled) {
      speakMessage(content);
    }
  }, [audioEnabled]);

  const addUserMessage = useCallback((content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  }, []);

  // Initialize chatbot when opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && isAuthenticated) {
      if (userMemory && userMemory.age) {
        const greeting = `Namaste ji! Welcome back. I remember you're ${userMemory.age} years old. How can I help you with jewelry today?`;
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
  }, [isOpen, isAuthenticated, userMemory, messages.length, addBotMessage]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        handleVoiceMessage(audioBlob);
        setRecordingTime(0);
      };

      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
      recorder.start();

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

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
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const handleVoiceMessage = async (audioBlob: Blob) => {
    if (!isAuthenticated) {
      addBotMessage("Please log in to use voice messages, ji.");
      return;
    }

    speechToTextMutation.mutate(audioBlob, {
      onSuccess: (data) => {
        if (data.text.trim()) {
          addUserMessage(data.text);
          handleAIResponse(data.text);
        }
      },
      onError: (error) => {
        console.error('Speech recognition error:', error);
        addBotMessage("I couldn't understand that. Please try speaking again or type your message, beta.");
      }
    });
  };

  // Text-to-speech function
  const speakMessage = async (text: string) => {
    if (!audioEnabled || isPlaying) return;
    
    try {
      setIsPlaying(true);
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
        source.onended = () => setIsPlaying(false);
        source.start();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const handleAIResponse = (userInput: string) => {
    if (conversationStage === 'ai' || conversationStage === 'recommendations') {
      chatMutation.mutate({ message: userInput, userProfile }, {
        onSuccess: (response: any) => {
          addBotMessage(response.response);
        },
        onError: (error) => {
          console.error('Chat error:', error);
          addBotMessage("I'm having trouble connecting right now. Please try again in a moment, ji.");
        }
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
            },
          });
          break;
      }
    }, 1000);
  };

  const handleSendMessage = () => {
    const userInput = inputValue.trim();
    if (!userInput) return;

    addUserMessage(userInput);
    setInputValue("");

    if (!isAuthenticated) {
      setTimeout(() => {
        addBotMessage("To provide personalized recommendations and save our conversation, please log in first, ji.");
      }, 500);
      return;
    }

    handleAIResponse(userInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Stop any ongoing recording
    if (isRecording) {
      stopRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 bg-gold hover:bg-gold/90 shadow-lg"
          size="lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-xl border-2 border-gold/20 max-h-[600px] flex flex-col">
        <CardHeader className="pb-2 bg-gradient-to-r from-gold/10 to-navy/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-navy flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gold" />
              Sunaarji - Jewelry Consultant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.type === 'user'
                      ? 'bg-gold text-white'
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {(chatMutation.isPending || speechToTextMutation.isPending) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gold rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs">
                      {speechToTextMutation.isPending ? 'Processing voice...' : 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice controls */}
          <div className="px-4 py-2 border-t bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`h-8 w-8 p-0 ${audioEnabled ? 'text-gold' : 'text-gray-400'}`}
                  title={audioEnabled ? 'Audio enabled' : 'Audio disabled'}
                >
                  {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                {isAuthenticated && (
                  <div className="flex items-center gap-2">
                    {isRecording && (
                      <span className="text-xs text-red-600 font-medium">
                        {formatTime(recordingTime)}
                      </span>
                    )}
                    <Button
                      variant={isRecording ? "destructive" : "ghost"}
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={speechToTextMutation.isPending}
                      className={`h-8 w-8 p-0 ${isRecording ? 'animate-pulse' : ''}`}
                      title={isRecording ? 'Stop recording' : 'Start voice message'}
                    >
                      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>
              {isPlaying && (
                <div className="flex items-center gap-1">
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-gold animate-pulse"></div>
                    <div className="w-1 h-4 bg-gold animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-2 bg-gold animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gold">Speaking...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isRecording ? "Recording..." : "Type your message..."}
                className="flex-1"
                disabled={isRecording}
              />
              <Button
                onClick={handleSendMessage}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}