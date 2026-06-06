import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Loader2, DollarSign, Handshake, Bookmark, Rocket, BookMarked } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence, animate } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { getAllFunders } from '../services/firestoreFunderService';
import { getLinkagesForCompany, createLinkage } from '../services/firestoreLinkageService';
import { updateCompany } from '../services/firestoreStartupService';
import type { FunderDoc } from '../types/firestore';

export function formatCurrency(val: number) {
  if (!val) return '$0';
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val}`;
}

// ── LocalStorage helpers ────────────────────────────────────────────────────
const lsKey = (uid: string) => `ecolink_saved_funders_${uid}`;

export function getSavedFunderIds(uid: string): string[] {
  try { return JSON.parse(localStorage.getItem(lsKey(uid)) || '[]'); }
  catch { return []; }
}

function setSavedFunderIds(uid: string, ids: string[]) {
  localStorage.setItem(lsKey(uid), JSON.stringify(ids));
}

export function addSavedFunderId(uid: string, funderId: string) {
  const ids = getSavedFunderIds(uid);
  if (!ids.includes(funderId)) setSavedFunderIds(uid, [...ids, funderId]);
}

export function removeSavedFunderId(uid: string, funderId: string) {
  setSavedFunderIds(uid, getSavedFunderIds(uid).filter(id => id !== funderId));
}

// ───────────────────────────────────────────────────────────────────────────

export function StartupFunderBrowse() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deck, setDeck]                   = useState<FunderDoc[]>([]);
  const [docked, setDocked]               = useState<FunderDoc[]>([]);
  const [connectedIds, setConnectedIds]   = useState<Set<string>>(new Set());
  const [connecting, setConnecting]       = useState<string | null>(null);
  const [loading, setLoading]             = useState(true);
  const [isSearching, setIsSearching]     = useState(true);
  const [matchedFunder, setMatchedFunder] = useState<FunderDoc | null>(null);
  const [flipped, setFlipped]             = useState<Record<string, boolean>>({});

  const x       = useMotionValue(0);
  const rotate  = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const saveOp  = useTransform(x, [-100, -50, 0], [1, 0.5, 0]);
  const connOp  = useTransform(x, [0, 50, 100], [0, 0.5, 1]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const savedIds = getSavedFunderIds(user!.uid);
        const [allFunders, linkages] = await Promise.all([
          getAllFunders(),
          getLinkagesForCompany(user!.uid),
        ]);
        const connected = new Set(
          linkages
            .filter(l => l.type === 'funder-syndication' && l.status === 'active' && l.funder_uid)
            .map(l => l.funder_uid)
        );
        setConnectedIds(connected);

        const allApproved = allFunders.filter(f => f.is_approved !== false);
        setDocked(allApproved.filter(f => savedIds.includes(f.uid)));
        setDeck(allApproved.filter(f => !connected.has(f.uid) && !savedIds.includes(f.uid)));
      } catch {
        toast.error('Failed to load funders');
      } finally {
        setLoading(false);
        setTimeout(() => setIsSearching(false), 1500);
      }
    }
    load();
  }, [user]);

  const toggleFlip = (uid: string) => setFlipped(p => ({ ...p, [uid]: !p[uid] }));

  const swipeCard = async (direction: 'left' | 'right') => {
    if (!deck.length || connecting) return;
    const funder = deck[0];

    if (direction === 'left') {
      await animate(x, -520, { duration: 0.28, ease: 'easeIn' });
      x.set(0);
      addSavedFunderId(user!.uid, funder.uid);
      setDeck(p => p.slice(1));
      setDocked(p => [...p, funder]);
      toast('Saved to your list', { icon: '🔖' });
    } else {
      if (!user) return;
      setConnecting(funder.uid);
      await animate(x, 520, { duration: 0.28, ease: 'easeIn' });
      x.set(0);
      setDeck(p => p.slice(1));
      try {
        await createLinkage({ type: 'funder-syndication', funder_uid: funder.uid, company_uid: user.uid, status: 'active' });
        await updateCompany(user.uid, { status: 'matched' });
        setConnectedIds(p => new Set([...p, funder.uid]));
        setMatchedFunder(funder);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#0d9488', '#06b6d4', '#0ea5e9'] });
      } catch {
        toast.error('Failed to connect — please try again');
      } finally {
        setConnecting(null);
      }
    }
  };

  const handleDragEnd = (_: unknown, { offset }: { offset: { x: number } }) => {
    if (offset.x > 100) swipeCard('right');
    else if (offset.x < -100) swipeCard('left');
  };

  const restoreFromDock = (funder: FunderDoc) => {
    removeSavedFunderId(user!.uid, funder.uid);
    setDocked(p => p.filter(f => f.uid !== funder.uid));
    setDeck(p => [funder, ...p]);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isSearching || loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="w-40 h-40 border border-teal-500 rounded-full absolute" />
          <motion.div animate={{ scale: [1, 3], opacity: [1, 0] }} transition={{ duration: 2, delay: 1, repeat: Infinity }} className="w-40 h-40 border border-cyan-500 rounded-full absolute" />
          <div className="w-32 h-32 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full z-10 flex items-center justify-center shadow-[0_0_50px_rgba(13,148,136,0.5)]">
            <DollarSign className="w-12 h-12 text-white animate-pulse" />
          </div>
        </div>
        <h2 className="text-white mt-48 text-2xl font-bold tracking-widest uppercase">Finding Investors</h2>
        <p className="text-gray-400 mt-2">Curating funders that match your profile…</p>
      </div>
    );
  }

  // ── Connected screen ───────────────────────────────────────────────────────
  if (matchedFunder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-black to-cyan-900 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/20 text-center shadow-2xl">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 mb-8 italic">Connected!</h1>
          <div className="flex justify-center items-center gap-4 mb-8">
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 border-4 border-white flex items-center justify-center text-2xl font-black text-white shadow-xl">
              {matchedFunder.name.slice(0, 2).toUpperCase()}
            </motion.div>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(13,148,136,0.8)]">
              <Handshake className="w-6 h-6 text-teal-500" />
            </motion.div>
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-sky-500 border-4 border-white flex items-center justify-center shadow-xl">
              <Rocket className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          <p className="text-white text-xl mb-4">You've connected with <span className="font-bold text-teal-300">{matchedFunder.name}</span>.</p>
          <div className="bg-black/30 rounded-2xl p-4 mb-8 text-left border border-white/10">
            <p className="text-sm text-gray-400 uppercase font-bold mb-1">Investment Range</p>
            <p className="font-bold text-teal-400 text-lg">{formatCurrency(matchedFunder.min_investment)} – {formatCurrency(matchedFunder.max_investment)}</p>
          </div>
          <div className="space-y-4">
            <Button size="lg" className="w-full rounded-full h-14 text-lg bg-teal-500 hover:bg-teal-600 text-white" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
            <Button size="lg" variant="outline" className="w-full rounded-full h-14 text-lg border-white/30 text-white hover:bg-white/10" onClick={() => setMatchedFunder(null)}>Find More Funders</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex overflow-hidden">

      {/* Left dock */}
      <AnimatePresence>
        {docked.length > 0 && (
          <motion.aside
            key="dock"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="flex flex-col items-center py-6 gap-3 bg-white/70 backdrop-blur-md border-r border-gray-200/80 shadow-xl overflow-hidden flex-shrink-0"
          >
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saved</span>

            <AnimatePresence>
              {docked.slice(0, 6).map(funder => (
                <motion.button
                  key={funder.uid}
                  initial={{ scale: 0, opacity: 0, y: -16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0, opacity: 0, y: -16 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  onClick={() => restoreFromDock(funder)}
                  className="relative group w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-[11px] font-black shadow-md hover:scale-110 hover:shadow-teal-400/30 hover:shadow-lg transition-all"
                >
                  {funder.name.slice(0, 2).toUpperCase()}
                  <span className="pointer-events-none absolute left-full ml-2.5 px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                    {funder.name}
                    <span className="block text-[10px] text-gray-400 font-normal">{formatCurrency(funder.min_investment)} – {formatCurrency(funder.max_investment)}</span>
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>

            {docked.length > 6 && (
              <span className="text-[10px] text-gray-400 font-bold">+{docked.length - 6}</span>
            )}

            {/* View all saved button */}
            <button
              onClick={() => navigate('/saved-funders')}
              className="mt-auto mb-2 w-11 h-11 rounded-2xl bg-gray-100 hover:bg-teal-50 flex items-center justify-center text-gray-500 hover:text-teal-600 transition-all hover:scale-110 group relative"
            >
              <BookMarked className="w-5 h-5" />
              <span className="pointer-events-none absolute left-full ml-2.5 px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                View all saved ({docked.length})
              </span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 flex justify-between items-center z-10">
          <Button variant="ghost" className="rounded-full w-12 h-12 p-0 bg-white shadow-md hover:bg-gray-50" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-500">Find Funders</h1>
            <p className="text-xs font-bold text-gray-500 uppercase">Swipe right to connect · left to save</p>
          </div>
          <button
            onClick={() => navigate('/saved-funders')}
            className="relative w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-md hover:bg-teal-50 transition-colors"
          >
            <Bookmark className="w-5 h-5 text-gray-500" />
            {docked.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {docked.length}
              </span>
            )}
          </button>
        </div>

        {/* Card stack */}
        <div className="flex-1 relative flex justify-center items-center overflow-hidden p-4">
          {deck.length === 0 ? (
            <div className="text-center p-8 glass rounded-3xl max-w-sm">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">All Done!</h2>
              <p className="text-gray-500 mb-6">
                {docked.length > 0
                  ? `You have ${docked.length} saved funder${docked.length > 1 ? 's' : ''} to review.`
                  : 'No more funders available right now.'}
              </p>
              <div className="flex flex-col gap-3">
                {docked.length > 0 && (
                  <Button onClick={() => navigate('/saved-funders')} className="rounded-full bg-teal-600 hover:bg-teal-700 text-white">
                    <BookMarked className="w-4 h-4 mr-2" /> View Saved Funders
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="rounded-full">Back to Dashboard</Button>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-sm aspect-[3/4.5]">
              <AnimatePresence>
                {deck.map((funder, index) => {
                  const isTop = index === 0;
                  return (
                    <motion.div
                      key={funder.uid}
                      className="absolute inset-0"
                      style={{
                        perspective: 1000,
                        zIndex: deck.length - index,
                        ...(isTop ? { x, rotate, opacity } : { scale: 1 - index * 0.05, y: index * 20 }),
                      }}
                      drag={isTop ? 'x' : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={1}
                      onDragEnd={isTop ? handleDragEnd : undefined}
                    >
                      <motion.div
                        className="w-full h-full relative"
                        style={{ transformStyle: 'preserve-3d', cursor: isTop ? 'grab' : 'default' }}
                        animate={{ rotateY: flipped[funder.uid] ? 180 : 0 }}
                        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                        onClick={() => isTop && toggleFlip(funder.uid)}
                      >
                        {/* FRONT */}
                        <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 flex flex-col" style={{ backfaceVisibility: 'hidden' }}>
                          {isTop && (
                            <>
                              <motion.div style={{ opacity: saveOp }} className="absolute top-10 right-10 z-50 border-4 border-teal-500 text-teal-500 font-black text-3xl px-4 py-1 rounded-xl rotate-12 bg-white/80 backdrop-blur-sm select-none">SAVE</motion.div>
                              <motion.div style={{ opacity: connOp }} className="absolute top-10 left-10 z-50 border-4 border-green-500 text-green-500 font-black text-3xl px-4 py-1 rounded-xl -rotate-12 bg-white/80 backdrop-blur-sm select-none">CONNECT</motion.div>
                            </>
                          )}
                          <div className="h-[45%] bg-gradient-to-br from-teal-500 to-cyan-600 relative flex flex-col justify-end p-6 overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-black border border-white/20">
                              {formatCurrency(funder.min_investment)} – {formatCurrency(funder.max_investment)}
                            </div>
                            <div className="relative z-10">
                              <div className="w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-4 text-2xl font-black text-teal-600">{funder.name.slice(0, 2).toUpperCase()}</div>
                              <h2 className="text-4xl font-black text-white leading-none drop-shadow-md">{funder.name}</h2>
                            </div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                            <div className="flex gap-2 mb-4 flex-wrap">
                              {funder.investment_focus?.slice(0, 3).map(tag => (
                                <Badge key={tag} className="bg-teal-50 text-teal-700 border-none">{tag}</Badge>
                              ))}
                            </div>
                            <p className="text-gray-600 mb-4 flex-1 line-clamp-3 leading-relaxed font-medium">{funder.bio || 'No bio provided.'}</p>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Stage Focus</p>
                                  <p className="text-sm font-bold text-gray-900">{funder.stage_interest?.join(', ') || '—'}</p>
                                </div>
                                {funder.successful_investments > 0 && (
                                  <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Exits</p>
                                    <p className="text-lg font-black text-green-600">{funder.successful_investments}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* BACK */}
                        <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-y-auto border border-gray-100 flex flex-col p-6" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center text-lg font-black flex-shrink-0">{funder.name.slice(0, 2).toUpperCase()}</div>
                            <div><h2 className="text-xl font-black text-gray-900">{funder.name}</h2><p className="text-sm text-gray-500">{funder.region}</p></div>
                          </div>
                          <div className="space-y-5 flex-1">
                            <div><h3 className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-2">About</h3><p className="text-gray-700 text-sm leading-relaxed">{funder.bio || '—'}</p></div>
                            <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100"><h3 className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-1">Investment Range</h3><p className="text-gray-800 font-bold">{formatCurrency(funder.min_investment)} – {formatCurrency(funder.max_investment)}</p></div>
                            <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Investment Focus</h3><div className="flex flex-wrap gap-1.5">{funder.investment_focus?.map(tag => <Badge key={tag} className="bg-teal-50 text-teal-700 border-none text-xs">{tag}</Badge>)}</div></div>
                            <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Stage Interest</h3><div className="flex flex-wrap gap-1.5">{funder.stage_interest?.map(s => <span key={s} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{s}</span>)}</div></div>
                            {funder.portfolio?.length > 0 && <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Portfolio</h3><p className="text-sm text-gray-700">{funder.portfolio.join(', ')}</p></div>}
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 text-center"><span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tap to flip back</span></div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Swipe buttons */}
        {deck.length > 0 && (
          <div className="p-6 flex justify-center gap-8 mb-4">
            <Button variant="outline" title="Save for later" disabled={!!connecting} onClick={() => swipeCard('left')}
              className="w-20 h-20 rounded-full border-2 border-teal-100 text-teal-500 hover:bg-teal-50 shadow-xl hover:scale-110 transition-all bg-white">
              <Bookmark className="w-9 h-9" />
            </Button>
            <Button variant="outline" title="Connect" disabled={!!connecting} onClick={() => swipeCard('right')}
              className="w-20 h-20 rounded-full border-2 border-green-100 text-green-500 hover:bg-green-50 shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:scale-110 transition-all bg-white">
              {connecting ? <Loader2 className="w-9 h-9 animate-spin" /> : <Handshake className="w-9 h-9" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
