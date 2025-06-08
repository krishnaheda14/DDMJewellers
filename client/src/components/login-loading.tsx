import { useEffect, useState } from "react";
import { Crown, Gem, Building } from "lucide-react";

interface LoginLoadingProps {
  userRole: "admin" | "customer" | "wholesaler";
  userName?: string;
}

export function LoginLoading({ userRole, userName }: LoginLoadingProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getRoleConfig = () => {
    switch (userRole) {
      case "admin":
        return {
          icon: Crown,
          color: "text-amber-600",
          bgGradient: "from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800",
          message: "Accessing Admin Dashboard",
          destination: "Admin Portal"
        };
      case "customer":
        return {
          icon: Gem,
          color: "text-rose-600",
          bgGradient: "from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800",
          message: "Loading Your Dashboard",
          destination: "Customer Portal"
        };
      case "wholesaler":
        return {
          icon: Building,
          color: "text-blue-600",
          bgGradient: "from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800",
          message: "Accessing Wholesaler Portal",
          destination: "Business Dashboard"
        };
    }
  };

  const config = getRoleConfig();
  const Icon = config.icon;

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${config.bgGradient} flex items-center justify-center z-50`}>
      <div className="text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <Icon className={`h-16 w-16 ${config.color} mx-auto animate-pulse`} />
          <div className={`absolute inset-0 h-16 w-16 ${config.color} mx-auto animate-ping opacity-20`}>
            <Icon className="h-16 w-16" />
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back{userName ? `, ${userName}` : ""}!
          </h2>
          <p className={`text-lg ${config.color} font-medium`}>
            {config.message}{dots}
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2 mb-6">
          <div className={`h-3 w-3 ${config.color.replace('text-', 'bg-')} rounded-full animate-bounce`} 
               style={{ animationDelay: '0ms' }}></div>
          <div className={`h-3 w-3 ${config.color.replace('text-', 'bg-')} rounded-full animate-bounce`} 
               style={{ animationDelay: '150ms' }}></div>
          <div className={`h-3 w-3 ${config.color.replace('text-', 'bg-')} rounded-full animate-bounce`} 
               style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-auto">
          <div className={`${config.color.replace('text-', 'bg-')} h-2 rounded-full animate-pulse`} 
               style={{ width: '70%', animation: 'loading 2s ease-in-out infinite' }}></div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
          Redirecting to {config.destination}...
        </p>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}