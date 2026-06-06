import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Target, CheckCircle, Users, Activity, ArrowRight, Loader2, Undo2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { getCompaniesByStatus, updateCompany, getCompany } from '../services/firestoreStartupService';
import { getFunder } from '../services/firestoreFunderService';
import { getLinkagesForFunder, updateLinkage } from '../services/firestoreLinkageService';
import { EcosystemGraph } from '../components/EcosystemGraph';
import type { CompanyDoc, FunderDoc, LinkageDoc } from '../types/firestore';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const bentoVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function FunderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [readyStartups, setReadyStartups] = useState<CompanyDoc[]>([]);
  const [funder, setFunder] = useState<FunderDoc | null>(null);
  const [activeDeals, setActiveDeals] = useState<{ linkage: LinkageDoc; company: CompanyDoc }[]>([]);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const unsubscribe = onSnapshot(
      doc(db, 'funders', user.uid),
      async (docSnap) => {
        if (docSnap.exists()) {
          const funderDoc = { ...docSnap.data(), uid: docSnap.id } as FunderDoc;
          setFunder(funderDoc);
          
          try {
            const [companies, linkages] = await Promise.all([
              getCompaniesByStatus('ready'),
              getLinkagesForFunder(docSnap.id),
            ]);
            setReadyStartups(companies);

            const activeLinkages = linkages.filter(l => l.status === 'active');
            const deals = await Promise.all(
              activeLinkages.map(async l => {
                const company = await getCompany(l.company_uid);
                return company ? { linkage: l, company } : null;
              })
            );
            setActiveDeals(deals.filter(Boolean) as { linkage: LinkageDoc; company: CompanyDoc }[]);
          } catch (err) {
            console.error('Failed to fetch deal flow data:', err);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Failed to fetch funder data:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
          <p className="text-lg font-medium text-gray-500">Loading Deal Flow...</p>
        </motion.div>
      </div>
    );
  }

  // ── Pending Verification State ─────────────────────────────────────────────
  if (funder && !funder.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-3xl p-12 max-w-md text-center shadow-2xl border border-yellow-200 bg-white">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Verification</h2>
          <p className="text-gray-500 mb-6">Your funder profile is currently being reviewed by an Administrator. You will be able to access the Deal Radar once verified.</p>
        </motion.div>
      </div>
    );
  }

  const handleWithdraw = async (linkageId: string, companyUid: string) => {
    setWithdrawing(linkageId);
    try {
      await updateLinkage(linkageId, { status: 'rejected' });
      await updateCompany(companyUid, { status: 'ready' });
      setActiveDeals(prev => prev.filter(d => d.linkage.id !== linkageId));
      toast.success('Interest withdrawn — startup returned to deal flow');
    } catch {
      toast.error('Failed to withdraw interest');
    } finally {
      setWithdrawing(null);
    }
  };

  const totalPool = readyStartups.reduce((sum, s) => sum + (s.budget_needed || 0), 0);
  const topTier = readyStartups.filter(s => (s.ai_score ?? 0) > 80).length;

  const formatCurrency = (val: number) => {
    if (val === 0) return "$0";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val}`;
  };

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
                 <h2 className="text-7xl font-black">{formatCurrency(totalPool)}</h2>
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
                <h2 className="text-5xl font-black text-gray-900">{topTier}</h2>
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
             <div className="relative z-10 flex flex-col items-center">
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
             </div>
          </motion.div>
        </motion.div>

        {/* Active Deals — withdraw section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900">My Active Deals</h2>
            <span className="text-sm text-gray-400">{activeDeals.length} deal{activeDeals.length !== 1 ? 's' : ''} accepted</span>
          </div>

          {activeDeals.length === 0 ? (
            <div className="flex items-center gap-4 p-6 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
              <Undo2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">No active deals yet. Once you accept a deal in the Deal Radar, it appears here — with a <span className="font-semibold">Withdraw</span> button to undo it.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {activeDeals.map(({ linkage, company }) => (
                <motion.div
                  key={linkage.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{company.name}</p>
                      <p className="text-sm text-gray-400">{company.sector} · {company.stage} · ${(company.budget_needed / 1000).toFixed(0)}K</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleWithdraw(linkage.id, company.uid)}
                    disabled={withdrawing === linkage.id}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                  >
                    {withdrawing === linkage.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Undo2 className="w-4 h-4" />}
                    Withdraw
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {user && <EcosystemGraph uid={user.uid} role="Funder" />}
       </div>
    </div>
  );
}
