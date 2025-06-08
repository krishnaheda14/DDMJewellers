import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

interface PageNavigationProps {
  className?: string;
  showBorder?: boolean;
}

export default function PageNavigation({ className = "", showBorder = true }: PageNavigationProps) {
  return (
    <div className={`bg-white ${showBorder ? 'border-b' : ''} py-4 ${className}`}>
      <div className="container-fluid">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
          >
            <Home className="h-4 w-4" />
            DDM Jewellers
          </Button>
        </div>
      </div>
    </div>
  );
}