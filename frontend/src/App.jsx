import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';
import OrganizerLayout from './components/layouts/OrganizerLayout';
import OfficerLayout from './components/layouts/OfficerLayout';

// Components
import LoadingSpinner from './components/ui/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Public Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import PlayersPage from './pages/players/PlayersPage';
import PlayerDetailsPage from './pages/players/PlayerDetailsPage';
import TournamentsPage from './pages/tournaments/TournamentsPage';
import TournamentDetailsPage from './pages/tournaments/TournamentDetailsPage';
import RatingsPage from './pages/ratings/RatingsPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import CreateTournament from './pages/organizer/CreateTournament';
import ManageTournament from './pages/organizer/ManageTournament';
import AddPlayer from './pages/organizer/AddPlayer';
import TournamentPairings from './pages/organizer/TournamentPairings';
import TournamentResults from './pages/organizer/TournamentResults';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import ApproveOrganizers from './pages/officer/ApproveOrganizers';
import ProcessTournaments from './pages/officer/ProcessTournaments';
import ManagePlayers from './pages/officer/ManagePlayers';
import SystemStats from './pages/officer/SystemStats';

function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user profile to get role
  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setUserRole(data.role);
        
        // Check if organizer is approved
        if (data.role === 'ORGANIZER' && data.status !== 'APPROVED') {
          toast.info('Your organizer account is pending approval');
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route element={<MainLayout user={user} userRole={userRole} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailsPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
          <Route path="/ratings" element={<RatingsPage />} />
          <Route path="/ratings/:format" element={<RatingsPage />} />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
          />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Dashboard redirect based on role */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              {userRole === 'OFFICER' || userRole === 'ADMIN' ? (
                <Navigate to="/officer/dashboard" replace />
              ) : (
                <Navigate to="/organizer/dashboard" replace />
              )}
            </ProtectedRoute>
          } 
        />

        {/* Organizer Routes - Protected */}
        <Route 
          element={
            <ProtectedRoute user={user}>
              <OrganizerLayout user={user} userRole={userRole} />
            </ProtectedRoute>
          }
        >
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/tournaments/create" element={<CreateTournament />} />
          <Route path="/organizer/tournaments/:id" element={<ManageTournament />} />
          <Route path="/organizer/tournaments/:id/pairings/:round" element={<TournamentPairings />} />
          <Route path="/organizer/tournaments/:id/results" element={<TournamentResults />} />
          <Route path="/organizer/players/add" element={<AddPlayer />} />
        </Route>

        {/* Officer Routes - Protected with role restriction */}
        <Route 
          element={
            <ProtectedRoute user={user} allowedRoles={['OFFICER', 'ADMIN']} userRole={userRole}>
              <OfficerLayout user={user} userRole={userRole} />
            </ProtectedRoute>
          }
        >
          <Route path="/officer/dashboard" element={<OfficerDashboard />} />
          <Route path="/officer/organizers" element={<ApproveOrganizers />} />
          <Route path="/officer/tournaments" element={<ProcessTournaments />} />
          <Route path="/officer/players" element={<ManagePlayers />} />
          <Route path="/officer/stats" element={<SystemStats />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
