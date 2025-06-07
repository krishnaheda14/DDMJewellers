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
      return await apiRequest('/api/chatbot/chat', 'POST', { message, userProfile });
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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    const userInput = inputValue.trim();
    setInputValue("");

    setTimeout(() => {
      switch (conversationStage) {
        case 'age':
          setUserProfile(prev => ({ ...prev, age: userInput }));
          addBotMessage("Thank you! Now, can you describe your day-to-day life? Tell me about your work, social activities, or any special occasions you attend regularly, ji.");
          setConversationStage('lifestyle');
          break;

        case 'lifestyle':
          setUserProfile(prev => ({ ...prev, lifestyle: userInput }));
          const recommendations = getJewelryRecommendations(userProfile.age || "", userInput);
          addBotMessage(recommendations);
          setConversationStage('recommendations');
          setTimeout(() => {
            addBotMessage("Would you like more specific advice about any particular type of jewelry, or do you have questions about our collection? I'm here to help, baisaheb!");
          }, 2000);
          break;

        case 'recommendations':
          // Handle follow-up questions
          const input = userInput.toLowerCase();
          let response = "";

          if (input.includes('ring')) {
            response = "Ah, rings! For daily wear, choose comfortable widths. Traditional women love gold bands, while modern tastes prefer silver or rose gold. For special occasions, consider our gemstone rings - they add beautiful color to any outfit, ji!";
          } else if (input.includes('necklace') || input.includes('chain')) {
            response = "Necklaces are so versatile, beta! A 16-18 inch chain sits beautifully at the collarbone. For layering, try different lengths. Gold chains are timeless, silver is trendy. Remember - thicker chains make a statement, delicate ones are for everyday elegance.";
          } else if (input.includes('earring')) {
            response = "Earrings frame your face so beautifully! For daily wear, studs or small hoops are perfect. For special occasions, try our jhumkas or chandbali designs. If you have multiple piercings, consider mixing sizes - small studs with one statement piece works wonderfully!";
          } else if (input.includes('bracelet') || input.includes('bangle')) {
            response = "Bracelets and bangles add such grace to your hands! Traditional gold bangles are always stunning. For modern looks, try tennis bracelets or charm bracelets. Stack them for a trendy look, but keep it comfortable for daily activities, baisaheb!";
          } else if (input.includes('price') || input.includes('budget') || input.includes('cost')) {
            response = "I understand budget is important, ji! Start with silver-plated pieces for everyday wear - they're affordable and beautiful. Invest in one good gold piece gradually. Remember, good jewelry lasts generations, so consider it an investment in your elegance!";
          } else if (input.includes('gift') || input.includes('someone else')) {
            response = "Gifting jewelry is so thoughtful! For someone special, earrings are always safe - everyone can wear them. For closer relationships, consider a pendant with meaning. Traditional families appreciate gold, modern tastes lean toward silver. When in doubt, a classic design never fails, beta!";
          } else if (input.includes('care') || input.includes('maintenance') || input.includes('clean')) {
            response = "Taking care of jewelry is so important! Clean silver with a soft cloth regularly. Store pieces separately to avoid scratches. For gold, warm soapy water works well. Remove jewelry before swimming or exercising. With proper care, your beautiful pieces will last lifetimes, ji!";
          } else {
            response = "That's a wonderful question! Based on what you've told me about your lifestyle, I'd say focus on pieces that make you feel confident and comfortable. Remember, the best jewelry is what makes YOU smile when you wear it. Would you like to explore our collection that matches your style, beta?";
          }

          addBotMessage(response);
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
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                size="sm"
                className="bg-gold hover:bg-gold/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}