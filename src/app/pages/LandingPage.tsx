import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { motion, useScroll, useTransform } from 'motion/react';
import { Rocket, Users, TrendingUp, Sparkles, BrainCircuit, FileText, Network, CheckCircle } from 'lucide-react';

export function LandingPage() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  // Parallax effects
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-sans">
      
      {/* --- Organic Ambient Backgrounds --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-teal-400/20 blur-[140px] rounded-[40%_60%_70%_30%/40%_50%_60%_50%]"
        />
        <motion.div
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] bg-cyan-400/10 blur-[160px] rounded-[60%_40%_30%_70%/50%_40%_60%_50%]"
        />
      </div>

      {/* --- HERO SECTION --- */}
      <motion.div style={{ y: yHero, opacity: opacityHero }} className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 pt-20">
        <Badge className="mb-8 px-5 py-2 text-sm font-bold shadow-2xl shadow-primary/30 border border-white/20 backdrop-blur-md">
          <Sparkles className="w-4 h-4 mr-2" />
          Startups · Mentors · Funders — Connected by AI
        </Badge>

        <h1 className="text-6xl md:text-8xl font-black text-center tracking-tighter leading-tight max-w-5xl mb-8">
          The Ecosystem That<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-teal-500 via-cyan-500 to-sky-400">
            Links You Forward
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground text-center max-w-2xl mb-16 font-light leading-relaxed">
          Not just another platform. An intelligent web of relationships connecting startups, mentors, and funders.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
          <button 
            onClick={() => setSelectedRole('startup')}
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all duration-300 ${selectedRole === 'startup' ? 'bg-gradient-vibrant text-white shadow-lg scale-105' : 'hover:bg-white/10 text-foreground'}`}
          >
            <Rocket className="w-5 h-5" /> Startup
          </button>
          <button 
            onClick={() => setSelectedRole('mentor')}
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all duration-300 ${selectedRole === 'mentor' ? 'bg-gradient-vibrant text-white shadow-lg scale-105' : 'hover:bg-white/10 text-foreground'}`}
          >
            <Users className="w-5 h-5" /> Mentor
          </button>
          <button 
            onClick={() => setSelectedRole('funder')}
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all duration-300 ${selectedRole === 'funder' ? 'bg-gradient-vibrant text-white shadow-lg scale-105' : 'hover:bg-white/10 text-foreground'}`}
          >
            <TrendingUp className="w-5 h-5" /> Funder
          </button>
        </div>

        <div className="h-24 mt-8 flex justify-center items-start">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <Button onClick={handleGetStarted} size="lg" className="h-16 px-12 text-xl rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-2xl hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300">
              {selectedRole === 'startup' && "Launch Your Project"}
              {selectedRole === 'mentor' && "Enter Mentor Station"}
              {selectedRole === 'funder' && "Access Deal Flow"}
              {!selectedRole && "Get Started"}
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </motion.div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-6 h-10 border-2 border-current rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-1.5 bg-current rounded-full" />
          </div>
        </div>
      </motion.div>

      {/* --- CATEGORIZED FUNCTIONS --- */}
      <div className="relative z-10 container mx-auto px-4 pb-40 space-y-40">
        
        {/* Function A: Ingestion & Refinement */}
        <motion.section 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row items-center gap-16"
        >
          <div className="lg:w-1/2 relative">
            <div className="absolute inset-0 bg-teal-400/20 blur-[100px] rounded-full" />
            <div className="relative glass p-8 rounded-[40px] border border-white/20 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <div className="w-12 h-4 bg-gray-200 rounded-full" />
                <div className="w-4 h-4 bg-green-400 rounded-full shadow-[0_0_15px_rgba(74,222,128,0.5)]" />
              </div>
              <div className="space-y-6">
                <div className="h-16 bg-white/50 rounded-2xl border border-white/40 flex items-center px-4 gap-4">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center"><Rocket className="w-4 h-4 text-teal-600"/></div>
                  <div className="h-4 w-1/2 bg-teal-100 rounded-full" />
                </div>
                <div className="h-16 bg-white/50 rounded-2xl border border-white/40 flex items-center px-4 gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center"><BrainCircuit className="w-4 h-4 text-cyan-600"/></div>
                  <div className="h-4 w-2/3 bg-cyan-100 rounded-full" />
                </div>
                <div className="h-16 bg-gradient-vibrant rounded-2xl flex items-center px-4 gap-4 shadow-lg text-white font-bold">
                  <Sparkles className="w-5 h-5" /> Idea Refined & Processed
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-700 mb-2">
              <span className="text-2xl font-black">01</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Idea Ingestion & Refinement</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Startups don't just fill out a form. They enter an interactive sandbox where budgets are estimated, business models are analyzed, and strategy is refined before anyone else even sees it.
            </p>
          </div>
        </motion.section>

        {/* Function B: AI Mentor Matching */}
        <motion.section 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col-reverse lg:flex-row items-center gap-16"
        >
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 text-cyan-700 mb-2">
              <span className="text-2xl font-black">02</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Dynamic Mentor Matching</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Our AI doesn't just look at keywords. It analyzes industry experience, past success rates, and skill gaps to forge a mentorship bond that actually moves the needle.
            </p>
          </div>
          <div className="lg:w-1/2 relative h-[400px] w-full">
             <div className="absolute inset-0 bg-teal-400/20 blur-[100px] rounded-full" />
             {/* Interactive Node Graph Simulation */}
             <div className="absolute inset-0 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }} className="w-64 h-64 border border-teal-500/30 rounded-full absolute" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} className="w-96 h-96 border border-cyan-400/20 rounded-full absolute" />
                
                <div className="absolute w-20 h-20 bg-white shadow-2xl rounded-2xl z-20 flex items-center justify-center border-2 border-primary">
                  <Rocket className="w-8 h-8 text-primary" />
                </div>
                
                {/* Floating Mentor Nodes */}
                {[
                  { x: -120, y: -80, icon: Users, color: "text-teal-600", bg: "bg-teal-100" },
                  { x: 120, y: -60, icon: Users, color: "text-cyan-600", bg: "bg-cyan-100" },
                  { x: 0, y: 140, icon: Users, color: "text-sky-600", bg: "bg-sky-100" },
                ].map((node, i) => (
                  <motion.div 
                    key={i}
                    animate={{ x: node.x, y: node.y, scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: i }}
                    className={`absolute w-14 h-14 ${node.bg} rounded-full shadow-lg flex items-center justify-center border-2 border-white z-10`}
                  >
                    <node.icon className={`w-6 h-6 ${node.color}`} />
                    {i === 2 && (
                      <svg className="absolute inset-0 w-full h-full -z-10 overflow-visible">
                        <line x1="50%" y1="50%" x2="50%" y2="-80px" stroke="url(#gradient)" strokeWidth="3" strokeDasharray="5,5" className="animate-pulse" />
                        <defs>
                          <linearGradient id="gradient">
                            <stop offset="0%" stopColor="#0d9488" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                    )}
                  </motion.div>
                ))}
             </div>
          </div>
        </motion.section>

        {/* Function C: Intelligence Briefs */}
        <motion.section 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col lg:flex-row items-center gap-16"
        >
          <div className="lg:w-1/2 relative perspective-1000">
            <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full" />
            <motion.div 
              whileHover={{ rotateY: 5, rotateX: 5, scale: 1.05 }}
              className="relative glass p-8 rounded-[30px] border-t border-l border-white/40 shadow-2xl origin-left"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg mb-8">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Project Phoenix | Brief</h3>
              <div className="space-y-4 mb-6">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} whileInView={{ width: "85%" }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-teal-500" />
                </div>
                <div className="h-2 w-3/4 bg-gray-200 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} whileInView={{ width: "60%" }} transition={{ duration: 1.5, delay: 0.7 }} className="h-full bg-cyan-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-xl bg-white/50 border border-white/20">
                    <p className="text-xs text-gray-500 uppercase font-bold">Market Size</p>
                    <p className="text-xl font-bold">$4.2B</p>
                 </div>
                 <div className="p-4 rounded-xl bg-white/50 border border-white/20">
                    <p className="text-xs text-gray-500 uppercase font-bold">AI Score</p>
                    <p className="text-xl font-bold text-green-600">94/100</p>
                 </div>
              </div>
            </motion.div>
          </div>
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sky-100 text-sky-700 mb-2">
              <span className="text-2xl font-black">03</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Automated Intelligence Briefs</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Once an idea is matured, our system automatically translates raw startup data into a polished, investor-focused intelligence brief highlighting market potential and compatibility.
            </p>
          </div>
        </motion.section>

        {/* Function D: Syndication */}
        <motion.section 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 0.8 }}
          className="flex flex-col-reverse lg:flex-row items-center gap-16"
        >
          <div className="lg:w-1/2 space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-700 mb-2">
              <span className="text-2xl font-black">04</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Co-Investment Syndication</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              If a funder loves an idea but can't cover the full round, our AI instantly recommends synergistic co-investment opportunities, building a super-team of backers.
            </p>
          </div>
          <div className="lg:w-1/2 relative">
             <div className="absolute inset-0 bg-sky-400/20 blur-[100px] rounded-full" />
             <div className="relative grid grid-cols-2 gap-4">
                <motion.div whileHover={{ y: -10 }} className="p-6 glass rounded-3xl border border-white/20 col-span-2 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><Rocket className="w-6 h-6"/></div>
                      <div>
                        <p className="font-bold">Startup Alpha</p>
                        <p className="text-sm text-gray-500">Needs $500K</p>
                      </div>
                   </div>
                   <Badge className="bg-teal-100 text-teal-700">Ready</Badge>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-white rounded-3xl border-2 border-teal-500 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500 rounded-bl-full" />
                   <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-white" />
                   <TrendingUp className="w-8 h-8 text-teal-500 mb-4" />
                   <p className="font-bold">Lead Investor</p>
                   <p className="text-sm text-gray-500">Committing $300K</p>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-white rounded-3xl border border-gray-200 shadow-lg opacity-80 border-dashed border-2">
                   <Network className="w-8 h-8 text-cyan-500 mb-4" />
                   <p className="font-bold">Co-Investor Match</p>
                   <p className="text-sm text-cyan-600 font-medium">Fills $200K Gap</p>
                </motion.div>
             </div>
          </div>
        </motion.section>

      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
