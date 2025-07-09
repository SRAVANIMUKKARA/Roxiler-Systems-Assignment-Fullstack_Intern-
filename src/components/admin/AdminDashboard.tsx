import React, { useState, useEffect } from 'react';
import { Users, Store, Star, Plus, BarChart3 } from 'lucide-react';
import Layout from '../Layout';
import { DashboardStats } from '../../types';
import { db } from '../../lib/supabase';
import UserManagement from './UserManagement';
import StoreManagement from './StoreManagement';
import AddUserModal from './AddUserModal';
import AddStoreModal from './AddStoreModal';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'stores'>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await db.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({
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

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
          <button
            onClick={() => setShowAddStoreModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            color="#3B82F6"
          />
          <StatCard
            title="Total Stores"
            value={stats?.totalStores || 0}
            icon={<Store className="w-6 h-6 text-green-600" />}
            color="#10B981"
          />
          <StatCard
            title="Total Ratings"
            value={stats?.totalRatings || 0}
            icon={<Star className="w-6 h-6 text-yellow-600" />}
            color="#F59E0B"
          />
          <StatCard
            title="Admin Users"
            value={stats?.adminCount || 0}
            icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
            color="#8B5CF6"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Normal Users</span>
              <span className="text-sm font-medium text-gray-900">{stats?.userCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Store Owners</span>
              <span className="text-sm font-medium text-gray-900">{stats?.storeOwnerCount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Administrators</span>
              <span className="text-sm font-medium text-gray-900">{stats?.adminCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Ratings per Store</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.totalStores ? (stats.totalRatings / stats.totalStores).toFixed(1) : '0.0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">User Engagement</span>
              <span className="text-sm font-medium text-gray-900">
                {stats?.totalUsers ? ((stats.totalRatings / stats.totalUsers) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('stores')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stores'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Store Management
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'stores' && <StoreManagement />}
      </div>

      {/* Modals */}
      {showAddUserModal && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onSuccess={fetchStats}
        />
      )}
      {showAddStoreModal && (
        <AddStoreModal
          isOpen={showAddStoreModal}
          onClose={() => setShowAddStoreModal(false)}
          onSuccess={fetchStats}
        />
      )}
    </Layout>
  );
};

export default AdminDashboard;