CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  loan_date DATE NOT NULL,
  principal_amount NUMERIC(14,2) NOT NULL CHECK (principal_amount > 0),
  interest_rate NUMERIC(8,4) NOT NULL CHECK (interest_rate >= 0),
  rate_period TEXT NOT NULL DEFAULT 'monthly' CHECK (rate_period IN ('monthly','yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paid')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loans TO authenticated;
GRANT ALL ON public.loans TO service_role;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own loans select" ON public.loans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own loans insert" ON public.loans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own loans update" ON public.loans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own loans delete" ON public.loans FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX loans_user_idx ON public.loans(user_id);