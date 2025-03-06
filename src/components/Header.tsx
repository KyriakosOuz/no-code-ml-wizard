
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { Database, BrainCircuit, LogIn, User, LayoutDashboard } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center space-x-2">
            <BrainCircuit className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              ML Platform
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 ml-6">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            {user && (
              <Link to="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
                Dashboard
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
