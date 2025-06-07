import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Sparkles, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
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
}

export default function Chatbot() {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [conversationStage, setConversationStage] = useState<'greeting' | 'age' | 'lifestyle' | 'ai' | 'recommendations'>('greeting');
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
              )}
            </div>
            <div className="flex gap-2">
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