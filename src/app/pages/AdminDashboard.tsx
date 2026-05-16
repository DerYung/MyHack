import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Shield, LayoutDashboard, Users, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function AdminDashboard() {
  const { user } = useAuth();

  const quickLinks = [
    { name: 'Submit Startup', path: '/submit-startup', icon: Briefcase },
    { name: 'Mentor Matching', path: '/mentor-matching', icon: Users },
    { name: 'Funder Matching', path: '/funder-matching', icon: LayoutDashboard },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Admin Console</h1>
            <p className="text-sm text-slate-500">
              Signed in as {user?.email ?? 'admin'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            Admin tools are under construction
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            User management, role assignment and platform metrics will live here.
            For now you can jump straight into any of the other workflows.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickLinks.map(({ name, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/40 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {name}
              </Link>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
