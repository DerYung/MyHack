import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Briefcase, X, Sparkles, Handshake, Rocket } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { getCompaniesByStatus } from '../services/firestoreStartupService';
import { createLinkage } from '../services/firestoreLinkageService';
import { useAuth } from '../contexts/AuthContext';
import { CompanyDoc } from '../types/firestore';

export function MentorMatching() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [startups, setStartups] = useState<CompanyDoc[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedStartup, setMatchedStartup] = useState<CompanyDoc | null>(null);

  useEffect(() => {
    async function loadStartups() {
      try {
        const companies = await getCompaniesByStatus('submitted');
        setStartups(companies);
      } catch (err) {
        toast.error("Failed to fetch startups");
      } finally {
        setTimeout(() => setIsSearching(false), 1500);
      }
    }
    loadStartups();
  }, []);

  const handleSwipe = async (direction: 'left' | 'right', startupUid: string) => {
    if (isSubmitting) return;
    const startup = startups.find(s => s.uid === startupUid);
    if (!startup) return;

    if (direction === 'right') {
      if (!user) {
        toast.error("You must be logged in to match with startups");
        return;
      }

      setIsSubmitting(true);
      try {
        await createLinkage({
          type: 'mentor-matching',
          mentor_uid: user.uid,
          company_uid: startup.uid,
          status: 'active'
        });
        
        import('../services/firestoreStartupService').then(({ updateCompany }) => {
           updateCompany(startup.uid, {
             status: 'mentoring',
             mentor_uid: user.uid
           });
        });
        
        setMatchedStartup(startup);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#ec4899', '#3b82f6']
        });
        
        setStartups(prev => prev.filter(s => s.uid !== startupUid));
      } catch (err) {
        toast.error("Failed to register interest");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStartups(prev => prev.filter(s => s.uid !== startupUid));
    }
  };

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const crossOpacity = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const heartOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1]);

  if (isSearching) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
           <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-40 h-40 border border-purple-500 rounded-full absolute" />
           <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, delay: 1, repeat: Infinity }} className="w-40 h-40 border border-pink-500 rounded-full absolute" />
           <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full z-10 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.5)]">
             <Sparkles className="w-12 h-12 text-white animate-pulse" />
           </div>
        </div>
        <h2 className="text-white mt-48 text-2xl font-bold tracking-widest uppercase">Sourcing Startups</h2>
        <p className="text-gray-400 mt-2">Finding founders who need your expertise...</p>
      </div>
    );
  }

  if (matchedStartup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 text-center shadow-2xl">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8 italic">Request Sent!</h1>
            
            <div className="flex justify-center items-center gap-4 mb-8">
               <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 rounded-full bg-gray-800 border-4 border-white flex items-center justify-center text-xl font-bold text-white shadow-xl">
                 ME
               </motion.div>
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.8)]">
                 <Handshake className="w-6 h-6 text-purple-500" />
               </motion.div>
               <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border-4 border-white flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                 <Rocket className="w-10 h-10 text-white" />
               </motion.div>
            </div>

            <p className="text-white text-xl mb-4 leading-relaxed">
              You've offered to mentor <span className="font-bold text-purple-300">{matchedStartup.name}</span>.
            </p>
            <div className="bg-black/30 rounded-2xl p-4 mb-8 text-left border border-white/10">
               <p className="text-sm text-gray-400 uppercase font-bold mb-1">Next Steps</p>
               <p className="text-white text-sm">You are now actively mentoring this startup. They have been notified and you can begin your journey together from your dashboard.</p>
            </div>

            <div className="space-y-4">
              <Button size="lg" className="w-full rounded-full h-14 text-lg bg-purple-500 hover:bg-purple-600 text-white border-none shadow-[0_0_20px_rgba(168,85,247,0.3)]" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
              <Button size="lg" variant="outline" className="w-full rounded-full h-14 text-lg border-white/30 text-white hover:bg-white/10" onClick={() => setMatchedStartup(null)}>
                Review More Startups
              </Button>
            </div>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="p-4 flex justify-between items-center z-10 sticky top-0">
        <Button variant="ghost" className="rounded-full w-12 h-12 p-0 bg-white shadow-md hover:bg-gray-50" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center">
           <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">Mentor Radar</h1>
           <p className="text-xs font-bold text-gray-500 uppercase">Curated by AI</p>
        </div>
        <div className="w-12 h-12" />
      </div>

      <div className="flex-1 relative flex justify-center items-center overflow-hidden p-4">
        {startups.length === 0 ? (
          <div className="text-center p-8 glass rounded-3xl">
             <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
               <Briefcase className="w-10 h-10 text-gray-400" />
             </div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">Inbox Zero</h2>
             <p className="text-gray-500 mb-6">There are no startups looking for mentors right now.</p>
             <Button onClick={() => navigate('/dashboard')} className="rounded-full">Back to Command Center</Button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm aspect-[3/4.5]">
            <AnimatePresence>
              {startups.map((startup, index) => {
                const isTop = index === 0;
                
                return (
                  <motion.div
                    key={startup.uid}
                    className="absolute inset-0 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 flex flex-col"
                    style={{
                      zIndex: startups.length - index,
                      ...(isTop ? { x, rotate, opacity } : { scale: 1 - index * 0.05, y: index * 20 })
                    }}
                    drag={isTop ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset }) => {
                      const swipe = offset.x;
                      if (swipe > 100) handleSwipe('right', startup.uid);
                      else if (swipe < -100) handleSwipe('left', startup.uid);
                    }}
                  >
                    {isTop && (
                      <>
                        <motion.div style={{ opacity: crossOpacity }} className="absolute top-10 right-10 z-50 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-1 rounded-xl rotate-12 bg-white/80 backdrop-blur-sm">
                          PASS
                        </motion.div>
                        <motion.div style={{ opacity: heartOpacity }} className="absolute top-10 left-10 z-50 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-1 rounded-xl -rotate-12 bg-white/80 backdrop-blur-sm">
                          MENTOR
                        </motion.div>
                      </>
                    )}

                    <div className="h-[45%] bg-gradient-to-br from-purple-500 to-pink-600 relative flex flex-col justify-end p-6 overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                       <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-1 shadow-lg border border-white/20">
                          <Sparkles className="w-4 h-4 text-pink-300" /> {startup.ai_score || 85}% Match
                       </div>
                       
                       <div className="relative z-10">
                         <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-4 border-4 border-white/20 backdrop-blur-sm">
                            <Rocket className="w-8 h-8 text-purple-600" />
                         </div>
                         <h2 className="text-4xl font-black text-white leading-none drop-shadow-md">{startup.name}</h2>
                       </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex gap-2 mb-4">
                        <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-100 border-none shadow-none">{startup.sector}</Badge>
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none shadow-none">{startup.stage}</Badge>
                      </div>

                      <p className="text-gray-600 mb-6 flex-1 line-clamp-4 leading-relaxed font-medium">
                        {startup.description}
                      </p>

                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                         <div className="flex justify-between items-center">
                            <div>
                               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Needs Help With</p>
                               <p className="text-lg font-bold text-gray-900 capitalize truncate w-32" title={startup.market_goals}>{startup.market_goals || "General Strategy"}</p>
                            </div>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {startups.length > 0 && (
        <div className="p-6 flex justify-center gap-8 mb-4">
           <Button 
             variant="outline" 
             className="w-20 h-20 rounded-full border-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-xl hover:scale-110 transition-all bg-white"
             onClick={() => handleSwipe('left', startups[0].uid!)}
             disabled={isSubmitting}
           >
             <X className="w-10 h-10" />
           </Button>
           <Button 
             variant="outline" 
             className="w-20 h-20 rounded-full border-2 border-green-100 text-green-500 hover:bg-green-50 hover:text-green-600 shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:scale-110 transition-all bg-white"
             onClick={() => handleSwipe('right', startups[0].uid!)}
             disabled={isSubmitting}
           >
             <Handshake className="w-10 h-10" />
           </Button>
        </div>
      )}
    </div>
  );
}
