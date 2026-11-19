import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type CustomRole = {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string;
  role: 'dictador' | 'miembro';
  avatar_url: string | null;
  custom_role_id: string | null;
  created_at: string;
};

export type Character = {
  id: string;
  name: string;
  rarity: string;
  element: string;
  weapon: string;
  class: string;
  default_avatar_url: string | null;
};

export type Priority = 'No Obtenido' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8' | 'P9' | 'P10';

export type Assignment = {
  id: string;
  user_id: string;
  character_id: string;
  priority: Priority;
  custom_avatar_url: string | null;
  notes: string | null;
  updated_at: string;
};

export const PRIORITIES: Priority[] = ['No Obtenido','P4','P5','P6','P7','P8','P9','P10'];
