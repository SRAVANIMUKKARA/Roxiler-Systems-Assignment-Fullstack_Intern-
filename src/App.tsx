import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import AdminDashboard from './components/admin/AdminDashboard';
import UserDashboard from './components/user/UserDashboard';
import StoreOwnerDashboard from './components/store/StoreOwnerDashboard';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return showSignup ? (
      <SignupForm onToggleForm={() => setShowSignup(false)} />
    ) : (
      <LoginForm onToggleForm={() => setShowSignup(true)} />
    );
  }

  // Route based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'store_owner':
      return <StoreOwnerDashboard />;
    case 'user':
    default:
      return <UserDashboard />;
  }
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;