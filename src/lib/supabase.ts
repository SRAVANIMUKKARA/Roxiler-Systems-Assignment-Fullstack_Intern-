import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication helpers
export const auth = {
  async signUp(userData: { name: string; email: string; password: string; address: string }) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          address: userData.address,
          role: 'user'
        }
      }
    });
    
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
};

// Database helpers
export const db = {
  async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getAllStores() {
    const { data, error } = await supabase
      .from('store_ratings_summary')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getStoresByUser(userId: string) {
    const { data, error } = await supabase
      .from('store_ratings_summary')
      .select('*, ratings!inner(rating)')
      .eq('ratings.user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async getUserRating(userId: string, storeId: string) {
    const { data, error } = await supabase
      .from('ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data?.rating || null;
  },

  async submitRating(userId: string, storeId: string, rating: number) {
    const { data, error } = await supabase
      .from('ratings')
      .upsert({ user_id: userId, store_id: storeId, rating }, {
        onConflict: 'user_id,store_id'
      });
    
    if (error) throw error;
    return data;
  },

  async getDashboardStats() {
    const [usersResult, storesResult, ratingsResult] = await Promise.all([
      supabase.from('users').select('role'),
      supabase.from('stores').select('id'),
      supabase.from('ratings').select('id')
    ]);

    if (usersResult.error || storesResult.error || ratingsResult.error) {
      throw new Error('Failed to fetch dashboard statistics');
    }

    const users = usersResult.data || [];
    const stores = storesResult.data || [];
    const ratings = ratingsResult.data || [];

    return {
      totalUsers: users.length,
      totalStores: stores.length,
      totalRatings: ratings.length,
      adminCount: users.filter(u => u.role === 'admin').length,
      userCount: users.filter(u => u.role === 'user').length,
      storeOwnerCount: users.filter(u => u.role === 'store_owner').length
    };
  },

  async createUser(userData: { name: string; email: string; password: string; address: string; role: string }) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData]);
    
    if (error) throw error;
    return data;
  },

  async createStore(storeData: { name: string; email: string; address: string; owner_id: string }) {
    const { data, error } = await supabase
      .from('stores')
      .insert([storeData]);
    
    if (error) throw error;
    return data;
  },

  async updatePassword(userId: string, newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    return data;
  },

  async getRatingsForStore(storeId: string) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*, users(name, email)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};