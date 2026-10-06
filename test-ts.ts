import { getSupabaseBrowserClient } from './lib/supabase/client';

async function test() {
  const supabase = getSupabaseBrowserClient();
  const res = supabase.from('profiles');
  const res2 = supabase.from('student_skills');
}
