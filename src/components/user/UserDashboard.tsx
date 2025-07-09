import React, { useState, useEffect } from 'react';
import { Search, Store as StoreIcon, Star, Edit3, Check } from 'lucide-react';
import Layout from '../Layout';
import { StoreWithRating } from '../../types';
import { db } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import StarRating from '../common/StarRating';
import ChangePasswordModal from './ChangePasswordModal';

const UserDashboard: React.FC = () => {
  const [stores, setStores] = useState<StoreWithRating[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'address'>('name');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [submittingRating, setSubmittingRating] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchStores();
  }, [user]);

  useEffect(() => {
    filterStores();
  }, [stores, searchTerm, searchType]);

  const fetchStores = async () => {
    if (!user) return;
    
    try {
      const storeData = await db.getAllStores();
      
      // Get user ratings for all stores
      const storesWithRatings = await Promise.all(
        storeData.map(async (store) => {
          const userRating = await db.getUserRating(user.id, store.id);
          return {
            ...store,
            user_rating: userRating
          };
        })
      );
      
      setStores(storesWithRatings);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStores = () => {
    if (!searchTerm) {
      setFilteredStores(stores);
      return;
    }

    const filtered = stores.filter(store => {
      const searchField = searchType === 'name' ? store.name : store.address;
      return searchField.toLowerCase().includes(searchTerm.toLowerCase());
    });

    setFilteredStores(filtered);
  };

  const handleRatingSubmit = async (storeId: string, rating: number) => {
    if (!user) return;
    
    setSubmittingRating(storeId);
    try {
      await db.submitRating(user.id, storeId, rating);
      
      // Update local state
      setStores(prevStores => 
        prevStores.map(store => 
          store.id === storeId 
            ? { ...store, user_rating: rating }
            : store
        )
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmittingRating(null);
    }
  };

  const StoreCard: React.FC<{ store: StoreWithRating }> = ({ store }) => {
    const [tempRating, setTempRating] = useState(store.user_rating || 0);
    const [isEditing, setIsEditing] = useState(false);

    const handleRatingChange = (newRating: number) => {
      setTempRating(newRating);
      setIsEditing(true);
    };

    const handleSubmitRating = async () => {
      await handleRatingSubmit(store.id, tempRating);
      setIsEditing(false);
    };

    const handleCancelEdit = () => {
      setTempRating(store.user_rating || 0);
      setIsEditing(false);
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <StoreIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
              <p className="text-sm text-gray-600">{store.address}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Overall Rating:</span>
            <StarRating rating={store.average_rating || 0} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Your Rating:</span>
            <div className="flex items-center space-x-2">
              <StarRating
                rating={tempRating}
                interactive={true}
                onRatingChange={handleRatingChange}
              />
              {isEditing && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={handleSubmitRating}
                    disabled={submittingRating === store.id}
                    className="text-green-600 hover:text-green-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            {store.total_ratings} total review{store.total_ratings !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout title="Store Directory">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Browse Stores</h2>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Change Password
          </button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search stores by ${searchType}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'name' | 'address')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Search by Name</option>
            <option value="address">Search by Address</option>
          </select>
        </div>

        {/* Store Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              Showing {filteredStores.length} of {stores.length} stores
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </>
        )}

        {!loading && filteredStores.length === 0 && (
          <div className="text-center py-12">
            <StoreIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No stores found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or criteria.
            </p>
          </div>
        )}
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

export default UserDashboard;