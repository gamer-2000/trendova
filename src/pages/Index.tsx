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

  // ✅ NEW STATE
  const [showBuyModal, setShowBuyModal] = useState(false);

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

  const noCredits = true;
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

                {/* BUY BUTTON */}
                <button
                  onClick={() => setShowBuyModal(true)}
                  className="px-4 py-2 bg-purple-600 rounded-lg text-sm mt-2"
                >
                  Buy Credits
                </button>
              </div>
            )}

            {loading && <LoadingState />}

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

      {/* 💳 BUY MODAL */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#111] p-6 rounded-xl text-center w-[320px]">
            <h2 className="text-xl font-bold mb-2">Buy Credits</h2>

            <p>₹10 → 10 credits</p>
            <p>₹50 → 70 credits 🔥</p>
            <p>₹100 → 150 credits 🚀</p>

            <p className="mt-4 text-sm">Email:</p>
            <p className="font-bold">aaru44968@gmail.com</p>

            <a
              href="mailto:aaru44968@gmail.com?subject=Buy Credits&body=Hi, I want to buy credits.%0APlan:%0AMy account email:%0A"
              className="block mt-4 px-4 py-2 bg-purple-600 rounded-lg"
            >
              Email Now
            </a>

            <button
              onClick={() => setShowBuyModal(false)}
              className="mt-2 px-4 py-2 bg-gray-700 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
