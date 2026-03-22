import React from 'react';

type ContentTab = 'youtube' | 'instagram' | 'shorts';

interface ContentToggleProps {
  active: ContentTab;
  onChange: (tab: ContentTab) => void;
}

const tabs: { key: ContentTab; label: string; emoji: string }[] = [
  { key: 'youtube', label: 'YouTube', emoji: '🎬' },
  { key: 'instagram', label: 'Instagram', emoji: '📱' },
  { key: 'shorts', label: 'Shorts', emoji: '⚡' },
];

const ContentToggle: React.FC<ContentToggleProps> = ({ active, onChange }) => {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border/50 w-fit mx-auto">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
            active === tab.key
              ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>{tab.emoji}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ContentToggle;
export type { ContentTab };
