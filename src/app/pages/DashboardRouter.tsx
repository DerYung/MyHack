import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { StartupDashboard } from './StartupDashboard';
import { MentorDashboard } from './MentorDashboard';
import { FunderDashboard } from './FunderDashboard';
import { Loader2 } from 'lucide-react';

export function DashboardRouter() {
  const navigate = useNavigate();
  const { userProfile, loading } = useAuth();
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (loading) return;

    // Fall back to localStorage role if Firebase profile not available
    const role = userProfile?.role?.toLowerCase() || localStorage.getItem('userRole') || '';

    if (!role) {
      navigate('/');
      return;
    }
    if (role === 'admin') {
      navigate('/admin');
      return;
    }
    setUserRole(role);
  }, [loading, userProfile, navigate]);

  if (loading || !userRole) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (userRole === 'startup') {
    return <StartupDashboard />;
  }

  if (userRole === 'mentor') {
    return <MentorDashboard />;
  }

  if (userRole === 'funder') {
    return <FunderDashboard />;
  }

  return null;
}
