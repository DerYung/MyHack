import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Briefcase, X, Heart, Sparkles, Building, BarChart, Rocket } from 'lucide-react';
import { mockStartups } from '../lib/mockData';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export function FunderMatching() {
  const navigate = useNavigate();
  // Simulate funder viewing ready startups
  const [deals, setDeals] = useState(() => mockStartups.filter(s => s.status === 'ready' || s.aiScore));
  const [isSearching, setIsSearching] = useState(true);
  const [matchedDeal, setMatchedDeal] = useState<any>(null);

  // Simulated radar loading
  useEffect(() => {
    const timer = setTimeout(() => setIsSearching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSwipe = (direction: 'left' | 'right', dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    
    // Remove the current deal from the stack
    setDeals(prev => prev.filter(d => d.id !== dealId));

    if (direction === 'right') {
      // It's a Match!
      setMatchedDeal(deal);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#eab308', '#3b82f6'] // Green, Yellow, Blue for investment vibe
      });
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
           <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-40 h-40 border border-green-500 rounded-full absolute" />
           <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, delay: 1, repeat: Infinity }} className="w-40 h-40 border border-blue-500 rounded-full absolute" />
           <div className="w-32 h-32 bg-gradient-to-br from-green-600 to-blue-600 rounded-full z-10 flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.5)]">
             <BarChart className="w-12 h-12 text-white animate-pulse" />
           </div>
        </div>
        <h2 className="text-white mt-48 text-2xl font-bold tracking-widest uppercase">Sourcing Deals</h2>
        <p className="text-gray-400 mt-2">Filtering top-tier AI matches for your thesis...</p>
      </div>
    );
  }

  if (matchedDeal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-black to-blue-900 flex items-center justify-center p-4">
         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 text-center shadow-2xl">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-8 italic">Deal Matched!</h1>
            
            <div className="flex justify-center items-center gap-4 mb-8">
               <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 rounded-full bg-gray-800 border-4 border-white flex items-center justify-center text-xl font-bold text-white shadow-xl">
                 FUND
               </motion.div>
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.8)]">
                 <Heart className="w-6 h-6 text-green-500 fill-green-500" />
               </motion.div>
               <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-green-500 border-4 border-white flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                 <Rocket className="w-10 h-10 text-white" />
               </motion.div>
            </div>

            <p className="text-white text-xl mb-4 leading-relaxed">
              You are interested in <span className="font-bold text-green-300">{matchedDeal.name}</span>.
            </p>
            <div className="bg-black/30 rounded-2xl p-4 mb-8 text-left border border-white/10">
               <p className="text-sm text-gray-400 uppercase font-bold mb-1">Deal Parameters</p>
               <div className="flex justify-between items-center mb-2">
                 <span className="text-white">Seeking</span>
                 <span className="font-bold text-green-400">${(matchedDeal.budgetNeeded / 1000).toFixed(0)}K</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-white">AI Compatibility</span>
                 <span className="font-bold text-blue-400">{matchedDeal.aiScore}/100</span>
               </div>
            </div>

            <div className="space-y-4">
              <Button size="lg" className="w-full rounded-full h-14 text-lg bg-green-500 hover:bg-green-600 text-white border-none shadow-[0_0_20px_rgba(34,197,94,0.3)]" onClick={() => navigate(`/investor-brief/${matchedDeal.id}`)}>
                <BarChart className="w-5 h-5 mr-2" /> View Full Intelligence Brief
              </Button>
              <Button size="lg" variant="outline" className="w-full rounded-full h-14 text-lg border-white/30 text-white hover:bg-white/10" onClick={() => setMatchedDeal(null)}>
                Review More Deals
              </Button>
            </div>
         </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center z-10 sticky top-0">
        <Button variant="ghost" className="rounded-full w-12 h-12 p-0 bg-white shadow-md hover:bg-gray-50" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center">
           <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-500">Deal Flow</h1>
           <p className="text-xs font-bold text-gray-500 uppercase">Curated by AI</p>
        </div>
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>

      {/* Card Stack Area */}
      <div className="flex-1 relative flex justify-center items-center overflow-hidden p-4">
        {deals.length === 0 ? (
          <div className="text-center p-8 glass rounded-3xl">
             <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
               <Briefcase className="w-10 h-10 text-gray-400" />
             </div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">Inbox Zero</h2>
             <p className="text-gray-500 mb-6">No more deals match your exact criteria right now.</p>
             <Button onClick={() => navigate('/dashboard')} className="rounded-full">Back to Command Center</Button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm aspect-[3/4.5]">
            <AnimatePresence>
              {deals.map((deal, index) => {
                const isTop = index === 0;
                
                return (
                  <motion.div
                    key={deal.id}
                    className="absolute inset-0 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 flex flex-col"
                    style={{
                      zIndex: deals.length - index,
                      ...(isTop ? { x, rotate, opacity } : { scale: 1 - index * 0.05, y: index * 20 })
                    }}
                    drag={isTop ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = offset.x;
                      if (swipe > 100) handleSwipe('right', deal.id);
                      else if (swipe < -100) handleSwipe('left', deal.id);
                    }}
                  >
                    {/* Overlays for swipe feedback */}
                    {isTop && (
                      <>
                        <motion.div style={{ opacity: crossOpacity }} className="absolute top-10 right-10 z-50 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-1 rounded-xl rotate-12 bg-white/80 backdrop-blur-sm">
                          PASS
                        </motion.div>
                        <motion.div style={{ opacity: heartOpacity }} className="absolute top-10 left-10 z-50 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-1 rounded-xl -rotate-12 bg-white/80 backdrop-blur-sm">
                          INVEST
                        </motion.div>
                      </>
                    )}

                    {/* Deal Image / Cover */}
                    <div className="h-[45%] bg-gradient-to-br from-green-500 to-blue-600 relative flex flex-col justify-end p-6 overflow-hidden">
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                       <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-black flex items-center gap-1 shadow-lg border border-white/20">
                          <Sparkles className="w-4 h-4 text-green-300" /> {deal.aiScore}% Match
                       </div>
                       
                       <div className="relative z-10">
                         <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-4 border-4 border-white/20 backdrop-blur-sm">
                            <Rocket className="w-8 h-8 text-blue-600" />
                         </div>
                         <h2 className="text-4xl font-black text-white leading-none drop-shadow-md">{deal.name}</h2>
                       </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex gap-2 mb-4">
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none shadow-none">{deal.industry}</Badge>
                        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none shadow-none">{deal.stage}</Badge>
                      </div>

                      <p className="text-gray-600 mb-6 flex-1 line-clamp-4 leading-relaxed font-medium">
                        {deal.description}
                      </p>

                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                         <div className="flex justify-between items-center">
                            <div>
                               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Seeking Investment</p>
                               <p className="text-2xl font-black text-green-600">${(deal.budgetNeeded / 1000).toFixed(0)}K</p>
                            </div>
                            <div className="text-right">
                               <p className="text-xs font-bold text-gray-400 uppercase mb-1">Market Potential</p>
                               <p className="text-lg font-bold text-gray-900 capitalize">{deal.marketPotential}</p>
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

      {/* Swipe Controls */}
      {deals.length > 0 && (
        <div className="p-6 flex justify-center gap-8 mb-4">
           <Button 
             variant="outline" 
             className="w-20 h-20 rounded-full border-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-xl hover:scale-110 transition-all bg-white"
             onClick={() => handleSwipe('left', deals[0].id)}
           >
             <X className="w-10 h-10" />
           </Button>
           <Button 
             variant="outline" 
             className="w-20 h-20 rounded-full border-2 border-green-100 text-green-500 hover:bg-green-50 hover:text-green-600 shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:scale-110 transition-all bg-white"
             onClick={() => handleSwipe('right', deals[0].id)}
           >
             <Heart className="w-10 h-10 fill-current" />
           </Button>
        </div>
      )}
    </div>
  );
}
