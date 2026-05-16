import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Users, Award, Briefcase, X, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { mockStartups, mockMentors } from '../lib/mockData';
import { matchMentors } from '../lib/matching';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export function MentorMatching() {
  const navigate = useNavigate();
  const startup = mockStartups[0];
  const [mentors, setMentors] = useState(() => matchMentors(startup, mockMentors));
  const [isSearching, setIsSearching] = useState(true);
  const [matchedMentor, setMatchedMentor] = useState<any>(null);

  // Simulated radar loading
  useEffect(() => {
    const timer = setTimeout(() => setIsSearching(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSwipe = (direction: 'left' | 'right', mentorId: string) => {
    const mentor = mentors.find(m => m.id === mentorId);
    
    // Remove the current mentor from the stack
    setMentors(prev => prev.filter(m => m.id !== mentorId));

    if (direction === 'right') {
      // It's a Match!
      setMatchedMentor(mentor);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#3b82f6']
      });

      // Update startup status to mentoring
      const customStartupsStr = localStorage.getItem('customStartups');
      if (customStartupsStr) {
        const startups = JSON.parse(customStartupsStr);
        if (startups.length > 0) {
          startups[0].status = 'mentoring';
          startups[0].mentorId = mentor?.id;
          localStorage.setItem('customStartups', JSON.stringify(startups));
        }
      }
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
           <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-32 h-32 border border-purple-500 rounded-full absolute" />
           <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, delay: 1, repeat: Infinity }} className="w-32 h-32 border border-pink-500 rounded-full absolute" />
           <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full z-10 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.5)]">
             <Sparkles className="w-10 h-10 text-white animate-pulse" />
           </div>
        </div>
        <h2 className="text-white mt-48 text-2xl font-bold tracking-widest uppercase">Finding Your Match</h2>
        <p className="text-gray-400 mt-2">Analyzing 10,000+ mentor profiles...</p>
      </div>
    );
  }

  if (matchedMentor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center p-4">
         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 text-center shadow-2xl">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-8 italic">It's a Match!</h1>
            
            <div className="flex justify-center items-center gap-4 mb-8">
               <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                 ME
               </motion.div>
               <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring" }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                 <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
               </motion.div>
               <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                 {matchedMentor.name[0]}
               </motion.div>
            </div>

            <p className="text-white text-xl mb-8 leading-relaxed">
              You and <span className="font-bold text-pink-300">{matchedMentor.name}</span> have a <span className="font-bold text-green-400">{matchedMentor.matchScore}%</span> compatibility score!
            </p>

            <div className="space-y-4">
              <Button size="lg" className="w-full rounded-full h-14 text-lg bg-white text-purple-900 hover:bg-gray-100" onClick={() => navigate('/dashboard')}>
                <MessageCircle className="w-5 h-5 mr-2" /> Send a Message
              </Button>
              <Button size="lg" variant="outline" className="w-full rounded-full h-14 text-lg border-white/30 text-white hover:bg-white/10" onClick={() => setMatchedMentor(null)}>
                Keep Swiping
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
           <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">Discover Mentors</h1>
           <p className="text-xs font-bold text-gray-500 uppercase">For {startup.name}</p>
        </div>
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>

      {/* Card Stack Area */}
      <div className="flex-1 relative flex justify-center items-center overflow-hidden p-4">
        {mentors.length === 0 ? (
          <div className="text-center p-8 glass rounded-3xl">
             <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
               <Users className="w-10 h-10 text-gray-400" />
             </div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">No More Mentors</h2>
             <p className="text-gray-500 mb-6">You've seen all the matches in your area.</p>
             <Button onClick={() => setMentors(matchMentors(startup, mockMentors))} className="rounded-full">Refresh List</Button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm aspect-[3/4]">
            <AnimatePresence>
              {mentors.map((mentor, index) => {
                const isTop = index === 0;
                
                return (
                  <motion.div
                    key={mentor.id}
                    className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
                    style={{
                      zIndex: mentors.length - index,
                      ...(isTop ? { x, rotate, opacity } : { scale: 1 - index * 0.05, y: index * 20 })
                    }}
                    drag={isTop ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = offset.x;
                      if (swipe > 100) handleSwipe('right', mentor.id);
                      else if (swipe < -100) handleSwipe('left', mentor.id);
                    }}
                  >
                    {/* Overlays for swipe feedback */}
                    {isTop && (
                      <>
                        <motion.div style={{ opacity: crossOpacity }} className="absolute top-10 right-10 z-50 border-4 border-red-500 text-red-500 font-black text-4xl px-4 py-1 rounded-xl rotate-12">
                          PASS
                        </motion.div>
                        <motion.div style={{ opacity: heartOpacity }} className="absolute top-10 left-10 z-50 border-4 border-green-500 text-green-500 font-black text-4xl px-4 py-1 rounded-xl -rotate-12">
                          MATCH
                        </motion.div>
                      </>
                    )}

                    {/* Profile Card Content */}
                    <div className="h-2/5 bg-gradient-to-br from-purple-500 to-pink-500 relative flex items-center justify-center p-6">
                       <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                          <Sparkles className="w-4 h-4 text-yellow-300" /> {mentor.matchScore}% Match
                       </div>
                       <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center text-5xl font-black text-purple-600">
                          {mentor.name[0]}
                       </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-4">
                        <h2 className="text-3xl font-black text-gray-900">{mentor.name}</h2>
                        <div className="flex items-center text-gray-500 gap-1 font-medium mt-1">
                          <Briefcase className="w-4 h-4" /> {mentor.yearsExperience} years experience
                        </div>
                      </div>

                      <p className="text-gray-600 mb-6 flex-1 line-clamp-3 leading-relaxed">
                        "{mentor.bio}"
                      </p>

                      <div className="space-y-4">
                        <div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Top Skills</p>
                           <div className="flex flex-wrap gap-2">
                             {mentor.expertise.slice(0, 3).map(skill => (
                               <Badge key={skill} variant="secondary" className="bg-purple-50 text-purple-700">{skill}</Badge>
                             ))}
                           </div>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Industries</p>
                           <div className="flex flex-wrap gap-2">
                             {mentor.industries.map(ind => (
                               <Badge key={ind} variant="outline">{ind}</Badge>
                             ))}
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
      {mentors.length > 0 && (
        <div className="p-6 flex justify-center gap-8 mb-4">
           <Button 
             variant="outline" 
             className="w-20 h-20 rounded-full border-2 border-red-100 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-xl hover:scale-110 transition-all bg-white"
             onClick={() => handleSwipe('left', mentors[0].id)}
           >
             <X className="w-10 h-10" />
           </Button>
           <Button 
             variant="outline" 
             className="w-20 h-20 rounded-full border-2 border-green-100 text-green-500 hover:bg-green-50 hover:text-green-600 shadow-xl hover:scale-110 transition-all bg-white"
             onClick={() => handleSwipe('right', mentors[0].id)}
           >
             <Heart className="w-10 h-10 fill-current" />
           </Button>
        </div>
      )}
    </div>
  );
}
