
import React from 'react';
import { cn } from "@/lib/utils";
import { BrainCircuit } from "lucide-react";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn("w-full px-4 py-4 border-b", className)}>
      <div className="container max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
            <BrainCircuit className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight">NoCode ML</h1>
            <p className="text-xs text-muted-foreground">Automated Machine Learning Platform</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
