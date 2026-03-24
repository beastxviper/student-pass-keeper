
-- Insert roles for existing admin and clerk users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'admin@studentpass.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'clerk'::app_role FROM auth.users WHERE email = 'clk001@clerk.pass'
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert clerk record
INSERT INTO public.clerks (user_id, clerk_id, full_name)
SELECT id, 'CLK001', 'John Clerk' FROM auth.users WHERE email = 'clk001@clerk.pass'
ON CONFLICT (user_id) DO NOTHING;

-- Auto-confirm the student that signed up earlier
UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'stu2024001@student.pass' AND email_confirmed_at IS NULL;

-- Insert student role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role FROM auth.users WHERE email = 'stu2024001@student.pass'
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert student profile
INSERT INTO public.profiles (user_id, login_number, full_name)
SELECT id, 'STU2024001', 'John Doe' FROM auth.users WHERE email = 'stu2024001@student.pass'
ON CONFLICT (user_id) DO NOTHING;
