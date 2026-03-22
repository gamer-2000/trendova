import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface GenerateInputProps {
  onGenerate: (topic: string) => void;
  disabled: boolean;
  disabledMessage?: string;
}

const GenerateInput: React.FC<GenerateInputProps> = ({ onGenerate, disabled, disabledMessage }) => {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !disabled) {
      onGenerate(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="glass-card rounded-2xl p-2 gradient-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Enter a topic or niche... e.g. 'AI productivity tools'"
            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/50"
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || !topic.trim()}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
              disabled
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-accent text-primary-foreground btn-glow'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {disabledMessage || 'Generate'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default GenerateInput;
