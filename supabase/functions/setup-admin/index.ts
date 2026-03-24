import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results: string[] = [];

    // 1. Create Admin account
    const adminEmail = 'admin@studentpass.com';
    const adminPassword = 'Admin123!';

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some((u: any) => u.email === adminEmail);

    if (!adminExists) {
      const { data: adminData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: 'System Admin' },
      });

      if (adminError) {
        results.push(`Admin creation failed: ${adminError.message}`);
      } else if (adminData.user) {
        // Assign admin role
        await supabaseAdmin.from('user_roles').insert({
          user_id: adminData.user.id,
          role: 'admin',
        });
        results.push(`Admin created: ${adminEmail} / ${adminPassword}`);
      }
    } else {
      results.push('Admin account already exists');
    }

    // 2. Create sample Clerk account
    const clerkEmail = 'CLK001@clerk.pass';
    const clerkPassword = 'Clerk123!';
    const clerkExists = existingUsers?.users?.some((u: any) => u.email === clerkEmail);

    if (!clerkExists) {
      const { data: clerkData, error: clerkError } = await supabaseAdmin.auth.admin.createUser({
        email: clerkEmail,
        password: clerkPassword,
        email_confirm: true,
        user_metadata: { role: 'clerk', full_name: 'John Clerk' },
      });

      if (clerkError) {
        results.push(`Clerk creation failed: ${clerkError.message}`);
      } else if (clerkData.user) {
        await supabaseAdmin.from('user_roles').insert({
          user_id: clerkData.user.id,
          role: 'clerk',
        });
        await supabaseAdmin.from('clerks').insert({
          user_id: clerkData.user.id,
          clerk_id: 'CLK001',
          full_name: 'John Clerk',
        });
        results.push(`Clerk created: CLK001 / ${clerkPassword}`);
      }
    } else {
      results.push('Clerk account already exists');
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
