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

export function InvestorBrief() {
  const navigate = useNavigate();
  const { startupId } = useParams();
  
  const [startup, setStartup] = useState<CompanyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<any>(null);

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
          // Simulate generating a brief based on the real company data
          setTimeout(() => {
            setBrief({
              generatedAt: new Date().toLocaleDateString(),
              summary: `${company.name} is a ${company.stage} stage startup in the ${company.sector} sector looking to raise $${(company.budget_needed / 1000).toFixed(0)}K. ${company.description}`,
              marketAnalysis: `Operating in the ${company.sector} market, ${company.name} shows strong potential to capture market share based on their focus on: ${company.market_goals || 'innovation and growth'}.`,
              fundingNeeds: `The company is actively seeking $${(company.budget_needed / 1000).toFixed(0)}K to execute its next growth phase.`,
              compatibilityInsights: [
                `High alignment with funders investing in ${company.stage} stage.`,
                `Sector match (${company.sector}) confirms thesis fit.`,
                `AI Score of ${company.ai_score || 85}/100 indicates strong team capability.`
              ]
            });
            setLoading(false);
          }, 1500);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load startup", err);
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

  if (!startup || !brief) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md w-full shadow-lg border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <FileText className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Brief Not Found</h2>
          <p className="text-gray-600 mb-6">This startup doesn't exist or couldn't be loaded.</p>
          <Button onClick={() => navigate(-1)} className="rounded-full w-full">Go Back</Button>
        </Card>
      </div>
    );
  }

  const handleDownload = () => toast.success('AI Brief downloaded as PDF');
  const handleShare = () => toast.success('Brief link copied to clipboard');

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
                <div className="font-bold text-xl">${(startup.budget_needed / 1000).toFixed(0)}K</div>
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
              Generated by AI on {brief.generatedAt}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 space-y-6">
                {/* Executive Summary */}
                <Card className="p-8 rounded-3xl shadow-sm border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
                    <h3 className="text-xl font-bold">Executive Summary</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg">{brief.summary}</p>
                </Card>

                {/* Market Analysis */}
                <Card className="p-8 rounded-3xl shadow-sm border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                    <h3 className="text-xl font-bold">Market Analysis</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-lg mb-6">{brief.marketAnalysis}</p>
                </Card>
             </div>

             <div className="space-y-6">
                {/* Funding Needs */}
                <Card className="p-8 rounded-3xl shadow-sm border-gray-100 bg-gradient-to-b from-white to-gray-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center"><DollarSign className="w-5 h-5 text-purple-600" /></div>
                    <h3 className="text-xl font-bold">Allocation</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">{brief.fundingNeeds}</p>
                  <Separator className="my-6" />
                  <div>
                    <div className="font-bold text-gray-900 mb-3 uppercase text-xs tracking-wider">Breakdown</div>
                    <p className="text-gray-600 font-medium">{startup.budget_breakdown || "Standard allocation across engineering and go-to-market."}</p>
                  </div>
                </Card>

                {/* Compatibility Insights */}
                <Card className="p-8 rounded-3xl shadow-sm border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center"><Target className="w-5 h-5 text-orange-600" /></div>
                    <h3 className="text-xl font-bold">Insights</h3>
                  </div>
                  <div className="space-y-4">
                    {brief.compatibilityInsights.map((insight: string, index: number) => (
                      <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-2xl">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="text-gray-700 font-medium text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </Card>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
