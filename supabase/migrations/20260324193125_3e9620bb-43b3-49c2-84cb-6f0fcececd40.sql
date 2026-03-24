
-- Fix permissive RLS: replace overly permissive policies with proper role checks

-- Drop the overly permissive clerks policy and notification insert policy
DROP POLICY IF EXISTS "Admins can manage clerks" ON public.clerks;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Admins can insert/update/delete clerks
CREATE POLICY "Admins can insert clerks" ON public.clerks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update clerks" ON public.clerks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete clerks" ON public.clerks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Clerks/admins can insert notifications (for status updates)
CREATE POLICY "Clerks can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'clerk') OR public.has_role(auth.uid(), 'admin'));
