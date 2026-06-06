import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Loader2, DollarSign, Handshake, Trash2, BookMarked, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { getFunder } from '../services/firestoreFunderService';
import { createLinkage } from '../services/firestoreLinkageService';
import { updateCompany } from '../services/firestoreStartupService';
import type { FunderDoc } from '../types/firestore';
import { getSavedFunderIds, removeSavedFunderId, formatCurrency } from './StartupFunderBrowse';

export function SavedFunders() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [funders, setFunders]       = useState<FunderDoc[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const ids = getSavedFunderIds(user!.uid);
      if (ids.length === 0) { setLoading(false); return; }
      try {
        const docs = await Promise.all(ids.map(id => getFunder(id)));
        setFunders(docs.filter(Boolean) as FunderDoc[]);
      } catch {
        toast.error('Failed to load saved funders');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleConnect = async (funder: FunderDoc) => {
    if (!user) return;
    setConnecting(funder.uid);
    try {
      await createLinkage({ type: 'funder-syndication', funder_uid: funder.uid, company_uid: user.uid, status: 'active' });
      await updateCompany(user.uid, { status: 'matched' });
      removeSavedFunderId(user.uid, funder.uid);
      setFunders(p => p.filter(f => f.uid !== funder.uid));
      toast.success(`Connected with ${funder.name}!`);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#0d9488', '#06b6d4'] });
    } catch {
      toast.error('Failed to connect — please try again');
    } finally {
      setConnecting(null);
    }
  };

  const handleRemove = (funder: FunderDoc) => {
    removeSavedFunderId(user!.uid, funder.uid);
    setFunders(p => p.filter(f => f.uid !== funder.uid));
    toast('Removed from saved', { icon: '🗑️' });
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0" onClick={() => navigate('/find-funders')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <BookMarked className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-black">Saved Funders</h1>
          </div>
          <span className="text-sm text-gray-400 font-medium">{funders.length} saved</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>

        ) : funders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
            <BookMarked className="w-14 h-14 opacity-20" />
            <p className="text-base font-medium">No saved funders yet.</p>
            <Button onClick={() => navigate('/find-funders')} className="rounded-full bg-teal-600 hover:bg-teal-700 text-white mt-2">
              Browse Funders
            </Button>
          </motion.div>

        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {funders.map((funder, idx) => (
                <motion.div
                  key={funder.uid}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden"
                >
                  {/* Colour strip header */}
                  <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-500" />

                  <div className="p-6 flex flex-col gap-4 flex-1">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-md shadow-teal-500/20">
                        {funder.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-gray-900 truncate text-lg">{funder.name}</h3>
                        <p className="text-xs text-gray-400">{funder.region}</p>
                      </div>
                    </div>

                    {/* Bio */}
                    {funder.bio && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{funder.bio}</p>
                    )}

                    {/* Investment range */}
                    <div className="flex items-center gap-2 bg-teal-50 rounded-xl px-4 py-2.5">
                      <DollarSign className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-sm font-bold text-gray-800">
                        {formatCurrency(funder.min_investment)} – {formatCurrency(funder.max_investment)}
                      </span>
                      {funder.successful_investments > 0 && (
                        <>
                          <span className="text-gray-300 mx-1">·</span>
                          <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-500">{funder.successful_investments} exits</span>
                        </>
                      )}
                    </div>

                    {/* Focus tags */}
                    {funder.investment_focus?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {funder.investment_focus.slice(0, 4).map(tag => (
                          <Badge key={tag} className="bg-teal-50 text-teal-700 border-none text-xs font-medium hover:bg-teal-100">{tag}</Badge>
                        ))}
                        {funder.investment_focus.length > 4 && (
                          <Badge className="bg-gray-100 text-gray-500 border-none text-xs">+{funder.investment_focus.length - 4}</Badge>
                        )}
                      </div>
                    )}

                    {/* Stage interest */}
                    {funder.stage_interest?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {funder.stage_interest.map(s => (
                          <span key={s} className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-2">
                      <Button
                        onClick={() => handleConnect(funder)}
                        disabled={connecting === funder.uid}
                        className="flex-1 rounded-2xl h-11 font-bold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md hover:shadow-teal-500/30 hover:scale-[1.02] transition-all"
                      >
                        {connecting === funder.uid
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connecting…</>
                          : <><Handshake className="w-4 h-4 mr-2" /> Connect</>}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleRemove(funder)}
                        disabled={connecting === funder.uid}
                        className="w-11 h-11 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
