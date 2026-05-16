import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Rocket, Sparkles } from 'lucide-react';
import { toast } from "sonner";
import { Startup } from '../types';
import { calculateReadinessScore } from '../lib/matching';

export function SubmitStartup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    stage: 'idea' as const,
    budgetNeeded: '',
    budgetBreakdown: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newStartup: Startup = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      industry: formData.industry,
      stage: formData.stage,
      budgetNeeded: parseFloat(formData.budgetNeeded),
      budgetBreakdown: formData.budgetBreakdown,
      status: 'submitted',
      submittedAt: new Date().toISOString().split('T')[0],
    };

    // Calculate AI score
    newStartup.aiScore = calculateReadinessScore(newStartup);

    // Save to localStorage
    const existing = localStorage.getItem('customStartups');
    const startups = existing ? JSON.parse(existing) : [];
    startups.push(newStartup);
    localStorage.setItem('customStartups', JSON.stringify(startups));

    toast.success('Startup submitted successfully! Our AI is analyzing your submission.');
    
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const industries = [
    'CleanTech',
    'HealthTech',
    'EdTech',
    'FinTech',
    'AI/ML',
    'SaaS',
    'E-commerce',
    'BioTech',
    'AgriTech',
    'PropTech',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-blue-600" />
            <div>
              <h1>Submit Your Startup Idea</h1>
              <p className="text-gray-600">Tell us about your business and get matched with the right mentor</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Startup Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., EcoTrack"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your business idea, target market, and unique value proposition..."
                  rows={4}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length} characters (recommended: 100+)
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stage">Current Stage *</Label>
                  <Select value={formData.stage} onValueChange={(value: any) => setFormData({ ...formData, stage: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea Stage</SelectItem>
                      <SelectItem value="mvp">MVP/Prototype</SelectItem>
                      <SelectItem value="early-revenue">Early Revenue</SelectItem>
                      <SelectItem value="growth">Growth Stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="budget">Estimated Budget Needed (USD) *</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budgetNeeded}
                  onChange={(e) => setFormData({ ...formData, budgetNeeded: e.target.value })}
                  placeholder="e.g., 250000"
                  min="0"
                  step="1000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="breakdown">Budget Breakdown *</Label>
                <Textarea
                  id="breakdown"
                  value={formData.budgetBreakdown}
                  onChange={(e) => setFormData({ ...formData, budgetBreakdown: e.target.value })}
                  placeholder="e.g., Product development: $100k, Marketing: $80k, Operations: $70k"
                  rows={3}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Provide a detailed breakdown of how you plan to use the funds
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">AI-Powered Matching</p>
                  <p className="text-blue-700">
                    Once submitted, our AI will analyze your startup and match you with mentors who have expertise in your industry. 
                    After mentorship, we'll generate an investor intelligence brief and connect you with suitable funders.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2">
                  <Rocket className="w-4 h-4" />
                  Submit Startup
                </Button>
              </div>
            </form>
          </Card>

          {/* Preview Card */}
          {formData.name && (
            <Card className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="mb-4">Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Startup Name:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry:</span>
                  <span className="font-medium">{formData.industry || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stage:</span>
                  <span className="font-medium capitalize">{formData.stage.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">
                    {formData.budgetNeeded ? `$${parseFloat(formData.budgetNeeded).toLocaleString()}` : 'Not specified'}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
