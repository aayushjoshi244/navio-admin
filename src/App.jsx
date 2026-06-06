import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/categories/Categories';
import Providers from './pages/providers/Providers';
import Users from './pages/Users';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  console.log('🛡️ ProtectedRoute: loading=', loading, 'user=', user?.email, 'profile=', profile?.user_type);
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#10142a] text-slate-200">
        Loading admin session...
      </div>
    );
  }
  if (!user || profile?.user_type !== 'admin') {
    console.log('🚫 Redirecting to /login (no admin user)');
    return <Navigate to="/login" />;
  }
  console.log('✅ Access granted to dashboard');
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="categories" element={<Categories />} />
        <Route path="providers" element={<Providers />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
