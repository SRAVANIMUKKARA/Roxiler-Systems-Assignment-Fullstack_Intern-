import React, { useState, useEffect } from 'react';
import { Store as StoreIcon, Users, Star, BarChart3 } from 'lucide-react';
import Layout from '../Layout';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import StarRating from '../common/StarRating';
import ChangePasswordModal from '../user/ChangePasswordModal';

interface StoreRating {
  id: string;
  rating: number;
  created_at: string;
  users: {
    name: string;
    email: string;
  };
}

const StoreOwnerDashboard: React.FC = () => {
  const [store, setStore] = useState<any>(null);
  const [ratings, setRatings] = useState<StoreRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStoreData();
    }
  }, [user]);

  const fetchStoreData = async () => {
    if (!user) return;
    
    try {
      // Get store owned by current user
      const stores = await db.getAllStores();
      const userStore = stores.find(s => s.owner_id === user.id);
      
      if (userStore) {
        setStore(userStore);
        
        // Get ratings for this store
        const storeRatings = await db.getRatingsForStore(userStore.id);
        setRatings(storeRatings);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({
    title,
    value,
    icon,
    color
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Store Owner Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!store) {
    return (
      <Layout title="Store Owner Dashboard">
        <div className="text-center py-12">
          <StoreIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Store Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No store is associated with your account. Please contact an administrator.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Store Owner Dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Store Dashboard</h2>
            <p className="text-gray-600">{store.name}</p>
          </div>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Change Password
          </button>
        </div>

        {/* Store Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <StoreIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{store.name}</h3>
              <p className="text-gray-600">{store.email}</p>
              <p className="text-sm text-gray-500">{store.address}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Average Rating"
            value={(store.average_rating || 0).toFixed(1)}
            icon={<Star className="w-6 h-6 text-yellow-600" />}
            color="#F59E0B"
          />
          <StatCard
            title="Total Reviews"
            value={store.total_ratings?.toString() || '0'}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="#3B82F6"
          />
          <StatCard
            title="Rating Distribution"
            value={ratings.length > 0 ? `${(ratings.length / store.total_ratings * 100).toFixed(1)}%` : '0%'}
            icon={<BarChart3 className="w-6 h-6 text-green-600" />}
            color="#10B981"
          />
        </div>

        {/* Recent Ratings */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
          </div>
          
          <div className="p-6">
            {ratings.length === 0 ? (
              <div className="text-center py-8">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Your store hasn't received any reviews yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating) => (
                  <div key={rating.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rating.users.name}</p>
                          <p className="text-xs text-gray-500">{rating.users.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StarRating rating={rating.rating} size="sm" />
                        <span className="text-xs text-gray-500">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showChangePasswordModal && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </Layout>
  );
};

export default StoreOwnerDashboard;