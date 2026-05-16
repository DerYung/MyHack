import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Rocket, Plus, ArrowRight, FileText, CheckCircle, Activity, Brain, Target, Users, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { getCompany, updateCompany } from '../services/firestoreStartupService';
import { getMentor } from '../services/firestoreMentorService';
import type { CompanyDoc, MentorDoc } from '../types/firestore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const bentoVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function StartupDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyDoc | null>(null);
  const [mentor, setMentor] = useState<MentorDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const companyData = await getCompany(user.uid);
        setCompany(companyData);

        // If a mentor is assigned, fetch their profile too
        if (companyData?.mentor_uid) {
          const mentorData = await getMentor(companyData.mentor_uid);
          setMentor(mentorData);
        }
      } catch (err) {
        console.error('Failed to fetch startup data:', err);
        setError('Failed to load your startup data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-lg font-medium text-gray-500">Loading your workspace...</p>
        </motion.div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
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

  // ── Empty State (No company submitted yet) ─────────────────────────────────
  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-12 max-w-2xl text-center shadow-2xl border border-blue-500/20 bg-gradient-to-br from-white to-blue-50">
           <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-12 h-12" />
           </div>
           <h1 className="text-4xl font-black mb-4 text-gray-900">Initialize Your Journey</h1>
           <p className="text-xl text-gray-600 mb-8 leading-relaxed">
             Welcome to the Ecosystem. To get started, you need to submit your business idea and budget. Our AI will then guide you through mentorship and funding.
           </p>
           <Button onClick={() => navigate('/submit-startup')} size="lg" className="rounded-full shadow-lg h-16 px-10 text-xl w-full bg-gradient-vibrant text-white hover:scale-105 transition-transform">
             <Plus className="w-6 h-6 mr-2" /> Submit Your Idea & Budget
           </Button>
        </motion.div>
      </div>
    );
  }

  // ── Pending Verification State ─────────────────────────────────────────────
  if (!company.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-12 max-w-md text-center shadow-2xl border border-yellow-200 bg-white">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Verification</h2>
          <p className="text-gray-500 mb-6">Your startup profile has been submitted and is currently being reviewed by an Administrator. You will gain access to the ecosystem once verified.</p>
        </motion.div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const statusLabels: Record<CompanyDoc['status'], string> = {
    submitted: 'Submitted',
    mentoring: 'Mentoring',
    ready: 'Investment Ready',
    matched: 'Matched',
    funded: 'Funded',
  };

  const progressSteps = [
    {
      title: "Idea Ingested",
      desc: "Startup submitted to ecosystem",
      active: true,
    },
    {
      title: "Mentor Attached",
      desc: company.status === 'submitted' ? "Waiting for match" : (mentor ? `Mentored by ${mentor.name}` : "Matched & Mentoring"),
      active: !['submitted'].includes(company.status),
    },
    {
      title: "Intelligence Ready",
      desc: ['ready', 'matched', 'funded'].includes(company.status) ? "Brief generated" : "Pending refinement",
      active: ['ready', 'matched', 'funded'].includes(company.status),
    },
    {
      title: "Funder Syndication",
      desc: company.status === 'funded' ? "Capital Deployed" : "Awaiting matches",
      active: company.status === 'funded',
    },
  ];

  const completedSteps = progressSteps.filter(s => s.active).length;
  const overallProgress = Math.round((completedSteps / progressSteps.length) * 100);

  // ── Dashboard State ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black mb-1">Your Workspace</h1>
            <p className="text-muted-foreground">Follow the guided steps to secure your funding.</p>
          </div>
          <div className="flex items-center gap-4">
            {company.status === 'ready' && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-4 py-2 text-sm uppercase">
                 Investment Ready
              </Badge>
            )}
            <Button variant="outline" onClick={() => navigate('/submit-startup')} className="rounded-full">
              Edit Profile
            </Button>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[160px]"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Bento Box 1: Startup Status (Span 2 cols) */}
          <motion.div variants={bentoVariants} className="md:col-span-2 glass rounded-3xl p-6 flex flex-col justify-between border-blue-500/20 bg-gradient-to-br from-blue-50 to-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-[-50%] right-[-10%] w-40 h-40 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-colors" />
            <div>
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-none uppercase tracking-widest text-xs px-3 py-1">
                  {statusLabels[company.status]}
                </Badge>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{company.name}</h2>
              <p className="text-gray-500 font-medium">{company.stage} • Seeking ${(company.budget_needed / 1000).toFixed(0)}K</p>
            </div>
          </motion.div>

          {/* Bento Box 2: Next Action (Span 2 cols) */}
          <motion.div variants={bentoVariants} className="md:col-span-2 glass rounded-3xl p-6 flex flex-col justify-center border-purple-500/20 bg-white shadow-xl relative overflow-hidden group">
             <p className="font-bold text-gray-400 uppercase text-xs tracking-wider mb-2">Required Action</p>
             
             {company.status === 'submitted' && (
               <div>
                 <h3 className="text-xl font-bold mb-2">Finding a Mentor</h3>
                 <p className="text-sm text-gray-500 mb-3">Our AI is actively searching for the perfect mentor for you. Please wait.</p>
                 <Button disabled className="w-full rounded-full bg-gray-200 text-gray-500 h-12">
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Matching in Progress...
                 </Button>
               </div>
             )}

             {company.status === 'mentoring' && (
               <div>
                 <h3 className="text-xl font-bold mb-2">Refining with Mentor</h3>
                 <p className="text-sm text-gray-500 mb-3">{mentor ? `Working with ${mentor.name}` : 'Mentor assigned'}</p>
                 <Button onClick={async () => {
                   await updateCompany(user!.uid, { status: 'ready' });
                   window.location.reload();
                 }} className="w-full rounded-full bg-yellow-500 hover:bg-yellow-600 h-12 text-white">
                   Simulate: Mark as Ready
                 </Button>
               </div>
             )}

             {company.status === 'ready' && (
               <div>
                 <h3 className="text-xl font-bold mb-4">Pitch Funders</h3>
                 <Button onClick={() => navigate('/funder-matching')} className="w-full rounded-full bg-green-600 hover:bg-green-700 h-12">
                   Enter Deal Flow <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
               </div>
             )}

             {(company.status === 'matched' || company.status === 'funded') && (
               <div>
                 <h3 className="text-xl font-bold mb-2 text-green-700">🎉 {company.status === 'funded' ? 'Funded!' : 'Matched with Funder'}</h3>
                 <p className="text-sm text-gray-500">Your journey through the ecosystem is progressing.</p>
               </div>
             )}
          </motion.div>

          {/* Bento Box 3: AI Score + Market Goals (Span 2 cols) */}
          <motion.div variants={bentoVariants} className="md:col-span-2 glass rounded-3xl p-6 bg-white shadow-xl border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              {company.ai_score !== null && (
                <span className="text-3xl font-black text-indigo-600">{company.ai_score}<span className="text-sm text-gray-400 font-medium">/100</span></span>
              )}
              {company.ai_score === null && (
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending</span>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">AI Readiness Score</p>
              <Progress value={company.ai_score ?? 0} className="h-2 bg-gray-100 [&>div]:bg-indigo-500" />
            </div>
          </motion.div>

          {/* Bento Box 4: Mentor Info (Span 2 cols) */}
          <motion.div variants={bentoVariants} className="md:col-span-2 glass rounded-3xl p-6 bg-white shadow-xl border border-gray-100 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              {mentor ? (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Mentor</p>
                  <h3 className="text-xl font-bold text-gray-900">{mentor.name}</h3>
                  <p className="text-sm text-gray-500">{mentor.years_experience}yr exp • {mentor.startups_helped} startups helped</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mentor</p>
                  <h3 className="text-lg font-bold text-gray-400">Not yet assigned</h3>
                </>
              )}
            </div>
          </motion.div>

          {/* Bento Box 5: Investor Brief (Span 2 cols, Span 2 rows) */}
          <motion.div 
            variants={bentoVariants} 
            className={`md:col-span-2 md:row-span-2 glass rounded-3xl p-8 transition-all cursor-pointer relative overflow-hidden group ${company.status === 'ready' || company.status === 'matched' || company.status === 'funded' ? 'border-purple-500/20 bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:shadow-2xl hover:scale-[1.02]' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70'}`} 
            onClick={() => ['ready', 'matched', 'funded'].includes(company.status) ? navigate(`/investor-brief/${company.uid}`) : null}
          >
             {['ready', 'matched', 'funded'].includes(company.status) && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 group-hover:opacity-30 transition-opacity" />}
             <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
             
             <div className="h-full flex flex-col justify-between relative z-10">
               <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${['ready', 'matched', 'funded'].includes(company.status) ? 'bg-white/20 backdrop-blur-md border-white/30 text-white' : 'bg-gray-200 border-gray-300 text-gray-400'}`}>
                  <FileText className="w-8 h-8" />
               </div>
               <div>
                 <h2 className="text-3xl font-black mb-2">Investor Intelligence Brief</h2>
                 <p className={`${['ready', 'matched', 'funded'].includes(company.status) ? 'text-white/80' : 'text-gray-500'} text-lg mb-6 max-w-sm`}>
                   {['ready', 'matched', 'funded'].includes(company.status) ? 'Your AI-generated brief is ready. Review market analysis and compatibility scores.' : 'Locked. Brief will be generated once your idea is marked as Investment Ready.'}
                 </p>
                 {['ready', 'matched', 'funded'].includes(company.status) && (
                   <div className="inline-flex items-center font-bold bg-white text-purple-600 px-6 py-3 rounded-full group-hover:bg-gray-50 transition-colors">
                     Open Brief <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                   </div>
                 )}
               </div>
             </div>
          </motion.div>

          {/* Bento Box 6: Progression Tracker (Span 2 cols, Span 2 rows) */}
          <motion.div variants={bentoVariants} className="md:col-span-2 md:row-span-2 glass rounded-3xl p-8 border-gray-200 bg-white shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="text-blue-500" /> Progression Tracker</h3>
              <span className="text-sm font-bold text-blue-600">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-1.5 bg-gray-100 [&>div]:bg-blue-500 mb-6" />
            <div className="flex-1 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-gray-100 space-y-6">
              {progressSteps.map((step, i) => (
                <div key={i} className="relative flex gap-4 items-start z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-4 border-white ${step.active ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {step.active && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="pt-1">
                    <p className={`font-bold ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</p>
                    <p className={`text-sm ${step.active ? 'text-gray-500' : 'text-gray-400'}`}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bento Box 7: Market Goals (Span 4 cols) */}
          {company.market_goals && (
            <motion.div variants={bentoVariants} className="md:col-span-4 glass rounded-3xl p-6 bg-white shadow-xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Market Goals</p>
              <p className="text-gray-700 leading-relaxed">{company.market_goals}</p>
            </motion.div>
          )}

          {/* Bento Box 8: Inference Engine shortcut (Span 4 cols) */}
          <motion.div
            variants={bentoVariants}
            className="md:col-span-4 glass rounded-3xl p-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl flex items-center justify-between gap-6 cursor-pointer hover:scale-[1.01] transition-transform group"
            onClick={() => navigate('/inference-engine')}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 flex-shrink-0">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-indigo-200 text-[10px] uppercase font-bold tracking-widest mb-0.5">Transparency Report</p>
                <h3 className="text-xl font-black">Why Did the AI Choose Your Matches?</h3>
                <p className="text-indigo-200 text-sm mt-1">See the weighted score breakdown for every mentor and funder in your pipeline.</p>
              </div>
            </div>
            <ArrowRight className="w-8 h-8 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0" />
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
