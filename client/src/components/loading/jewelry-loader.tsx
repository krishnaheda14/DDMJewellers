import { motion } from "framer-motion";
import { Gem, Sparkles, Star } from "lucide-react";

interface JewelryLoaderProps {
  variant?: "diamond" | "gem" | "sparkle" | "necklace";
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

export function JewelryLoader({ 
  variant = "diamond", 
  size = "md", 
  text,
  className = "" 
}: JewelryLoaderProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {variant === "diamond" && <DiamondLoader size={sizeClasses[size]} />}
      {variant === "gem" && <GemLoader size={sizeClasses[size]} />}
      {variant === "sparkle" && <SparkleLoader size={sizeClasses[size]} />}
      {variant === "necklace" && <NecklaceLoader size={sizeClasses[size]} />}
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`text-deep-navy font-medium ${textSizes[size]} text-center`}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

function DiamondLoader({ size }: { size: string }) {
  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 1.5, repeat: Infinity }
        }}
        className="text-gold"
      >
        <Gem className="w-full h-full" />
      </motion.div>
      
      {/* Sparkle effects */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            rotate: i * 60
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3
          }}
          style={{
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-24px)`
          }}
        >
          <Star className="w-2 h-2 text-gold" />
        </motion.div>
      ))}
    </div>
  );
}

function GemLoader({ size }: { size: string }) {
  const gems = [
    { color: "text-red-500", delay: 0 },
    { color: "text-blue-500", delay: 0.2 },
    { color: "text-green-500", delay: 0.4 },
    { color: "text-purple-500", delay: 0.6 },
    { color: "text-gold", delay: 0.8 }
  ];

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      {gems.map((gem, index) => (
        <motion.div
          key={index}
          className={`absolute ${gem.color}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: gem.delay
          }}
          style={{
            left: `${20 + index * 15}%`,
            top: "50%"
          }}
        >
          <Gem className="w-4 h-4" />
        </motion.div>
      ))}
    </div>
  );
}

function SparkleLoader({ size }: { size: string }) {
  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-gold"
            style={{
              transform: `rotate(${i * 45}deg) translateY(-16px)`,
              transformOrigin: "center 16px"
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.125
            }}
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function NecklaceLoader({ size }: { size: string }) {
  const beads = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <div className="relative w-full h-full">
        {beads.map((bead, index) => {
          const angle = (index * 30) * (Math.PI / 180);
          const radius = 20;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={bead}
              className="absolute w-2 h-2 bg-gold rounded-full"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`
              }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.1
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Pre-configured loaders for common use cases
export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <JewelryLoader 
        variant="diamond" 
        size="xl" 
        text="Loading DDM Jewellers..." 
      />
    </div>
  );
}

export function ProductLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <JewelryLoader 
        variant="gem" 
        size="lg" 
        text="Discovering precious jewelry..." 
      />
    </div>
  );
}

export function CartLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <JewelryLoader 
        variant="sparkle" 
        size="md" 
        text="Preparing your collection..." 
      />
    </div>
  );
}

export function SubmissionLoader() {
  return (
    <div className="flex items-center justify-center py-6">
      <JewelryLoader 
        variant="necklace" 
        size="md" 
        text="Processing..." 
      />
    </div>
  );
}