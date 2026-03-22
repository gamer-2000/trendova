import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, Menu } from 'lucide-react';
import Header from '@/components/Header';
import GenerateInput from '@/components/GenerateInput';
import ContentToggle, { ContentTab } from '@/components/ContentToggle';
import ContentCard from '@/components/ContentCard';
import HistorySidebar from '@/components/HistorySidebar';
import LoadingState from '@/components/LoadingState';
import type { GeneratedContent } from '@/types/content';
import type { Json } from '@/integrations/supabase/types';

const Index: React.FC = () => {
  const { user } = useAuth();
  const { credits, deductCredits } = useCredits();
  const [activeTab, setActiveTab] = useState<ContentTab>('youtube');
  const [content, setContent] = useState<GeneratedContent>({});
  const [loading, setLoading] = useState(false);
  const [currentTopic, setCurrentTopic] = useState('');
  const [history, setHistory] = useState<{ id: string; topic: string; created_at: string }[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('generations')
      .select('id, topic, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setHistory(data);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const generate = async (topic: string, type?: ContentTab) => {
    const tab = type || activeTab;

    // Check credits
    const result = await deductCredits();
    if (!result.success) {
      toast.error(result.message);
      return;
    }

    setLoading(true);
    setCurrentTopic(topic);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { topic, type: tab },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newContent = { ...content, [tab]: data };
      setContent(newContent);

      // Save to history
      await supabase.from('generations').insert({
        user_id: user!.id,
        topic,
        content: newContent as unknown as Json,
      });
      fetchHistory();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = async (id: string) => {
    setSelectedHistoryId(id);
    const { data } = await supabase
      .from('generations')
      .select('topic, content')
      .eq('id', id)
      .single();
    if (data) {
      setCurrentTopic(data.topic);
      setContent(data.content as unknown as GeneratedContent);
    }
  };

  const copyAll = () => {
    const parts: string[] = [];
    const yt = content.youtube;
    const ig = content.instagram;
    const sh = content.shorts;

    if (yt) {
      parts.push('=== YOUTUBE ===');
      if (yt.titles) parts.push('TITLES:\n' + yt.titles.join('\n'));
      if (yt.script) parts.push(`SCRIPT:\nHook: ${yt.script.hook}\nIntro: ${yt.script.intro}\nMain: ${yt.script.mainContent}\nOutro: ${yt.script.outro}`);
      if (yt.seoDescription) parts.push('SEO DESCRIPTION:\n' + yt.seoDescription);
    }
    if (ig) {
      parts.push('=== INSTAGRAM ===');
      parts.push('CAPTION:\n' + ig.caption);
      parts.push('HASHTAGS:\n' + ig.hashtags.map(h => '#' + h).join(' '));
    }
    if (sh?.shortFormIdeas) {
      parts.push('=== SHORTS ===');
      sh.shortFormIdeas.forEach((idea, i) => {
        parts.push(`${i + 1}. ${idea.title}\n${idea.concept}\nHook: ${idea.hook}`);
      });
    }

    if (parts.length > 0) {
      navigator.clipboard.writeText(parts.join('\n\n'));
      toast.success('All content copied!');
    }
  };

  const noCredits = credits < 5;
  const hasContent = content.youtube || content.instagram || content.shorts;

  return (
    <div className="flex h-screen overflow-hidden">
      <HistorySidebar
        items={history}
        onSelect={handleSelectHistory}
        selectedId={selectedHistoryId}
        onRefresh={fetchHistory}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="w-4 h-4" />
              History
            </button>

            {/* Hero */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
                Generate <span className="gradient-text">Viral Content</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Enter a topic and get AI-powered content ideas for YouTube, Instagram, and Shorts
              </p>
            </div>

            {/* Input */}
            <GenerateInput
              onGenerate={(topic) => generate(topic)}
              disabled={noCredits || loading}
              disabledMessage={noCredits ? 'No Credits Left' : loading ? 'Generating...' : undefined}
            />

            {/* No credits message */}
            {noCredits && (
              <div className="text-center space-y-2 opacity-0 animate-fade-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <p className="text-sm text-muted-foreground">
                  You're out of credits for today. Come back tomorrow.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  More credits coming soon 👀
                </p>
              </div>
            )}

            {/* Toggle + Copy All */}
            {hasContent && !loading && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <ContentToggle active={activeTab} onChange={setActiveTab} />
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50 active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy All
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && <LoadingState />}

            {/* Results */}
            {!loading && activeTab === 'youtube' && content.youtube && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ContentCard
                  emoji="🎬"
                  title="Video Ideas"
                  content={content.youtube.videoIdeas.map((idea, i) => `${i + 1}. ${idea.title}\n   ${idea.description}`).join('\n\n')}
                  viralScore={Math.max(...content.youtube.videoIdeas.map(i => i.viralScore))}
                  isBest
                  delay={0}
                  onRegenerate={() => generate(currentTopic, 'youtube')}
                />
                <ContentCard
                  emoji="🧠"
                  title="Full Script"
                  content={`🪝 HOOK:\n${content.youtube.script.hook}\n\n📖 INTRO:\n${content.youtube.script.intro}\n\n📝 MAIN:\n${content.youtube.script.mainContent}\n\n👋 OUTRO:\n${content.youtube.script.outro}`}
                  delay={80}
                  onRegenerate={() => generate(currentTopic, 'youtube')}
                />
                <ContentCard
                  emoji="📝"
                  title="Title Options"
                  content={content.youtube.titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}
                  delay={160}
                  onRegenerate={() => generate(currentTopic, 'youtube')}
                />
                <ContentCard
                  emoji="🖼️"
                  title="Thumbnail Ideas"
                  content={content.youtube.thumbnailIdeas.map((t, i) => `${i + 1}. ${t}`).join('\n')}
                  delay={240}
                  onRegenerate={() => generate(currentTopic, 'youtube')}
                />
                <ContentCard
                  emoji="🔍"
                  title="SEO Description"
                  content={content.youtube.seoDescription}
                  delay={320}
                  onRegenerate={() => generate(currentTopic, 'youtube')}
                />
              </div>
            )}

            {!loading && activeTab === 'instagram' && content.instagram && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ContentCard
                  emoji="📱"
                  title="Instagram Caption"
                  content={content.instagram.caption}
                  delay={0}
                  onRegenerate={() => generate(currentTopic, 'instagram')}
                />
                <ContentCard
                  emoji="🔥"
                  title="Trending Hashtags"
                  content={content.instagram.hashtags.map(h => `#${h}`).join('  ')}
                  delay={80}
                  onRegenerate={() => generate(currentTopic, 'instagram')}
                />
              </div>
            )}

            {!loading && activeTab === 'shorts' && content.shorts && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.shorts.shortFormIdeas.map((idea, i) => (
                  <ContentCard
                    key={i}
                    emoji="⚡"
                    title={idea.title}
                    content={`${idea.concept}\n\n🪝 Hook: ${idea.hook}`}
                    viralScore={idea.viralScore}
                    isBest={idea.viralScore === Math.max(...content.shorts!.shortFormIdeas.map(s => s.viralScore))}
                    delay={i * 80}
                    onRegenerate={() => generate(currentTopic, 'shorts')}
                  />
                ))}
              </div>
            )}

            {/* Empty state when no content and not loading */}
            {!hasContent && !loading && (
              <div className="text-center py-16 opacity-0 animate-fade-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <div className="text-5xl mb-4">✨</div>
                <p className="text-muted-foreground text-sm">
                  Enter a topic above to generate viral content ideas
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
