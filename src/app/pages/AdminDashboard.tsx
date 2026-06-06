import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Check, Users, Handshake, Loader2, Rocket, Briefcase, Activity, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllCompanies, updateCompany, archiveCompany, unarchiveCompany, archiveAllMatchedCompanies } from '../services/firestoreStartupService';
import { getAllMentors, updateMentor } from '../services/firestoreMentorService';
import { getAllFunders, updateFunder } from '../services/firestoreFunderService';
import { getAllLinkages } from '../services/firestoreLinkageService';
import { Button } from '../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import type { CompanyDoc } from '../types/firestore';
import { toast } from 'sonner';

interface PendingUser {
  uid: string;
  type: 'startup' | 'mentor' | 'funder';
  name: string;
  details: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [linkages, setLinkages] = useState<any[]>([]);
  const [matchedCompanies, setMatchedCompanies] = useState<CompanyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [archivingAll, setArchivingAll] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState<'verification' | 'ecosystem' | 'archive'>('verification');

  useEffect(() => {
    async function loadData() {
      try {
        const companies = await getAllCompanies();
        const mentors = await getAllMentors();
        const funders = await getAllFunders();
        const allLinkages = await getAllLinkages();

        const pending: PendingUser[] = [];
        
        companies.forEach(c => {
          if (!c.is_approved) pending.push({ uid: c.uid, type: 'startup', name: c.name, details: `${c.sector} • ${c.stage}` });
        });

        setMatchedCompanies(companies.filter(c => c.status === 'matched'));
        mentors.forEach(m => {
          if (!m.is_approved) pending.push({ uid: m.uid, type: 'mentor', name: m.name, details: `${(m.industries || []).join(', ')} • ${m.years_experience}y exp` });
        });
        funders.forEach(f => {
          if (!f.is_approved) pending.push({ uid: f.uid, type: 'funder', name: f.name, details: `${(f.investment_focus || []).join(', ')}` });
        });

        setPendingUsers(pending);
        
        // Enrich linkages for display
        const enrichedLinkages = allLinkages.map(l => {
          const company = companies.find(c => c.uid === l.company_uid);
          let actorName = 'Unknown';
          if (l.type === 'mentor-matching') actorName = mentors.find(m => m.uid === l.mentor_uid)?.name || 'Unknown Mentor';
          if (l.type === 'funder-syndication' || l.type === 'funder-matching') actorName = funders.find(f => f.uid === l.mentor_uid || f.uid === l.funder_uid)?.name || 'Unknown Funder';
          
          return {
            ...l,
            companyName: company?.name || 'Unknown Startup',
            actorName
          };
        });
        
        setLinkages(enrichedLinkages);
      } catch (err) {
        console.error("Failed to load ecosystem data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleApprove = async (uid: string, type: 'startup' | 'mentor' | 'funder') => {
    setProcessing(uid);
    try {
      if (type === 'startup') await updateCompany(uid, { is_approved: true });
      if (type === 'mentor') await updateMentor(uid, { is_approved: true });
      if (type === 'funder') await updateFunder(uid, { is_approved: true });
      
      toast.success(`${type} approved successfully!`);
      setPendingUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (err) {
      toast.error("Failed to approve user");
    } finally {
      setProcessing(null);
    }
  };

  const handleArchive = async (uid: string) => {
    setProcessing(uid);
    try {
      await archiveCompany(uid);
      setMatchedCompanies(prev => prev.map(c => c.uid === uid ? { ...c, archived: true } : c));
      toast.success('Startup archived successfully');
    } catch {
      toast.error('Failed to archive startup');
    } finally {
      setProcessing(null);
    }
  };

  const handleUnarchive = async (uid: string) => {
    setProcessing(uid);
    try {
      await unarchiveCompany(uid);
      setMatchedCompanies(prev => prev.map(c => c.uid === uid ? { ...c, archived: false } : c));
      toast.success('Startup restored successfully');
    } catch {
      toast.error('Failed to restore startup');
    } finally {
      setProcessing(null);
    }
  };

  const handleArchiveAll = async () => {
    setArchivingAll(true);
    try {
      const count = await archiveAllMatchedCompanies();
      setMatchedCompanies(prev => prev.map(c => ({ ...c, archived: true })));
      toast.success(`${count} matched startup${count !== 1 ? 's' : ''} archived`);
    } catch {
      toast.error('Failed to archive matched startups');
    } finally {
      setArchivingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading Gatekeeper Command...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-emerald-900 text-white pt-16 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="container mx-auto relative z-10 flex items-center gap-6">
           <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-400">
             <Shield className="w-10 h-10 text-white" />
           </div>
           <div>
             <h1 className="text-4xl font-black mb-2">Ecosystem Gatekeeper</h1>
             <p className="text-emerald-200 text-lg">Verify users and monitor global matchmaking activity.</p>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 min-h-[500px]">
          
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-gray-100 pb-4">
             <button 
               className={`text-lg font-bold flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === 'verification' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50'}`}
               onClick={() => setActiveTab('verification')}
             >
               <Check className="w-5 h-5" /> Pending Verification <span className="bg-emerald-100 text-emerald-700 text-xs py-0.5 px-2 rounded-full ml-1">{pendingUsers.length}</span>
             </button>
             <button
               className={`text-lg font-bold flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === 'ecosystem' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50'}`}
               onClick={() => setActiveTab('ecosystem')}
             >
               <Activity className="w-5 h-5" /> Ecosystem Linkages <span className="bg-blue-100 text-blue-700 text-xs py-0.5 px-2 rounded-full ml-1">{linkages.length}</span>
             </button>
             <button
               className={`text-lg font-bold flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeTab === 'archive' ? 'bg-teal-50 text-teal-700' : 'text-gray-500 hover:bg-gray-50'}`}
               onClick={() => setActiveTab('archive')}
             >
               <Archive className="w-5 h-5" /> Matched Startups <span className="bg-teal-100 text-teal-700 text-xs py-0.5 px-2 rounded-full ml-1">{matchedCompanies.filter(c => !c.archived).length}</span>
             </button>
          </div>

          {activeTab === 'verification' && (
            <div>
              {pendingUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Shield className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">All Users Verified</h3>
                  <p className="text-gray-500">There are no pending startups, mentors, or funders.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  <AnimatePresence>
                    {pendingUsers.map(u => (
                      <motion.div
                        key={u.uid}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${u.type === 'startup' ? 'bg-emerald-500' : u.type === 'mentor' ? 'bg-purple-500' : 'bg-blue-500'}`}>
                              {u.type === 'startup' && <Rocket className="w-6 h-6" />}
                              {u.type === 'mentor' && <Users className="w-6 h-6" />}
                              {u.type === 'funder' && <Briefcase className="w-6 h-6" />}
                           </div>
                           <div>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{u.type}</p>
                             <h3 className="text-xl font-bold text-gray-900">{u.name}</h3>
                             <p className="text-sm text-gray-500">{u.details}</p>
                           </div>
                        </div>
                        <Button 
                          onClick={() => handleApprove(u.uid, u.type)}
                          disabled={processing === u.uid}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl h-12 px-6"
                        >
                          {processing === u.uid ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Approve Legitimacy</>}
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ecosystem' && (
            <div>
              {linkages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Handshake className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No Active Linkages</h3>
                  <p className="text-gray-500">The ecosystem is quiet. Matches will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {linkages.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-6">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">{l.actorName[0]}</div>
                           <div>
                             <p className="text-xs font-bold text-gray-400 uppercase">{l.type === 'mentor-matching' ? 'Mentor' : 'Funder'}</p>
                             <p className="font-bold text-gray-900">{l.actorName}</p>
                           </div>
                         </div>
                         
                         <Handshake className="w-6 h-6 text-emerald-500" />
                         
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold"><Rocket className="w-5 h-5" /></div>
                           <div>
                             <p className="text-xs font-bold text-gray-400 uppercase">Startup</p>
                             <p className="font-bold text-gray-900">{l.companyName}</p>
                           </div>
                         </div>
                      </div>
                      
                      <div className="text-right">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                           {l.status}
                         </span>
                         <p className="text-xs text-gray-400 mt-2">ID: {l.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'archive' && (
            <div>
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">
                    {matchedCompanies.filter(c => !c.archived).length} active matched &nbsp;·&nbsp;
                    {matchedCompanies.filter(c => c.archived).length} archived
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowArchived(v => !v)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    {showArchived ? 'Hide archived' : 'Show archived'}
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={archivingAll || matchedCompanies.filter(c => !c.archived).length === 0}
                        className="flex items-center gap-2"
                      >
                        {archivingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Archive All Matched
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive all matched startups?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will archive {matchedCompanies.filter(c => !c.archived).length} matched startup{matchedCompanies.filter(c => !c.archived).length !== 1 ? 's' : ''}.
                          They will be hidden from all dashboards but can be restored individually. This action is reversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchiveAll} className="bg-red-600 hover:bg-red-700">
                          Archive All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Active matched startups */}
              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {matchedCompanies.filter(c => !c.archived).map(c => (
                    <motion.div
                      key={c.uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-6 rounded-2xl border border-teal-100 bg-teal-50/40 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center text-white">
                          <Rocket className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Matched Startup</p>
                          <h3 className="text-xl font-bold text-gray-900">{c.name}</h3>
                          <p className="text-sm text-gray-500">{c.sector} · {c.stage} · {c.region}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleArchive(c.uid)}
                        disabled={processing === c.uid}
                        className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {processing === c.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                        Archive
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {matchedCompanies.filter(c => !c.archived).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Archive className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-1">No matched startups</h3>
                    <p className="text-gray-400">All matched startups have been archived.</p>
                  </div>
                )}
              </div>

              {/* Archived startups */}
              {showArchived && matchedCompanies.filter(c => c.archived).length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Archived</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <AnimatePresence>
                      {matchedCompanies.filter(c => c.archived).map(c => (
                        <motion.div
                          key={c.uid}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-between p-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 opacity-70"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
                              <Rocket className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-600">{c.name}</h3>
                              <p className="text-sm text-gray-400">{c.sector} · {c.stage}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnarchive(c.uid)}
                            disabled={processing === c.uid}
                            className="flex items-center gap-2 text-teal-600 hover:bg-teal-50"
                          >
                            {processing === c.uid ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            Restore
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
