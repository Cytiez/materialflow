import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ListingsPage from './pages/ListingsPage';
import MyListingsPage from './pages/MyListingsPage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import EditListingPage from './pages/EditListingPage';
import MatchResultsPage from './pages/MatchResultsPage';
import RequestsPage from './pages/RequestsPage';
import MyRequestsPage from './pages/MyRequestsPage';
import CreateRequestPage from './pages/CreateRequestPage';
import RequestDetailPage from './pages/RequestDetailPage';
import EditRequestPage from './pages/EditRequestPage';
import ImpactPage from './pages/ImpactPage';
import ProfilePage from './pages/ProfilePage';
import ReceiverProfilePage from './pages/ReceiverProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Layout utama: sidebar + navbar + content area
function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-sidebar">
        <Navbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Guest layout — tanpa sidebar (login, register, landing)
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Routes>
      {/* Public routes — tanpa sidebar */}
      <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes — dengan sidebar */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Listings */}
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/my" element={<ProtectedRoute roles={['sender']}><MyListingsPage /></ProtectedRoute>} />
        <Route path="/listings/create" element={<ProtectedRoute roles={['sender']}><CreateListingPage /></ProtectedRoute>} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/listings/:id/edit" element={<ProtectedRoute roles={['sender']}><EditListingPage /></ProtectedRoute>} />
        <Route path="/listings/:id/matches" element={<MatchResultsPage />} />

        {/* Requests */}
        <Route path="/requests" element={<RequestsPage />} />
        <Route path="/requests/my" element={<ProtectedRoute roles={['receiver']}><MyRequestsPage /></ProtectedRoute>} />
        <Route path="/requests/create" element={<ProtectedRoute roles={['receiver']}><CreateRequestPage /></ProtectedRoute>} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/requests/:id/edit" element={<ProtectedRoute roles={['receiver']}><EditRequestPage /></ProtectedRoute>} />

        {/* Impact */}
        <Route path="/impact" element={<ImpactPage />} />

        {/* Profile */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Receiver profile */}
        <Route path="/receivers/:id" element={<ReceiverProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
