import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, FileText, TrendingUp, DollarSign, Target, AlertCircle, Loader2, CheckCircle, Globe, ExternalLink, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { getCompany } from '../services/firestoreStartupService';
import type { CompanyDoc } from '../types/firestore';
import { generateBrief, type GeneratedBrief } from '../lib/briefs';
import { motion } from 'framer-motion';

function formatCurrency(val: number) {
  if (!val || val === 0) return 'TBD';
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val}`;
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

export function InvestorBrief() {
  const navigate = useNavigate();
  const { startupId } = useParams();

  const [startup, setStartup] = useState<CompanyDoc | null>(null);
  const [brief, setBrief]     = useState<GeneratedBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiError, setAiError] = useState(false);

  useEffect(() => {
    if (!startupId) { setLoading(false); return; }
    (async () => {
      try {
        const company = await getCompany(startupId);
        setStartup(company);
        if (company) {
          try {
            const res = await generateBrief(startupId);
            setBrief(res.brief);
          } catch {
            setAiError(true);
          }
        }
      } catch {
        toast.error('Failed to load startup');
      } finally {
        setLoading(false);
      }
    })();
  }, [startupId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gray-50">
        <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
        <p className="text-gray-400 font-medium text-sm">Generating brief…</p>
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-3">
          <FileText className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 font-medium">Startup not found.</p>
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full">Go back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="ghost" size="sm" className="rounded-full w-10 h-10 p-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <h1 className="text-lg font-black truncate">Investor Brief</h1>
          </div>
          {brief?.web_grounded && (
            <Badge className="bg-teal-50 text-teal-700 border-teal-200 gap-1 text-xs">
              <Globe className="w-3 h-3" /> Web Verified
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs border-gray-200"
            onClick={() => toast.success('Link copied to clipboard')}
          >
            Share
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-5">
        {/* Hero */}
        <motion.div
          variants={item} initial="hidden" animate="show"
          className="rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white p-7 shadow-lg shadow-teal-500/20 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <Badge className="bg-white/20 text-white border-none text-xs uppercase tracking-widest mb-4">Investment Opportunity</Badge>
          <h2 className="text-3xl font-black mb-2">{startup.name}</h2>
          <p className="text-teal-100 text-sm leading-relaxed mb-6">{startup.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/10 rounded-2xl p-4 border border-white/20">
            {[
              { label: 'Sector',   value: startup.sector },
              { label: 'Stage',    value: startup.stage },
              { label: 'Seeking',  value: formatCurrency(startup.budget_needed) },
              { label: 'AI Score', value: `${startup.ai_score ?? '—'}/100` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-teal-200 text-xs font-bold uppercase tracking-wider mb-0.5">{label}</div>
                <div className="font-black text-lg capitalize">{value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Status banners */}
        {aiError && (
          <motion.div variants={item} initial="hidden" animate="show"
            className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            AI analysis unavailable — showing raw profile data.
          </motion.div>
        )}
        {brief && !brief.web_grounded && !aiError && (
          <motion.div variants={item} initial="hidden" animate="show"
            className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-sm text-orange-700"
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            Profile claims not verified against external sources — treat with caution.
          </motion.div>
        )}

        {/* Executive Summary */}
        <Section icon={<FileText className="w-5 h-5 text-teal-600" />} title="Summary" bg="bg-teal-50">
          <p className="text-gray-700 leading-relaxed text-sm">
            {brief?.summary ?? startup.description ?? 'No summary available.'}
          </p>
        </Section>

        {/* Market Analysis */}
        {(brief?.market_analysis) && (
          <Section icon={<TrendingUp className="w-5 h-5 text-green-600" />} title="Market Analysis" bg="bg-green-50">
            <p className="text-gray-700 leading-relaxed text-sm">{brief.market_analysis}</p>
          </Section>
        )}

        {/* Funding */}
        <Section icon={<DollarSign className="w-5 h-5 text-purple-600" />} title="Funding Needs" bg="bg-purple-50">
          <p className="text-gray-700 leading-relaxed text-sm">
            {brief?.funding_needs ?? startup.budget_breakdown ?? 'Standard allocation across engineering and go-to-market.'}
          </p>
        </Section>

        {/* Insights */}
        {brief?.compatibility_insights && brief.compatibility_insights.length > 0 && (
          <Section icon={<Target className="w-5 h-5 text-cyan-600" />} title="Key Insights" bg="bg-cyan-50">
            <ul className="space-y-2">
              {brief.compatibility_insights.map((insight: string, i: number) => (
                <li key={i} className="flex gap-2 items-start">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{insight}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Risks */}
        {brief?.risks && brief.risks.length > 0 && (
          <Section icon={<AlertCircle className="w-5 h-5 text-red-500" />} title="Risk Factors" bg="bg-red-50">
            <ul className="space-y-2">
              {brief.risks.map((risk: string, i: number) => (
                <li key={i} className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                  <span className="text-gray-700 text-sm">{risk}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Web Sources */}
        {brief?.web_grounded && brief.sources.length > 0 && (
          <motion.div variants={item} initial="hidden" animate="show"
            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-black text-gray-900">Sources</h3>
              <span className="text-xs text-gray-400 font-medium ml-auto">{brief.sources.length} web results</span>
            </div>
            <ul className="space-y-2">
              {brief.sources.map((src, i) => (
                <li key={i}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-teal-600 hover:text-teal-800 hover:underline transition-colors group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                    <span className="truncate">{src.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, bg, children }: {
  icon: React.ReactNode;
  title: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={item} initial="hidden" animate="show"
      className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>{icon}</div>
        <h3 className="font-black text-gray-900">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}
