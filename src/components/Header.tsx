import React from 'react';
import { useCredits } from '@/contexts/CreditsContext';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { credits, maxCredits, showDeduction } = useCredits();
  const percentage = (credits / maxCredits) * 100;
  const isLow = credits < 10;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">
            <span className="gradient-text">ViralGen</span>
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="btn-glow px-4 py-2 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-sm font-medium flex items-center gap-2 hover:from-primary/30 hover:to-accent/30 transition-all">
                <Crown className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">Upgrade to Pro</span>
                <span className="sm:hidden">Pro</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming soon 🚀</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-3 relative">
            <div className="flex items-center gap-2 text-sm">
              <Zap className={`w-4 h-4 ${isLow ? 'text-warning' : 'text-primary'}`} />
              <span className={`font-semibold tabular-nums ${isLow ? 'text-warning' : ''}`}>
                {credits}
              </span>
              <span className="text-muted-foreground">/ {maxCredits}</span>
            </div>
            <div className="credit-bar w-20 h-1.5 hidden sm:block">
              <div
                className={`credit-bar-fill h-full ${isLow ? '!bg-warning' : ''}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {showDeduction && (
              <span className="absolute -top-4 right-0 text-xs font-bold text-destructive animate-credit-deduct">
                -5
              </span>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-[120px]">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
