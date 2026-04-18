import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ewmfbkrlfjytjzaxbvex.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_34gHz5ZDBGrfwocQ7oOa-Q_HfgLSE-H';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
