export interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  role: 'admin' | 'user' | 'store_owner';
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  name: string;
  email: string;
  address: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  total_ratings?: number;
}

export interface Rating {
  id: string;
  user_id: string;
  store_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface StoreWithRating extends Store {
  user_rating?: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  address: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalStores: number;
  totalRatings: number;
  adminCount: number;
  userCount: number;
  storeOwnerCount: number;
}