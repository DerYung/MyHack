import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Users, DollarSign, TrendingUp, CheckCircle, Lightbulb, MessageSquare } from 'lucide-react';
import { mockStartups, mockFunders } from '../lib/mockData';
import { generateCoInvestmentOptions } from '../lib/matching';
import { toast } from "sonner";
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function CoInvestment() {
  const navigate = useNavigate();
  const { startupId } = useParams();
  const startup = mockStartups.find(s => s.id === startupId);

  if (!startup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="mb-2">Startup Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const coInvestmentOptions = generateCoInvestmentOptions(startup, mockFunders);

  const handleProposeCoInvestment = (option: any) => {
    const funderNames = option.funders.map((f: any) => f.name).join(' and ');
    toast.success(`Co-investment proposal sent to ${funderNames}!`);
  };

  const calculateSplit = (amount: number, total: number) => {
    return ((amount / total) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/funder-matching')} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Funders
          </Button>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <h1>Co-Investment Opportunities</h1>
              <p className="text-gray-600">Strategic funding partnerships for {startup.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Startup Overview */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h2 className="text-white mb-3">{startup.name}</h2>
          <p className="text-purple-100 mb-4">{startup.description}</p>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <div className="text-purple-200 text-sm mb-1">Funding Needed</div>
              <div className="text-2xl font-bold">${(startup.budgetNeeded / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div className="text-purple-200 text-sm mb-1">Industry</div>
              <div className="font-medium">{startup.industry}</div>
            </div>
            <div>
              <div className="text-purple-200 text-sm mb-1">Stage</div>
              <div className="font-medium capitalize">{startup.stage.replace('-', ' ')}</div>
            </div>
            <div>
              <div className="text-purple-200 text-sm mb-1">Market Potential</div>
              <div className="font-medium capitalize">{startup.marketPotential?.replace('-', ' ')}</div>
            </div>
          </div>
        </Card>

        {/* Co-Investment Explainer */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex gap-3">
            <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="mb-2">How Co-Investment Works</h3>
              <p className="text-gray-700 mb-3">
                When a single funder cannot fully cover your funding needs, our AI identifies strategic co-investment 
                opportunities by pairing funders whose expertise and resources complement each other.
              </p>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Risk sharing across multiple investors</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Diverse expertise and networks</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Strategic synergy opportunities</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Co-Investment Options */}
        <h2 className="mb-6">AI-Recommended Co-Investment Syndicates</h2>
        
        {coInvestmentOptions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No co-investment opportunities found at this time.</p>
            <Button onClick={() => navigate('/funder-matching')} className="mt-4">
              View Individual Funders
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {coInvestmentOptions.map((option, index) => {
              const funder1 = option.funders[0];
              const funder2 = option.funders[1];
              
              // Calculate suggested split based on max investment capacity
              const total = Math.min(option.totalCoverage, startup.budgetNeeded);
              const funder1Amount = Math.min(funder1.maxInvestment, total * 0.5);
              const funder2Amount = total - funder1Amount;

              return (
                <Card key={index} className="p-6 border-2 border-purple-200 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Badge className="bg-purple-600 text-white mb-2">
                        Option {index + 1}
                      </Badge>
                      <h3 className="mb-1">Strategic Partnership</h3>
                      <p className="text-gray-600">
                        Combined funding capacity: ${(option.totalCoverage / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Coverage</div>
                      <div className="text-2xl font-bold text-green-600">
                        {((Math.min(option.totalCoverage, startup.budgetNeeded) / startup.budgetNeeded) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Funders in Syndicate */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                          1
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-1">{funder1.name}</h4>
                          <Badge variant="outline" className="text-xs mb-2">
                            {funder1.type.toUpperCase()}
                          </Badge>
                          <p className="text-sm text-gray-600 line-clamp-2">{funder1.bio}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Proposed Amount:</span>
                          <span className="font-medium">${(funder1Amount / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ownership:</span>
                          <span className="font-medium">{calculateSplit(funder1Amount, total)}%</span>
                        </div>
                        <Progress value={parseFloat(calculateSplit(funder1Amount, total))} className="h-2" />
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-purple-50">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                          2
                        </div>
                        <div className="flex-1">
                          <h4 className="mb-1">{funder2.name}</h4>
                          <Badge variant="outline" className="text-xs mb-2">
                            {funder2.type.toUpperCase()}
                          </Badge>
                          <p className="text-sm text-gray-600 line-clamp-2">{funder2.bio}</p>
                        </div>
                      </div>
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Proposed Amount:</span>
                          <span className="font-medium">${(funder2Amount / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Ownership:</span>
                          <span className="font-medium">{calculateSplit(funder2Amount, total)}%</span>
                        </div>
                        <Progress value={parseFloat(calculateSplit(funder2Amount, total))} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {/* Synergy Insights */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="text-green-900">Synergy Benefits</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-green-900">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Complementary industry expertise: {funder1.industries.join(', ')}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-green-900">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Combined network of {funder1.successfulInvestments + funder2.successfulInvestments} portfolio companies</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-green-900">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Diverse investment perspectives ({funder1.type} + {funder2.type})</span>
                      </div>
                    </div>
                  </div>

                  {/* Funding Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Total Investment</div>
                        <div className="text-xl font-bold">${(total / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Your Request</div>
                        <div className="text-xl font-bold">${(startup.budgetNeeded / 1000).toFixed(0)}K</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Coverage</div>
                        <div className="text-xl font-bold text-green-600">
                          {((total / startup.budgetNeeded) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleProposeCoInvestment(option)}
                      className="flex-1 gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Propose This Syndicate
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/investor-brief/${startup.id}`)}
                    >
                      View AI Brief
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Partnership Image */}
        <div className="mt-8 rounded-2xl overflow-hidden shadow-lg">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1549923746-c502d488b3ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGhhbmRzaGFrZSUyMHBhcnRuZXJzaGlwfGVufDF8fHx8MTc3ODg0NTAzMHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Business partnership"
            className="w-full h-[300px] object-cover"
          />
        </div>
      </div>
    </div>
  );
}
