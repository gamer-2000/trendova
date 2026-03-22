import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface CreditsContextType {
  credits: number;
  maxCredits: number;
  generationsToday: number;
  loading: boolean;
  deductCredits: () => Promise<{ success: boolean; message: string }>;
  refreshCredits: () => Promise<void>;
  showDeduction: boolean;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(50);
  const [generationsToday, setGenerationsToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeduction, setShowDeduction] = useState(false);
  const maxCredits = 50;

  const refreshCredits = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('credits_remaining, generations_today, credits_reset_at')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      // Check if reset is needed client-side for display
      const resetAt = new Date(data.credits_reset_at);
      if (resetAt <= new Date()) {
        setCredits(50);
        setGenerationsToday(0);
      } else {
        setCredits(data.credits_remaining);
        setGenerationsToday(data.generations_today);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const deductCredits = async (): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'Not authenticated' };

    const { data, error } = await supabase.rpc('deduct_credits', { p_user_id: user.id });

    if (error) return { success: false, message: error.message };

    const result = data?.[0];
    if (!result) return { success: false, message: 'Unknown error' };

    if (result.success) {
      setShowDeduction(true);
      setTimeout(() => setShowDeduction(false), 800);
      setCredits(result.credits_left);
      setGenerationsToday(prev => prev + 1);
    }

    return { success: result.success, message: result.message };
  };

  return (
    <CreditsContext.Provider value={{ credits, maxCredits, generationsToday, loading, deductCredits, refreshCredits, showDeduction }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) throw new Error('useCredits must be used within CreditsProvider');
  return context;
};
