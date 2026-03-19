import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../../lib/app-params';
import type { Database } from '../../types/database';

export const supabase = createClient<Database>(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      storage: undefined, // Will use AsyncStorage via custom storage
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
