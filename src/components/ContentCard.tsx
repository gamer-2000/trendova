import React from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ContentCardProps {
  emoji: string;
  title: string;
  content: string;
  viralScore?: number;
  isBest?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  delay?: number;
}

const ContentCard: React.FC<ContentCardProps> = ({
  emoji,
  title,
  content,
  viralScore,
  isBest,
  onRegenerate,
  isRegenerating,
  delay = 0,
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  return (
    <div
      className={`glass-card rounded-2xl p-5 opacity-0 animate-fade-up ${isBest ? 'gradient-border' : ''}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        {viralScore !== undefined && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            viralScore >= 80 
              ? 'bg-primary/20 text-primary' 
              : viralScore >= 60 
              ? 'bg-warning/20 text-warning' 
              : 'bg-muted text-muted-foreground'
          }`}>
            🔥 {viralScore}/100
          </span>
        )}
      </div>

      <div className="text-sm text-secondary-foreground leading-relaxed whitespace-pre-wrap mb-4 max-h-64 overflow-y-auto scroll-fade">
        {content}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50 active:scale-95"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy
        </button>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
};

export default ContentCard;
