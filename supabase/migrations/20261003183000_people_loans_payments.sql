CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO authenticated;
GRANT ALL ON public.people TO service_role;
CREATE POLICY "own people select" ON public.people FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own people insert" ON public.people FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own people update" ON public.people FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own people delete" ON public.people FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX people_user_idx ON public.people(user_id);

ALTER TABLE public.loans ADD COLUMN person_id UUID REFERENCES public.people(id) ON DELETE CASCADE;
ALTER TABLE public.loans ALTER COLUMN person_name DROP NOT NULL;
CREATE INDEX loans_person_idx ON public.loans(person_id);

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
CREATE POLICY "own payments select" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own payments insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.loans l WHERE l.id = loan_id AND l.user_id = auth.uid()));
CREATE POLICY "own payments update" ON public.payments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own payments delete" ON public.payments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX payments_user_idx ON public.payments(user_id);
CREATE INDEX payments_loan_idx ON public.payments(loan_id);
