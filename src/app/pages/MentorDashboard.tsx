import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Users, ShieldCheck, TrendingUp, CheckCircle, Loader2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { getMentor } from '../services/firestoreMentorService';
import { getLinkagesForMentor } from '../services/firestoreLinkageService';
import { getCompany, updateCompany } from '../services/firestoreStartupService';
import type { LinkageDoc, CompanyDoc, MentorDoc } from '../types/firestore';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const bentoVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface AssignedStartup {
  company: CompanyDoc;
  linkage: LinkageDoc;
}

export function MentorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mentor, setMentor] = useState<MentorDoc | null>(null);
  const [assigned, setAssigned] = useState<AssignedStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const unsubscribe = onSnapshot(
      doc(db, 'mentors', user.uid),
      async (docSnap) => {
        if (docSnap.exists()) {
          const mentorDoc = { ...docSnap.data(), uid: docSnap.id } as MentorDoc;
          setMentor(mentorDoc);

          try {
            // Fetch all linkages where this mentor is assigned
            const linkages = await getLinkagesForMentor(user.uid);

            // For each linkage, fetch the company document
            const results: AssignedStartup[] = [];
            for (const linkage of linkages) {
              if (!linkage.company_uid) continue;
              const company = await getCompany(linkage.company_uid);
              if (company) {
                results.push({ company, linkage });
              }
            }
            setAssigned(results);
          } catch (err) {
            console.error('Failed to fetch assigned startups:', err);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Failed to fetch mentor data:', err);
        setError('Failed to load your assigned startups.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeStartups = assigned.filter(a => a.linkage.status === 'active');
  const completedMentorships = assigned.filter(a => a.linkage.status === 'completed');
  const totalBudget = assigned.reduce((sum, a) => sum + (a.company.budget_needed || 0), 0);

  const handleMarkReady = async (companyUid: string) => {
    try {
      await updateCompany(companyUid, { status: 'ready' });
      toast.success('Startup marked as Investment Ready!');
      // Update local state
      setAssigned(prev =>
        prev.map(a =>
          a.company.uid === companyUid
            ? { ...a, company: { ...a.company, status: 'ready' } }
            : a
        )
      );
    } catch (err) {
      console.error('Failed to update startup status:', err);
      toast.error('Failed to update status.');
    }
  };

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-lg font-medium text-gray-500">Loading Mentor Station...</p>
        </motion.div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-12 max-w-md text-center shadow-2xl border border-red-200 bg-white">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="rounded-full">Try Again</Button>
        </motion.div>
      </div>
    );
  }

  // ── Pending Verification State ─────────────────────────────────────────────
  if (mentor && !mentor.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-12 max-w-md text-center shadow-2xl border border-yellow-200 bg-white">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Verification</h2>
          <p className="text-gray-500 mb-6">Your mentor profile is currently being reviewed by an Administrator. You will be able to access the Mentor Radar once verified.</p>
        </motion.div>
      </div>
    );
  }

  // ── Status badge helper ────────────────────────────────────────────────────
  const statusBadge = (status: CompanyDoc['status']) => {
    const map: Record<CompanyDoc['status'], { bg: string; text: string; label: string }> = {
      submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Submitted' },
      mentoring: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Refining' },
      ready: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready' },
      matched: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Matched' },
      funded: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Funded' },
    };
    const s = map[status] ?? map.submitted;
    return <Badge className={`${s.bg} ${s.text} hover:${s.bg} border-none`}>{s.label}</Badge>;
  };

  // ── Currency Formatter ─────────────────────────────────────────────────────
  const formatCurrency = (val: number) => {
    if (val === 0) return "$0";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val}`;
  };

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">Mentor Station</h1>
            <p className="text-muted-foreground">Guide startups from raw ideas to investment readiness.</p>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Sourcing Hub */}
          <motion.div variants={bentoVariants} className="md:col-span-3 glass rounded-3xl p-8 bg-white shadow-xl flex flex-col sm:flex-row items-center justify-between text-center sm:text-left relative overflow-hidden group border border-gray-100">
             <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="flex items-center gap-6 relative z-10">
               <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Activity className="w-8 h-8 animate-pulse" />
               </div>
               <div>
                 <h2 className="text-2xl font-black mb-1">Find Startups to Mentor</h2>
                 <p className="text-gray-500 max-w-md">
                   Review startups that have requested mentorship and match with those that fit your expertise.
                 </p>
               </div>
             </div>
             <Button onClick={() => navigate('/mentor-matching')} size="lg" className="mt-6 sm:mt-0 rounded-full shadow-xl h-14 px-8 text-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white hover:scale-105 transition-all relative z-10">
               Open Mentor Radar
             </Button>
          </motion.div>
          {/* Stat: Total Assigned */}
          <motion.div variants={bentoVariants} className="glass rounded-3xl p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex flex-col justify-between shadow-xl">
            <Users className="w-10 h-10 opacity-80" />
            <div>
              <p className="font-bold opacity-80 uppercase text-xs tracking-wider">Total Assigned</p>
              <h2 className="text-6xl font-black">{assigned.length}</h2>
            </div>
          </motion.div>

          {/* Stat: Active / Completed */}
          <motion.div variants={bentoVariants} className="glass rounded-3xl p-6 bg-white border-green-500/20 flex flex-col justify-between shadow-xl">
            <ShieldCheck className="w-10 h-10 text-green-500" />
            <div>
              <p className="font-bold text-gray-400 uppercase text-xs tracking-wider">Active / Completed</p>
              <h2 className="text-5xl font-black text-gray-900">
                {activeStartups.length}<span className="text-2xl text-gray-400 font-bold"> / {completedMentorships.length}</span>
              </h2>
            </div>
          </motion.div>

          {/* Stat: Advisory Pipeline */}
          <motion.div variants={bentoVariants} className="glass rounded-3xl p-6 bg-white border-orange-500/20 flex flex-col justify-between shadow-xl">
            <TrendingUp className="w-10 h-10 text-orange-500" />
            <div>
              <p className="font-bold text-gray-400 uppercase text-xs tracking-wider">Advisory Pipeline</p>
              <h2 className="text-5xl font-black text-gray-900">{formatCurrency(totalBudget)}</h2>
            </div>
          </motion.div>

          {/* Action Hub: Startup Cards */}
          <motion.div variants={bentoVariants} className="md:col-span-3 md:row-span-3 glass rounded-3xl p-8 bg-white shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Action Hub</h2>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">
                {activeStartups.length} active • {completedMentorships.length} completed
              </Badge>
            </div>
            
            {assigned.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <Users className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">Inbox Zero</h3>
                <p className="text-gray-500 mb-4 max-w-sm">You currently have no assigned startups. Startups that match your expertise will appear here when they request mentorship.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 overflow-y-auto">
                {assigned.map(({ company, linkage }) => (
                  <div key={company.uid} className="p-6 rounded-2xl border border-purple-100 bg-purple-50/30 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                          <p className="text-sm text-gray-500">{company.sector} • {company.stage}</p>
                        </div>
                        {statusBadge(company.status)}
                      </div>

                      {/* AI Score Progress */}
                      <Progress value={company.ai_score ?? 0} className="h-2 mb-2 bg-gray-200 [&>div]:bg-purple-500" />
                      <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-4">
                        <span>AI Readiness</span>
                        <span className="text-purple-600">{company.ai_score ?? '—'}/100</span>
                      </div>

                      {/* Engagement Status */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${linkage.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {linkage.status === 'active' ? 'Actively Mentoring' : linkage.status === 'completed' ? 'Mentoring Complete' : linkage.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-purple-100">
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{company.description}</p>
                      {company.status === 'mentoring' && (
                        <Button 
                          onClick={() => handleMarkReady(company.uid)}
                          className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full h-10 shadow-md transition-transform hover:scale-[1.02]"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" /> Mark as Investment Ready
                        </Button>
                      )}
                      {company.status === 'ready' && (
                        <div className="text-center text-sm font-bold text-green-600 py-2">
                          ✓ Investment Ready
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
