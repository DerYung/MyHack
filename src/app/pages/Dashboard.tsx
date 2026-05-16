import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Rocket, Users, TrendingUp, Plus, FileText, CheckCircle, Clock, ArrowRight, Activity, Sparkles, Target, ShieldCheck } from 'lucide-react';
import { mockStartups, mockMentors, mockFunders } from '../lib/mockData';
import { Startup, Mentor, Funder } from '../types';
import { motion } from 'motion/react';

export function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('');
  const [startups, setStartups] = useState<Startup[]>(mockStartups);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role) {
      navigate('/');
      return;
    }
    setUserRole(role);

    const customStartups = localStorage.getItem('customStartups');
    if (customStartups) {
      try {
        const parsed = JSON.parse(customStartups);
        setStartups([...mockStartups, ...parsed]);
      } catch (e) {
        console.error('Failed to parse custom startups', e);
      }
    }
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const bentoVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // ---------------------------------------------------------------------------
  // STARTUP BENTO DASHBOARD
  // ---------------------------------------------------------------------------
  if (userRole === 'startup') {
    // Only use custom startups for the startup user to enforce the empty state flow
    const customStartupsStr = localStorage.getItem('customStartups');
    const myStartups = customStartupsStr ? JSON.parse(customStartupsStr) : [];
    const myStartup = myStartups.length > 0 ? myStartups[0] : null;

    if (!myStartup) {
      // EMPTY STATE
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

    // DASHBOARD STATE
    return (
      <div className="min-h-screen bg-gray-50/50 pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black mb-1">Your Workspace</h1>
              <p className="text-muted-foreground">Follow the guided steps to secure your funding.</p>
            </div>
            {myStartup.status === 'ready' && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-4 py-2 text-sm uppercase">
                 Investment Ready
              </Badge>
            )}
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[160px]"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Bento Box 1: Status (Span 2 cols) */}
            <motion.div variants={bentoVariants} className="md:col-span-2 glass rounded-3xl p-6 flex flex-col justify-between border-blue-500/20 bg-gradient-to-br from-blue-50 to-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-[-50%] right-[-10%] w-40 h-40 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-colors" />
              <div>
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-none uppercase tracking-widest text-xs px-3 py-1">
                    {myStartup.status}
                  </Badge>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{myStartup.name}</h2>
                <p className="text-gray-500 font-medium">Seeking ${(myStartup.budgetNeeded / 1000).toFixed(0)}K</p>
              </div>
            </motion.div>

            {/* Bento Box 2: Next Action (Span 2 cols) */}
            <motion.div variants={bentoVariants} className="md:col-span-2 glass rounded-3xl p-6 flex flex-col justify-center border-purple-500/20 bg-white shadow-xl relative overflow-hidden group">
               <p className="font-bold text-gray-400 uppercase text-xs tracking-wider mb-2">Required Action</p>
               
               {myStartup.status === 'submitted' && (
                 <div>
                   <h3 className="text-xl font-bold mb-4">Match with a Mentor</h3>
                   <Button onClick={() => navigate('/mentor-matching')} className="w-full rounded-full bg-purple-600 hover:bg-purple-700 h-12">
                     Open Mentor Radar <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </div>
               )}

               {myStartup.status === 'mentoring' && (
                 <div>
                   <h3 className="text-xl font-bold mb-4">Refining Idea...</h3>
                   <Button onClick={() => {
                     // Simulate mentor marking as ready
                     const updated = [...myStartups];
                     updated[0].status = 'ready';
                     localStorage.setItem('customStartups', JSON.stringify(updated));
                     window.location.reload();
                   }} className="w-full rounded-full bg-yellow-500 hover:bg-yellow-600 h-12 text-white">
                     Simulate: Mark as Ready
                   </Button>
                 </div>
               )}

               {myStartup.status === 'ready' && (
                 <div>
                   <h3 className="text-xl font-bold mb-4">Pitch Funders</h3>
                   <Button onClick={() => navigate('/funder-matching')} className="w-full rounded-full bg-green-600 hover:bg-green-700 h-12">
                     Enter Deal Flow <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </div>
               )}
            </motion.div>

            {/* Bento Box 3: Action - View Brief (Span 2 cols, Span 2 rows) */}
            <motion.div 
              variants={bentoVariants} 
              className={`md:col-span-2 md:row-span-2 glass rounded-3xl p-8 transition-all cursor-pointer relative overflow-hidden group ${myStartup.status === 'ready' ? 'border-purple-500/20 bg-gradient-to-br from-purple-500 to-indigo-600 text-white hover:shadow-2xl hover:scale-[1.02]' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-70'}`} 
              onClick={() => myStartup.status === 'ready' ? navigate(`/investor-brief/${myStartup.id}`) : null}
            >
               {myStartup.status === 'ready' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 group-hover:opacity-30 transition-opacity" />}
               <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
               
               <div className="h-full flex flex-col justify-between relative z-10">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${myStartup.status === 'ready' ? 'bg-white/20 backdrop-blur-md border-white/30 text-white' : 'bg-gray-200 border-gray-300 text-gray-400'}`}>
                    <FileText className="w-8 h-8" />
                 </div>
                 <div>
                   <h2 className="text-3xl font-black mb-2">Investor Intelligence Brief</h2>
                   <p className={`${myStartup.status === 'ready' ? 'text-white/80' : 'text-gray-500'} text-lg mb-6 max-w-sm`}>
                     {myStartup.status === 'ready' ? 'Your AI-generated brief is ready. Review market analysis and compatibility scores.' : 'Locked. Brief will be generated once your idea is marked as Investment Ready.'}
                   </p>
                   {myStartup.status === 'ready' && (
                     <div className="inline-flex items-center font-bold bg-white text-purple-600 px-6 py-3 rounded-full group-hover:bg-gray-50 transition-colors">
                       Open Brief <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                     </div>
                   )}
                 </div>
               </div>
            </motion.div>

            {/* Bento Box 4: Journey Tracker (Span 2 cols, Span 2 rows) */}
            <motion.div variants={bentoVariants} className="md:col-span-2 md:row-span-2 glass rounded-3xl p-8 border-gray-200 bg-white shadow-xl flex flex-col">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity className="text-blue-500" /> Progression Tracker</h3>
              <div className="flex-1 relative before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-gray-100 space-y-6">
                {[
                  { title: "Idea Ingested", desc: myStartup.submittedAt, active: true },
                  { title: "Mentor Attached", desc: myStartup.status === 'submitted' ? "Waiting for match..." : "Matched & Mentoring", active: myStartup.status !== 'submitted' },
                  { title: "Intelligence Ready", desc: myStartup.status === 'ready' ? "Brief generated" : "Pending refinement", active: myStartup.status === 'ready' },
                  { title: "Funder Syndication", desc: "Awaiting matches", active: false }
                ].map((step, i) => (
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
          </motion.div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MENTOR BENTO DASHBOARD
  // ---------------------------------------------------------------------------
  if (userRole === 'mentor') {
    const assignedStartups = startups.filter(s => s.status === 'mentoring' || s.mentorId);
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
             <motion.div variants={bentoVariants} className="glass rounded-3xl p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex flex-col justify-between shadow-xl">
                <Users className="w-10 h-10 opacity-80" />
                <div>
                  <p className="font-bold opacity-80 uppercase text-xs tracking-wider">Active Cohort</p>
                  <h2 className="text-6xl font-black">{assignedStartups.length}</h2>
                </div>
             </motion.div>

             <motion.div variants={bentoVariants} className="glass rounded-3xl p-6 bg-white border-green-500/20 flex flex-col justify-between shadow-xl">
                <ShieldCheck className="w-10 h-10 text-green-500" />
                <div>
                  <p className="font-bold text-gray-400 uppercase text-xs tracking-wider">Ready for Market</p>
                  <h2 className="text-6xl font-black text-gray-900">{startups.filter(s => s.status === 'ready').length}</h2>
                </div>
             </motion.div>

             <motion.div variants={bentoVariants} className="glass rounded-3xl p-6 bg-white border-orange-500/20 flex flex-col justify-between shadow-xl">
                <TrendingUp className="w-10 h-10 text-orange-500" />
                <div>
                  <p className="font-bold text-gray-400 uppercase text-xs tracking-wider">Portfolio Impact</p>
                  <h2 className="text-6xl font-black text-gray-900">${(startups.reduce((sum, s) => sum + s.budgetNeeded, 0) / 1000000).toFixed(1)}M</h2>
                </div>
             </motion.div>

             <motion.div variants={bentoVariants} className="md:col-span-3 md:row-span-3 glass rounded-3xl p-8 bg-white shadow-xl flex flex-col">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold">Action Hub</h2>
                   <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none">You have {assignedStartups.length} startups to refine</Badge>
                </div>
                
                {assignedStartups.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                     <Users className="w-12 h-12 text-gray-300 mb-4" />
                     <h3 className="text-xl font-bold text-gray-700 mb-2">Inbox Zero</h3>
                     <p className="text-gray-500 mb-4 max-w-sm">You currently have no active startups. Startups that match your expertise will appear here when they request mentorship.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {assignedStartups.map((startup, i) => (
                      <div key={startup.id} className="p-6 rounded-2xl border border-purple-100 bg-purple-50/30 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between group">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{startup.name}</h3>
                              <p className="text-sm text-gray-500">{startup.industry} • {startup.stage}</p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none">Refining</Badge>
                          </div>
                          <Progress value={startup.aiScore} className="h-2 mb-2 bg-gray-200" indicatorClassName="bg-purple-500" />
                          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-6">
                            <span>Readiness</span>
                            <span className="text-purple-600">{startup.aiScore}/100</span>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t border-purple-100">
                           <p className="text-sm text-gray-600 mb-3 line-clamp-2">{startup.description}</p>
                           <Button 
                             onClick={() => {
                               const updated = [...startups];
                               const idx = updated.findIndex(s => s.id === startup.id);
                               if(idx > -1) {
                                 updated[idx].status = 'ready';
                                 localStorage.setItem('customStartups', JSON.stringify(updated));
                                 window.location.reload();
                               }
                             }} 
                             className="w-full bg-green-500 hover:bg-green-600 text-white rounded-full h-10 shadow-md transition-transform hover:scale-[1.02]"
                           >
                             <CheckCircle className="w-4 h-4 mr-2" /> Mark as Investment Ready
                           </Button>
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

  // ---------------------------------------------------------------------------
  // FUNDER BENTO DASHBOARD
  // ---------------------------------------------------------------------------
  if (userRole === 'funder') {
    const readyStartups = startups.filter(s => s.status === 'ready');
    return (
      <div className="min-h-screen bg-gray-50/50 pb-20">
         <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black mb-1">Deal Flow Command</h1>
              <p className="text-muted-foreground">Access highly curated, AI-vetted investment opportunities.</p>
            </div>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={bentoVariants} className="md:col-span-2 glass rounded-3xl p-8 bg-gradient-vibrant text-white shadow-xl flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="relative z-10 flex justify-between items-start">
                 <div>
                   <p className="font-bold opacity-80 uppercase text-xs tracking-wider mb-2">Total Opportunity Pool</p>
                   <h2 className="text-7xl font-black">${(readyStartups.reduce((sum, s) => sum + s.budgetNeeded, 0) / 1000000).toFixed(1)}M</h2>
                 </div>
                 <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Target className="w-8 h-8 text-white" />
                 </div>
              </div>
              <p className="relative z-10 text-white/80 font-medium">Across {readyStartups.length} investment-ready startups</p>
            </motion.div>

            <motion.div variants={bentoVariants} className="glass rounded-3xl p-6 bg-white shadow-xl border border-gray-100 flex flex-col justify-between">
               <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4"><CheckCircle className="w-6 h-6"/></div>
               <div>
                  <p className="font-bold text-gray-400 uppercase text-xs tracking-wider">Top Tier Matches</p>
                  <h2 className="text-5xl font-black text-gray-900">{readyStartups.filter(s => (s.aiScore || 0) > 80).length}</h2>
               </div>
            </motion.div>

            <motion.div variants={bentoVariants} className="glass rounded-3xl p-6 bg-white shadow-xl border border-gray-100 flex flex-col justify-between">
               <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4"><Users className="w-6 h-6"/></div>
               <div>
                  <p className="font-bold text-gray-400 uppercase text-xs tracking-wider">Co-Invest Syndicates</p>
                  <h2 className="text-5xl font-black text-gray-900">2</h2>
               </div>
            </motion.div>

            <motion.div variants={bentoVariants} className="md:col-span-4 md:row-span-2 glass rounded-3xl p-10 bg-white shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                  <Activity className="w-10 h-10 animate-pulse" />
               </div>
               <h2 className="text-3xl font-black mb-4">Start Sourcing Deals</h2>
               <p className="text-gray-500 max-w-lg mb-8 text-lg">
                 Our AI has curated a list of highly vetted, investment-ready startups that match your investment thesis. Enter the Deal Radar to review them one by one.
               </p>
               <Button onClick={() => navigate('/funder-matching')} size="lg" className="rounded-full shadow-2xl h-16 px-12 text-xl bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white hover:scale-105 transition-all">
                 Open Deal Radar <ArrowRight className="w-6 h-6 ml-3" />
               </Button>
            </motion.div>
          </motion.div>
         </div>
      </div>
    );
  }

  return null;
}
