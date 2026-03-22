-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits_remaining INTEGER NOT NULL DEFAULT 50,
  credits_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + interval '24 hours',
  generations_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, credits_remaining, credits_reset_at)
  VALUES (NEW.id, NEW.email, 50, now() + interval '24 hours');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generation history table
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations" ON public.generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON public.generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON public.generations
  FOR DELETE USING (auth.uid() = user_id);

-- Function to deduct credits and reset if 24h passed
CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, credits_left INTEGER, message TEXT) AS $$
DECLARE
  v_credits INTEGER;
  v_reset_at TIMESTAMP WITH TIME ZONE;
  v_gens INTEGER;
BEGIN
  SELECT credits_remaining, credits_reset_at, generations_today
  INTO v_credits, v_reset_at, v_gens
  FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;

  -- Reset credits if 24h have passed
  IF v_reset_at <= now() THEN
    UPDATE public.profiles
    SET credits_remaining = 50, generations_today = 0, credits_reset_at = now() + interval '24 hours', updated_at = now()
    WHERE user_id = p_user_id;
    v_credits := 50;
    v_gens := 0;
  END IF;

  -- Check credits
  IF v_credits < 5 THEN
    RETURN QUERY SELECT false, v_credits, 'Not enough credits'::TEXT;
    RETURN;
  END IF;

  -- Check daily limit
  IF v_gens >= 10 THEN
    RETURN QUERY SELECT false, v_credits, 'Daily generation limit reached'::TEXT;
    RETURN;
  END IF;

  -- Deduct
  UPDATE public.profiles
  SET credits_remaining = credits_remaining - 5, generations_today = generations_today + 1, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT true, v_credits - 5, 'Credits deducted'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();