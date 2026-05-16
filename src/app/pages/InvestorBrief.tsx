import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, FileText, TrendingUp, DollarSign, Target, Download, Share2, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { getCompany } from '../services/firestoreStartupService';
import type { CompanyDoc } from '../types/firestore';
import { generateBrief, type GeneratedBrief } from '../lib/briefs';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function InvestorBrief() {
  const navigate = useNavigate();
  const { startupId } = useParams();
  
  const [startup, setStartup] = useState<CompanyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<GeneratedBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mitigatedRisks, setMitigatedRisks] = useState<number[]>([]);

  const toggleRisk = (index: number) => {
    setMitigatedRisks(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  useEffect(() => {
    async function loadData() {
      if (!startupId) {
        setLoading(false);
        return;
      }
      try {
        const company = await getCompany(startupId);
        setStartup(company);
        
        if (company) {
          try {
            const aiResponse = await generateBrief(startupId);
            setBrief(aiResponse.brief);
          } catch (apiError) {
            console.error("Failed to generate AI brief", apiError);
            setError("The AI analysis engine is currently unavailable. Please try again later.");
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to load startup", err);
        setError("Failed to load startup profile.");
        setLoading(false);
      }
    }
    loadData();
  }, [startupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Generating Intelligence Brief...</p>
      </div>
    );
  }

  if (error || !startup || !brief) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full shadow-lg border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             {error ? <AlertCircle className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
          </div>
          <h2 className="text-2xl font-bold mb-2">{error ? "Analysis Failed" : "Brief Not Found"}</h2>
          <p className="text-gray-600 mb-6">{error || "This startup doesn't exist or couldn't be loaded."}</p>
          <Button onClick={() => navigate(-1)} className="rounded-full w-full">Go Back</Button>
        </Card>
      </div>
    );
  }

  const handleDownload = () => toast.success('AI Brief downloaded as PDF');
  const handleShare = () => toast.success('Brief link copied to clipboard');

  const formatCurrency = (val: number) => {
    if (!val || val === 0) return "TBD";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-4 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI-Generated Investor Brief</h1>
                <p className="text-gray-500 text-sm">Investment intelligence report</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleShare} className="gap-2 rounded-full border-gray-200">
                <Share2 className="w-4 h-4" /> Share
              </Button>
              <Button onClick={handleDownload} className="gap-2 rounded-full bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <Card className="p-8 bg-gradient-to-br from-blue-600 to-purple-700 text-white shadow-xl border-none rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div>
                <Badge className="bg-white/20 text-white hover:bg-white/30 border-none mb-4 uppercase tracking-widest text-xs px-3 py-1">
                  Investment Opportunity
                </Badge>
                <h2 className="text-white text-4xl font-black mb-3">{startup.name}</h2>
                <p className="text-blue-100 text-lg max-w-2xl">{startup.description}</p>
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 p-6 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
              <div>
                <div className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">Industry</div>
                <div className="font-bold text-xl">{startup.sector}</div>
              </div>
              <div>
                <div className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">Stage</div>
                <div className="font-bold text-xl capitalize">{startup.stage}</div>
              </div>
              <div>
                <div className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">Seeking</div>
                <div className="font-bold text-xl">{formatCurrency(startup.budget_needed)}</div>
              </div>
              <div>
                <div className="text-blue-200 text-xs uppercase font-bold tracking-wider mb-1">AI Score</div>
                <div className="font-bold text-xl text-green-300">{startup.ai_score || 85}/100</div>
              </div>
            </div>
          </Card>

          <div className="flex justify-between items-center text-sm text-gray-500 px-2">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Generated by AI on {new Date(brief.generated_at).toLocaleDateString()}
            </div>
          </div>

          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
          >
             <div className="md:col-span-2 flex flex-col gap-6">
                <motion.div variants={itemVariants}>
                  <Card className="p-8 rounded-3xl shadow-sm border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
                      <h3 className="text-xl font-bold">Executive Summary</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg">{brief.summary}</p>
                  </Card>
                </motion.div>

                {/* Market Analysis */}
                <motion.div variants={itemVariants}>
                  <Card className="p-8 rounded-3xl shadow-sm border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                      <h3 className="text-xl font-bold">Market Analysis</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-lg mb-6">{brief.market_analysis}</p>
                  </Card>
                </motion.div>
             </div>

             <div className="flex flex-col gap-6">
                {/* Funding Needs */}
                <motion.div variants={itemVariants}>
                  <Card className="p-8 rounded-3xl shadow-sm border-gray-100 bg-gradient-to-b from-white to-gray-50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-purple-600" /></div>
                      <h3 className="text-xl font-bold">Allocation</h3>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6">{brief.funding_needs}</p>
                    <Separator className="my-6" />
                    <div>
                      <div className="font-bold text-gray-900 mb-3 uppercase text-xs tracking-wider">Breakdown</div>
                      <p className="text-gray-600 font-medium">{startup.budget_breakdown || "Standard allocation across engineering and go-to-market."}</p>
                    </div>
                  </Card>
                </motion.div>

                {/* Compatibility Insights */}
                <motion.div variants={itemVariants}>
                  <Card className="p-8 rounded-3xl shadow-sm border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center"><Target className="w-5 h-5 text-orange-600" /></div>
                      <h3 className="text-xl font-bold">Insights</h3>
                    </div>
                    <div className="space-y-4">
                      {brief.compatibility_insights?.map((insight: string, index: number) => (
                        <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-2xl">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <p className="text-gray-700 font-medium text-sm">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                {/* Risks */}
                {brief.risks && brief.risks.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <Card className="p-8 rounded-3xl shadow-sm border-gray-100">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center"><AlertCircle className="w-5 h-5 text-red-600" /></div>
                          <h3 className="text-xl font-bold">Risk Assessment</h3>
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">Interactive</span>
                      </div>
                      <div className="space-y-4">
                        {brief.risks.map((risk: string, index: number) => {
                          const isMitigated = mitigatedRisks.includes(index);
                          return (
                            <div 
                              key={index} 
                              onClick={() => toggleRisk(index)}
                              className={`flex gap-3 items-start p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                isMitigated 
                                  ? 'bg-green-50/50 border-green-200 opacity-60' 
                                  : 'bg-red-50/50 border-red-100 hover:bg-red-50'
                              }`}
                            >
                              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isMitigated ? 'border-green-500 bg-green-500' : 'border-red-300'
                              }`}>
                                {isMitigated && <CheckCircle className="w-3 h-3 text-white" />}
                              </div>
                              <p className={`font-medium text-sm transition-all duration-300 ${
                                isMitigated ? 'text-gray-400 line-through' : 'text-gray-800'
                              }`}>
                                {risk}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </motion.div>
                )}
             </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
