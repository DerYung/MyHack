import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Rocket, Sparkles, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';
import { createCompany } from '../services/firestoreStartupService';
import type { CompanyDoc } from '../types/firestore';

const sectors = [
  'CleanTech', 'HealthTech', 'EdTech', 'FinTech', 'AI/ML',
  'SaaS', 'E-commerce', 'BioTech', 'AgriTech', 'PropTech', 'Other'
];

const stages = ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Series B+'] as const;

export function SubmitStartup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sector: '',
    stage: 'Idea' as CompanyDoc['stage'],
    budgetNeeded: '',
    budgetBreakdown: '',
    marketGoals: '',
  });

  const handleNext = () => {
    // Basic validation before moving next
    if (step === 1 && (!formData.name || !formData.description || !formData.sector)) {
      toast.error('Please fill in all required fields to continue.');
      return;
    }
    if (step === 2 && (!formData.stage || !formData.budgetNeeded || !formData.budgetBreakdown)) {
      toast.error('Please fill in all required fields to continue.');
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step !== totalSteps) {
      handleNext();
      return;
    }

    if (!formData.marketGoals) {
      toast.error('Please fill in your market goals.');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit a startup.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createCompany({
        uid: user.uid,
        name: formData.name,
        description: formData.description,
        sector: formData.sector,
        stage: formData.stage,
        budget_needed: parseFloat(formData.budgetNeeded) || 0,
        budget_breakdown: formData.budgetBreakdown,
        market_goals: formData.marketGoals,
        status: 'submitted',
        ai_score: null,
        mentor_uid: null,
      });

      toast.success('Startup submitted successfully! Our AI is analyzing your submission.');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Failed to submit startup:', error);
      toast.error('Failed to submit startup. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Progress animation variants
  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2 mb-2" disabled={isSubmitting}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Rocket className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold">Submit Your Startup Idea</h1>
              <p className="text-gray-500 text-sm">Tell us about your business to get matched</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col items-center">
        {/* Progress Stepper */}
        <div className="w-full max-w-3xl mb-8 relative">
          <div className="flex justify-between items-center relative z-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-300 bg-white ${
                  step === s ? 'border-blue-600 bg-blue-600 text-white' :
                  step > s ? 'border-blue-600 bg-blue-50 text-blue-600' :
                  'border-gray-300 text-gray-400'
                }`}>
                  {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                </div>
                <span className={`text-xs mt-2 font-medium ${step >= s ? 'text-blue-900' : 'text-gray-400'}`}>
                  {s === 1 ? 'Basics' : s === 2 ? 'Financials' : 'Goals'}
                </span>
              </div>
            ))}
          </div>
          {/* Progress Line */}
          <div className="absolute top-5 left-[16.6%] right-[16.6%] h-1 bg-gray-200 z-0 -translate-y-1/2">
             <motion.div 
               className="h-full bg-blue-600"
               initial={{ width: '0%' }}
               animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
               transition={{ duration: 0.3 }}
             />
          </div>
        </div>

        <Card className="w-full max-w-3xl p-6 md:p-10 shadow-lg bg-white overflow-hidden relative border-t-4 border-t-blue-600">
          <form onSubmit={handleSubmit} className="flex flex-col min-h-[420px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6 flex-1"
                >
                  <div>
                    <h2 className="text-2xl font-semibold mb-1 text-gray-800">Company Basics</h2>
                    <p className="text-gray-500 mb-6 text-sm">Let's start with the name and a brief overview.</p>
                  </div>

                  <div>
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., EcoTrack"
                      className="mt-1.5 focus-visible:ring-blue-600"
                      autoFocus
                    />
                  </div>

                  <div>
                    <Label htmlFor="sector">Sector/Industry *</Label>
                    <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                      <SelectTrigger className="mt-1.5 focus:ring-blue-600">
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map(sector => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <Label htmlFor="description">Startup Description *</Label>
                      <span className={`text-xs font-medium ${formData.description.length < 100 ? 'text-amber-500' : 'text-green-600'}`}>
                        {formData.description.length} chars {formData.description.length < 100 && '(aim for 100+)'}
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe your business idea, target market, and unique value proposition..."
                      rows={5}
                      className="resize-none focus-visible:ring-blue-600"
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6 flex-1"
                >
                  <div>
                    <h2 className="text-2xl font-semibold mb-1 text-gray-800">Financials & Stage</h2>
                    <p className="text-gray-500 mb-6 text-sm">Tell us where you are and what you need.</p>
                  </div>

                  <div>
                    <Label className="mb-3 block">Current Stage *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {stages.map((stg) => (
                        <div
                          key={stg}
                          onClick={() => setFormData({ ...formData, stage: stg })}
                          className={`cursor-pointer border rounded-lg p-3 text-center transition-all shadow-sm ${
                            formData.stage === stg
                              ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 text-blue-800 font-medium scale-[1.02]'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-600 hover:scale-[1.02]'
                          }`}
                        >
                          {stg}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="budget">Budget Needed (USD) *</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budgetNeeded}
                        onChange={(e) => setFormData({ ...formData, budgetNeeded: e.target.value })}
                        placeholder="250000"
                        className="pl-8 focus-visible:ring-blue-600 text-lg"
                        min="0"
                        step="1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="breakdown" className="mb-1.5 block">Budget Breakdown *</Label>
                    <Textarea
                      id="breakdown"
                      value={formData.budgetBreakdown}
                      onChange={(e) => setFormData({ ...formData, budgetBreakdown: e.target.value })}
                      placeholder="e.g., Product development: $100k, Marketing: $80k..."
                      rows={4}
                      className="resize-none focus-visible:ring-blue-600"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={formVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6 flex-1"
                >
                  <div>
                    <h2 className="text-2xl font-semibold mb-1 text-gray-800">Goals & Review</h2>
                    <p className="text-gray-500 mb-6 text-sm">Final step before submission.</p>
                  </div>

                  <div>
                    <Label htmlFor="marketGoals" className="mb-1.5 block">Market Goals *</Label>
                    <Textarea
                      id="marketGoals"
                      value={formData.marketGoals}
                      onChange={(e) => setFormData({ ...formData, marketGoals: e.target.value })}
                      placeholder="Describe your 1-year and 3-year market penetration and growth goals..."
                      rows={4}
                      className="resize-none focus-visible:ring-blue-600"
                    />
                  </div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 flex gap-4 items-start shadow-sm mt-8"
                  >
                    <div className="bg-white p-2 rounded-full shadow-sm">
                      <Sparkles className="w-6 h-6 text-blue-600 flex-shrink-0" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 mb-1">AI-Powered Matching</p>
                      <p className="text-blue-800 text-sm leading-relaxed">
                        Once submitted, our AI will analyze your startup and match you with mentors who have expertise in your industry. 
                        After mentorship, we'll generate an investor intelligence brief and connect you with suitable funders.
                      </p>
                    </div>
                  </motion.div>
                  
                  {/* Summary preview */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm mt-4">
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Quick Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-slate-600">
                      <div><span className="font-medium text-slate-900 block">Name:</span> {formData.name}</div>
                      <div><span className="font-medium text-slate-900 block">Sector:</span> {formData.sector}</div>
                      <div><span className="font-medium text-slate-900 block">Stage:</span> {formData.stage}</div>
                      <div><span className="font-medium text-slate-900 block">Budget:</span> ${parseFloat(formData.budgetNeeded || '0').toLocaleString()}</div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4 justify-between items-center">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting} className="min-w-[100px] rounded-full hover:bg-slate-50">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')} disabled={isSubmitting} className="text-slate-500 hover:text-slate-700">
                  Cancel
                </Button>
              )}
              
              <Button type="submit" className="min-w-[130px] rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-transform hover:-translate-y-0.5" disabled={isSubmitting}>
                {isSubmitting ? (
                  'Submitting...'
                ) : step < totalSteps ? (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Submit Startup
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
