import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { Gem, Crown, Diamond, Sparkles } from "lucide-react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function DiamondTransition({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        exit={{ opacity: 0, scale: 1.1, rotateY: 15 }}
        transition={{ 
          duration: 0.6, 
          ease: [0.22, 1, 0.36, 1],
          scale: { type: "spring", stiffness: 300, damping: 30 }
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function GoldShimmerTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden"
    >
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent"
        style={{ transform: "skewX(-20deg)" }}
      />
      {children}
    </motion.div>
  );
}

export function JewelryBoxTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -90, transformOrigin: "top" }}
      animate={{ opacity: 1, rotateX: 0 }}
      exit={{ opacity: 0, rotateX: 90, transformOrigin: "bottom" }}
      transition={{ 
        duration: 0.8, 
        ease: [0.25, 0.46, 0.45, 0.94],
        opacity: { duration: 0.4 }
      }}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </motion.div>
  );
}

// Loading overlay with jewelry animations
export function JewelryLoadingOverlay({ isVisible, message }: { isVisible: boolean; message?: string }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="text-center">
            {/* Animated jewelry icons */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Gem className="w-8 h-8 text-gold absolute top-0 left-1/2 transform -translate-x-1/2" />
                <Crown className="w-8 h-8 text-gold absolute right-0 top-1/2 transform -translate-y-1/2" />
                <Diamond className="w-8 h-8 text-gold absolute bottom-0 left-1/2 transform -translate-x-1/2" />
                <Sparkles className="w-8 h-8 text-gold absolute left-0 top-1/2 transform -translate-y-1/2" />
              </motion.div>
              
              {/* Center gem */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Gem className="w-12 h-12 text-deep-navy" />
              </motion.div>
            </div>
            
            {/* Loading text */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-deep-navy mb-4"
            >
              DDM Jewellers
            </motion.h2>
            
            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-muted-foreground"
              >
                {message}
              </motion.p>
            )}
            
            {/* Animated dots */}
            <div className="flex justify-center space-x-2 mt-6">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                  className="w-2 h-2 bg-gold rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Staggered animation for lists
export function StaggeredList({ children, className = "" }: { children: ReactNode[]; className?: string }) {
  return (
    <motion.div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            delay: index * 0.1,
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Card reveal animation
export function CardReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={{ 
        y: -5,
        transition: { duration: 0.2 }
      }}
    >
      {children}
    </motion.div>
  );
}