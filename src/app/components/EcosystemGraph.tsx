import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, ChevronDown, Loader2, X, CheckCircle2 } from 'lucide-react';
import { getLinkagesForCompany, getLinkagesForMentor, getLinkagesForFunder, updateLinkage } from '../services/firestoreLinkageService';
import { getCompany } from '../services/firestoreStartupService';
import { getMentor } from '../services/firestoreMentorService';
import { getFunder } from '../services/firestoreFunderService';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface GraphNode {
  id: string;
  label: string;
  sublabel: string;
  type: 'startup' | 'mentor' | 'funder';
  isSelf: boolean;
  linkageId?: string;
  status?: 'active' | 'pending_approval' | 'completed' | 'rejected' | 'terminated';
}

interface EcosystemGraphProps {
  uid: string;
  role: 'Startup' | 'Mentor' | 'Funder';
}

const COLORS = {
  startup: { fill: '#0d9488', ring: '#5eead4', light: '#f0fdfa', text: '#0f766e' },
  mentor:  { fill: '#7c3aed', ring: '#a78bfa', light: '#f5f3ff', text: '#6d28d9' },
  funder:  { fill: '#ea580c', ring: '#fb923c', light: '#fff7ed', text: '#c2410c' },
} as const;

const SVG_W   = 600;
const SVG_H   = 400;
const CX      = SVG_W / 2;
const CY      = SVG_H / 2;
const ORBIT_R = 165;
const SELF_R  = 46;
const NODE_R  = 32;

