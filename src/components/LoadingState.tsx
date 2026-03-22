import React, { useState, useEffect } from 'react';

const loadingMessages = [
  'Finding viral ideas...',
  'Analyzing trends...',
  'Generating content...',
  'Crafting the perfect hook...',
  'Optimizing for engagement...',
];

const LoadingState: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
      </div>
      <p className="text-sm text-muted-foreground animate-fade-in" key={messageIndex}>
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingState;
