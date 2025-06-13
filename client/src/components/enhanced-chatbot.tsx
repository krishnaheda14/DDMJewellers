import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
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

// Custom Rajasthani Man Icon Component
const RajasthaniManIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} fill="currentColor">
    {/* Turban */}
    <path d="M32 4c-12 0-18 8-18 16 0 4 2 8 6 10l2-2c2-2 4-2 6-2s4 0 6 2l2 2c4-2 6-6 6-10 0-8-6-16-10-16z" fill="#FF6B35"/>
    <path d="M26 12c0-2 2-4 6-4s6 2 6 4-2 4-6 4-6-2-6-4z" fill="#FFD700"/>
    
    {/* Face */}
    <circle cx="32" cy="28" r="8" fill="#D4A574"/>
    
    {/* Eyes */}
    <circle cx="29" cy="26" r="1.5" fill="#000"/>
    <circle cx="35" cy="26" r="1.5" fill="#000"/>
    
    {/* Mustache */}
    <path d="M28 30c2 0 4 1 4 2s-2 2-4 2-4-1-4-2 2-2 4-2z M36 30c2 0 4 1 4 2s-2 2-4 2-4-1-4-2 2-2 4-2z" fill="#8B4513"/>
    
    {/* Traditional shirt */}
    <path d="M20 36c0-4 4-8 12-8s12 4 12 8v20c0 4-4 8-12 8s-12-4-12-8V36z" fill="#FF4444"/>
    
    {/* Jewelry/Necklace */}
    <circle cx="32" cy="42" r="3" fill="none" stroke="#FFD700" strokeWidth="2"/>
    <circle cx="32" cy="42" r="1" fill="#FFD700"/>
    
    {/* Arms */}
    <path d="M20 40c-4 0-8 2-8 6v8c0 2 2 4 4 4s4-2 4-4v-8c0-2 0-4 0-6z" fill="#D4A574"/>
    <path d="M44 40c4 0 8 2 8 6v8c0 2-2 4-4 4s-4-2-4-4v-8c0-2 0-4 0-6z" fill="#D4A574"/>
    
    {/* Traditional decorative elements */}
    <circle cx="26" cy="45" r="1" fill="#FFD700"/>
    <circle cx="38" cy="45" r="1" fill="#FFD700"/>
  </svg>
);

let globalChatbotState = {
  isOpen: false,
  messages: [] as Message[],
  userProfile: { age: '', lifestyle: '' } as UserProfile,
  conversationStage: 'greeting' as 'greeting' | 'age' | 'lifestyle' | 'ai' | 'recommendations'
};

export default function EnhancedChatbot(): JSX.Element {
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
    mutationFn: async (profile: UserProfile) => {
      return apiRequest('/api/chatbot/memory', 'POST', profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chatbot/memory'] });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync with global state
  useEffect(() => {
    globalChatbotState.isOpen = isOpen;
    globalChatbotState.messages = messages;
    globalChatbotState.userProfile = userProfile;
    globalChatbotState.conversationStage = conversationStage;
  }, [isOpen, messages, userProfile, conversationStage]);

  // Initialize with user memory
  useEffect(() => {
    if (userMemory && messages.length === 0) {
      setUserProfile({
        age: userMemory.age || '',
        lifestyle: userMemory.lifestyle || ''
      });
      
      if (userMemory.age && userMemory.lifestyle) {
        setConversationStage('ai');
        addBotMessage("Namaste ji! I remember you. How can I help you with jewelry today?");
      } else {
        addInitialMessage();
      }
    } else if (!isAuthenticated && messages.length === 0) {
      addInitialMessage();
    }
  }, [userMemory, isAuthenticated]);

  const addInitialMessage = () => {
    if (messages.length === 0) {
      const welcomeMessage = isAuthenticated 
        ? "Namaste ji! I'm Sunaarji, your personal jewelry consultant. To give you the best recommendations, may I know your age range? (18-25, 26-35, 36-45, 45+)"
        : "Namaste ji! I'm Sunaarji from DDM Jewellers. I can help you with jewelry recommendations, current rates, and styling advice. Please log in for personalized service, or ask me anything about jewelry!";
      
      addBotMessage(welcomeMessage);
      
      if (isAuthenticated && !userMemory?.age) {
        setConversationStage('age');
      } else {
        setConversationStage('ai');
      }
    }
  };

  const addMessage = (type: 'user' | 'bot', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-play bot messages if audio is enabled
    if (type === 'bot' && audioEnabled) {
      speakMessage(content);
    }
  };

  const addBotMessage = (content: string) => addMessage('bot', content);
  const addUserMessage = (content: string) => addMessage('user', content);

  const handleAIResponse = async (message: string) => {
    try {
      if (!isAuthenticated) {
        addBotMessage("I can help with general jewelry questions, but please log in for personalized recommendations and to save our conversation, ji.");
        
        // Simple non-personalized responses
        const response = await chatMutation.mutateAsync({ message });
        addBotMessage(response.message);
        return;
      }

      // Handle conversation flow
      if (conversationStage === 'age') {
        setUserProfile(prev => ({ ...prev, age: message }));
        addBotMessage("Great! What's your lifestyle like? Are you more traditional, modern, or a mix of both?");
        setConversationStage('lifestyle');
        return;
      }

      if (conversationStage === 'lifestyle') {
        const updatedProfile = { ...userProfile, lifestyle: message };
        setUserProfile(updatedProfile);
        
        // Save to memory
        await saveMemoryMutation.mutateAsync(updatedProfile);
        
        addBotMessage("Perfect! Now I know you better. I'm here to help you with jewelry recommendations, current rates, and styling advice. What can I help you with today?");
        setConversationStage('ai');
        return;
      }

      // AI conversation
      const response = await chatMutation.mutateAsync({ message, userProfile });
      addBotMessage(response.message);
      
    } catch (error) {
      console.error('Error sending message:', error);
      addBotMessage("Sorry, I'm having trouble right now. Please try again!");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        handleVoiceMessage(audioBlob);
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

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-16 h-16 bg-gold hover:bg-gold/90 shadow-lg"
          size="lg"
        >
          <RajasthaniManIcon className="h-10 w-10" />
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
              <RajasthaniManIcon className="h-7 w-7 text-gold" />
              Sunaarji - Jewelry Consultant
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="h-8 w-8 p-0"
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
                    <span>Sunaarji is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about jewelry, rates, or styling..."
                className="flex-1"
              />
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant="outline"
                size="icon"
                className={isRecording ? 'bg-red-100 text-red-600' : ''}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button onClick={() => handleSendMessage()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {isRecording && (
              <div className="text-sm text-red-600 mt-2">
                Recording... {recordingTime}s
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}