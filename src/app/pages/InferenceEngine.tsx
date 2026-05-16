import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Brain, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCompany } from '../services/firestoreStartupService';

export function InferenceEngine() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    async function fetchBrief() {
      if (!user) return;
      try {
        const company = await getCompany(user.uid);
        // Simulate a call to the Gemini Scorer backend
        setTimeout(() => {
          setExplanation(
            `Our Inference Engine analyzed your profile. Your AI Score is ${company?.ai_score || 85}/100.\n\n` +
            `**Key Factors:**\n` +
            `1. **Market Fit:** Your focus on ${company?.market_goals || 'innovation'} perfectly aligns with current industry trends, boosting your score by 15%.\n` +
            `2. **Mentorship Need:** Your profile shows a clear need for go-to-market strategy, which matches highly with mentors skilled in Product Led Growth.\n` +
            `3. **Funding Stage:** As a ${company?.stage || 'Seed'} startup, you were matched with funders who have a history of successful deployments in this specific tier.`
          );
          setLoading(false);
        }, 1500);
      } catch (e) {
        setLoading(false);
      }
    }
    fetchBrief();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="p-4 flex items-center gap-4 bg-white shadow-sm z-10 sticky top-0">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold flex items-center gap-2"><Brain className="w-6 h-6 text-indigo-600"/> AI Matching Brief</h1>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Gemini is analyzing your matches...</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full bg-white rounded-3xl p-8 shadow-xl border border-indigo-100">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-indigo-500" />
              <h2 className="text-2xl font-black">Your Intelligence Report</h2>
            </div>
            <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
              {explanation}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
