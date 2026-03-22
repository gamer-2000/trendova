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

  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);

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

      console.log("Generated content:", data);

      const newContent = { ...content, [tab]: data };
      setContent(newContent);

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

            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Menu className="w-4 h-4" />
              History
            </button>

            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-extrabold">
                Generate <span className="gradient-text">Viral Content</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Enter a topic and get AI-powered content ideas
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowDonateModal(true)}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 rounded-lg text-sm"
              >
                Donate ❤️
              </button>
            </div>

            <GenerateInput
              onGenerate={(topic) => generate(topic)}
              disabled={noCredits || loading}
              disabledMessage={noCredits ? 'No Credits Left' : loading ? 'Generating...' : undefined}
            />

            {noCredits && (
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  You're out of credits.
                </p>

                <button
                  onClick={() => setShowBuyModal(true)}
                  className="px-4 py-2 bg-purple-600 rounded-lg text-sm"
                >
                  Buy Credits
                </button>
              </div>
            )}

            {loading && <LoadingState />}

            {/* ✅ FIXED: CONTENT DISPLAY */}
            {hasContent && !loading && (
              <div className="space-y-6">
                <ContentToggle activeTab={activeTab} onChange={setActiveTab} />

                {activeTab === "youtube" && content.youtube && (
                  <ContentCard title="YouTube Content" data={content.youtube} />
                )}

                {activeTab === "instagram" && content.instagram && (
                  <ContentCard title="Instagram Content" data={content.instagram} />
                )}

                {activeTab === "shorts" && content.shorts && (
                  <ContentCard title="Shorts Ideas" data={content.shorts} />
                )}

                <button
                  onClick={copyAll}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
              </div>
            )}

            {!hasContent && !loading && (
              <div className="text-center py-16">
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