function trim(s: string, n = 14) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function EcosystemGraph({ uid, role }: EcosystemGraphProps) {
  const [open, setOpen]               = useState(true);
  const [nodes, setNodes]             = useState<GraphNode[]>([]);
  const [loading, setLoading]         = useState(true);
  const [hovered, setHovered]         = useState<string | null>(null);
  const [selected, setSelected]       = useState<GraphNode | null>(null);
  const [completing, setCompleting]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadGraph() {
      setLoading(true);
      try {
        const result: GraphNode[] = [];

        if (role === 'Startup') {
          const company = await getCompany(uid);
          if (!company || cancelled) return;
          result.push({ id: uid, label: company.name, sublabel: company.sector, type: 'startup', isSelf: true });

          const linkages = await getLinkagesForCompany(uid);

          // Mentor node — find the mentor linkage to get its ID and status
          if (company.mentor_uid) {
            const mentor = await getMentor(company.mentor_uid);
            const mentorLinkage = linkages.find(l => l.type === 'mentor-matching' && l.mentor_uid === company.mentor_uid);
            if (mentor && !cancelled) result.push({
              id: mentor.uid,
              label: mentor.name,
              sublabel: 'Mentor',
              type: 'mentor',
              isSelf: false,
              linkageId: mentorLinkage?.id,
              status: mentorLinkage?.status ?? 'active',
            });
          }

          // Funder nodes
          await Promise.all(
            linkages
              .filter(l => l.type === 'funder-syndication' && (l.status === 'active' || l.status === 'completed') && l.funder_uid)
              .map(async l => {
                const funder = await getFunder(l.funder_uid);
                if (funder && !cancelled) result.push({
                  id: funder.uid,
                  label: funder.name,
                  sublabel: 'Funder',
                  type: 'funder',
                  isSelf: false,
                  linkageId: l.id,
                  status: l.status,
                });
              })
          );

        } else if (role === 'Mentor') {
          const mentor = await getMentor(uid);
          if (!mentor || cancelled) return;
          result.push({ id: uid, label: mentor.name, sublabel: 'You', type: 'mentor', isSelf: true });

          const linkages = await getLinkagesForMentor(uid);
          await Promise.all(
            linkages
              .filter(l => (l.status === 'active' || l.status === 'completed') && l.company_uid)
              .map(async l => {
                const company = await getCompany(l.company_uid);
                if (company && !cancelled) result.push({
                  id: company.uid,
                  label: company.name,
                  sublabel: company.sector,
                  type: 'startup',
                  isSelf: false,
                  linkageId: l.id,
                  status: l.status,
                });
              })
          );

        } else {
          const funder = await getFunder(uid);
          if (!funder || cancelled) return;
          result.push({ id: uid, label: funder.name, sublabel: 'You', type: 'funder', isSelf: true });

          const linkages = await getLinkagesForFunder(uid);
          await Promise.all(
            linkages
              .filter(l => (l.status === 'active' || l.status === 'completed') && l.company_uid)
              .map(async l => {
                const company = await getCompany(l.company_uid);
                if (company && !cancelled) result.push({
                  id: company.uid,
                  label: company.name,
                  sublabel: company.sector,
                  type: 'startup',
                  isSelf: false,
                  linkageId: l.id,
                  status: l.status,
                });
              })
          );
        }

        if (!cancelled) setNodes(result);
      } catch (err) {
        console.error('EcosystemGraph fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGraph();
    return () => { cancelled = true; };
  }, [uid, role]);

  const selfNode   = nodes.find(n => n.isSelf);
  const satellites = nodes.filter(n => !n.isSelf);

  function nodePos(node: GraphNode) {
    if (node.isSelf) return { x: CX, y: CY };
    const i     = satellites.indexOf(node);
    const count = Math.max(satellites.length, 1);
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { x: CX + ORBIT_R * Math.cos(angle), y: CY + ORBIT_R * Math.sin(angle) };
  }

  async function handleMarkComplete() {
    if (!selected?.linkageId) return;
    setCompleting(true);
    try {
      await updateLinkage(selected.linkageId, { status: 'completed' });
      // Update node in state
      setNodes(prev => prev.map(n =>
        n.id === selected.id ? { ...n, status: 'completed' } : n
      ));
      setSelected(prev => prev ? { ...prev, status: 'completed' } : prev);
      toast.success(`Marked ${selected.label} as completed`);
    } catch {
      toast.error('Failed to update — please try again');
    } finally {
      setCompleting(false);
    }
  }

  const isEmpty = !loading && satellites.length === 0;

  return (
    <div className="mt-10">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-3 w-full text-left mb-4"
      >
        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0">
          <Network className="w-4 h-4" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Ecosystem Graph</h2>
        <ChevronDown className={`w-5 h-5 text-gray-400 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="graph-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              {loading ? (
                <div className="flex items-center justify-center h-56">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>

              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center h-56 text-gray-400 gap-3">
                  <Network className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium text-center max-w-xs">
                    No connections yet. Your ecosystem graph appears once you're matched with a mentor or funder.
                  </p>
                </div>

              ) : (
                <>
                  <svg
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full"
                    style={{ maxHeight: '400px' }}
                  >
                    {/* Edges */}
                    {selfNode && satellites.map(sat => {
                      const tp     = nodePos(sat);
                      const active = hovered === sat.id || hovered === selfNode.id || selected?.id === sat.id;
                      const dimmed = !!hovered && !active;
                      return (
                        <motion.path
                          key={`edge-${sat.id}`}
                          d={`M ${CX} ${CY} L ${tp.x} ${tp.y}`}
                          stroke={active ? COLORS[sat.type].ring : sat.status === 'completed' ? '#86efac' : '#d1d5db'}
                          strokeWidth={active ? 2.5 : 1.5}
                          strokeDasharray={sat.status === 'completed' ? undefined : (active ? undefined : '6 4')}
                          fill="none"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: dimmed ? 0.2 : 1 }}
                          transition={{ duration: 0.65, delay: 0.1 }}
                        />
                      );
                    })}

                    {/* Nodes */}
                    {nodes.map((node, idx) => {
                      const pos      = nodePos(node);
                      const r        = node.isSelf ? SELF_R : NODE_R;
                      const c        = COLORS[node.type];
                      const isHov    = hovered === node.id;
                      const isSel    = selected?.id === node.id;
                      const dim      = !!hovered && !isHov && !isSel;
                      const done     = node.status === 'completed';

                      return (
                        <motion.g
                          key={node.id}
                          initial={{ opacity: 0, scale: 0.2 }}
                          animate={{ opacity: dim ? 0.35 : 1, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: idx * 0.08 }}
                          style={{ transformOrigin: `${pos.x}px ${pos.y}px`, cursor: node.isSelf ? 'default' : 'pointer' }}
                          onMouseEnter={() => setHovered(node.id)}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => !node.isSelf && setSelected(n => n?.id === node.id ? null : node)}
                        >
                          {/* Pulsing halo on self node */}
                          {node.isSelf && (
                            <motion.circle
                              cx={pos.x} cy={pos.y} r={r + 14}
                              fill="none"
                              stroke={c.ring}
                              strokeWidth={2}
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                              style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                            />
                          )}

                          {/* Selected ring */}
                          {isSel && (
                            <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none" stroke={c.fill} strokeWidth={2.5} opacity={0.6} />
                          )}

                          {/* Hover glow */}
                          {(isHov || isSel) && (
                            <circle cx={pos.x} cy={pos.y} r={r + 10} fill={c.fill} opacity={0.12} />
                          )}

                          {/* Main circle — desaturated if completed */}
                          <circle cx={pos.x} cy={pos.y} r={r} fill={done ? '#9ca3af' : c.fill} />

                          {/* Completed tick overlay */}
                          {done && (
                            <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={node.isSelf ? 20 : 16}>✓</text>
                          )}

                          {/* Initials (hidden if completed) */}
                          {!done && (
                            <text
                              x={pos.x} y={pos.y}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="white"
                              fontSize={node.isSelf ? 17 : 13}
                              fontWeight="bold"
                              style={{ userSelect: 'none' }}
                            >
                              {node.label.slice(0, 2).toUpperCase()}
                            </text>
                          )}

                          {/* Name label */}
                          <text
                            x={pos.x} y={pos.y + r + 16}
                            textAnchor="middle"
                            fill={(isHov || isSel) ? (done ? '#6b7280' : c.fill) : '#1f2937'}
                            fontSize={12}
                            fontWeight={(isHov || isSel) ? 'bold' : 'normal'}
                            style={{ userSelect: 'none' }}
                          >
                            {trim(node.label)}
                          </text>

                          {/* Sublabel */}
                          <text
                            x={pos.x} y={pos.y + r + 30}
                            textAnchor="middle"
                            fill="#9ca3af"
                            fontSize={10}
                            style={{ userSelect: 'none' }}
                          >
                            {node.sublabel}
                          </text>
                        </motion.g>
                      );
                    })}
                  </svg>

                  {/* Node detail panel */}
                  <AnimatePresence>
                    {selected && (
                      <motion.div
                        key={selected.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="mt-4 rounded-2xl border p-4 flex items-center gap-4"
                        style={{
                          backgroundColor: COLORS[selected.type].light,
                          borderColor: COLORS[selected.type].ring,
                        }}
                      >
                        {/* Avatar */}
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                          style={{ backgroundColor: selected.status === 'completed' ? '#9ca3af' : COLORS[selected.type].fill }}
                        >
                          {selected.status === 'completed' ? '✓' : selected.label.slice(0, 2).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 truncate">{selected.label}</p>
                          <p className="text-xs text-gray-500">{selected.sublabel}</p>
                        </div>

                        {/* Status badge */}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          selected.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-white text-gray-600 border border-gray-200'
                        }`}>
                          {selected.status === 'completed' ? 'Completed' : 'Active'}
                        </span>

                        {/* Mark complete button */}
                        {selected.status !== 'completed' && selected.linkageId && (
                          <Button
                            size="sm"
                            onClick={handleMarkComplete}
                            disabled={completing}
                            className="rounded-xl text-xs font-bold flex-shrink-0 gap-1.5"
                            style={{ backgroundColor: COLORS[selected.type].fill }}
                          >
                            {completing
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Complete
                          </Button>
                        )}

                        {/* Close */}
                        <button
                          onClick={() => setSelected(null)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
                    {(['startup', 'mentor', 'funder'] as const).map(type => (
                      <div key={type} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[type].fill }} />
                        <span className="text-xs text-gray-400 capitalize">{type}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                      <span className="text-xs text-gray-400">Completed</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
