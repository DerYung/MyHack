import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { motion } from "motion/react";
import { Rocket, GraduationCap, Briefcase, ArrowRight, Loader2 } from "lucide-react";

export function OnboardingPage() {
  const { user, userProfile, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [startupData, setStartupData] = useState({ sector: "", stage: "", description: "" });
  const [mentorData, setMentorData] = useState({ industries: "", maxCapacity: 3, region: "" });
  const [funderData, setFunderData] = useState({ investmentFocus: "", stageInterest: "" });

  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (userProfile) {
      // If profile already exists, no need to onboard
      navigate("/dashboard");
    }
  }, [user, userProfile, navigate]);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    try {
      let specificData = {};
      if (role === "Startup") {
        specificData = {
          ...startupData,
          needs: [], // Initialize empty arrays as per PRD
        };
      } else if (role === "Mentor") {
        specificData = {
          ...mentorData,
          industries: mentorData.industries.split(",").map((s) => s.trim()),
          maxCapacity: Number(mentorData.maxCapacity),
          activeCount: 0,
          avgOutcomeRating: 0,
        };
      } else if (role === "Funder") {
        specificData = {
          ...funderData,
          investmentFocus: funderData.investmentFocus.split(",").map((s) => s.trim()),
        };
      }

      await completeOnboarding(role, specificData);
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to complete onboarding", error);
      // Show toast error in real app
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        {step === 1 ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Complete your profile</h1>
              <p className="text-slate-500">How will you be using EcoLink AI?</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <button
                onClick={() => setRole("Startup")}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  role === "Startup" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <Rocket className={`w-8 h-8 mx-auto mb-3 ${role === "Startup" ? "text-blue-600" : "text-slate-400"}`} />
                <h3 className={`font-semibold ${role === "Startup" ? "text-blue-900" : "text-slate-700"}`}>Startup</h3>
              </button>

              <button
                onClick={() => setRole("Mentor")}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  role === "Mentor" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <GraduationCap className={`w-8 h-8 mx-auto mb-3 ${role === "Mentor" ? "text-blue-600" : "text-slate-400"}`} />
                <h3 className={`font-semibold ${role === "Mentor" ? "text-blue-900" : "text-slate-700"}`}>Mentor</h3>
              </button>

              <button
                onClick={() => setRole("Funder")}
                className={`p-6 rounded-xl border-2 text-center transition-all ${
                  role === "Funder" ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <Briefcase className={`w-8 h-8 mx-auto mb-3 ${role === "Funder" ? "text-blue-600" : "text-slate-400"}`} />
                <h3 className={`font-semibold ${role === "Funder" ? "text-blue-900" : "text-slate-700"}`}>Funder</h3>
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!role}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {role === "Startup" && "Tell us about your startup"}
                {role === "Mentor" && "Share your expertise"}
                {role === "Funder" && "Define your investment criteria"}
              </h1>
              <p className="text-slate-500">This helps our AI make the best matches for you.</p>
            </div>

            <div className="space-y-4 mb-8">
              {role === "Startup" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sector / Industry</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FinTech, AgriTech, HealthTech"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={startupData.sector}
                      onChange={(e) => setStartupData({ ...startupData, sector: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Growth Stage</label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={startupData.stage}
                      onChange={(e) => setStartupData({ ...startupData, stage: e.target.value })}
                    >
                      <option value="">Select Stage</option>
                      <option value="Idea">Idea Stage</option>
                      <option value="Pre-seed">Pre-seed</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                      <option value="Series B+">Series B+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brief Description</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="What problem are you solving?"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={startupData.description}
                      onChange={(e) => setStartupData({ ...startupData, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {role === "Mentor" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industries (comma separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B2B SaaS, FinTech, E-commerce"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={mentorData.industries}
                      onChange={(e) => setMentorData({ ...mentorData, industries: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Southeast Asia, Malaysia"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={mentorData.region}
                      onChange={(e) => setMentorData({ ...mentorData, region: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Concurrent Mentorships</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={mentorData.maxCapacity}
                      onChange={(e) => setMentorData({ ...mentorData, maxCapacity: Number(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {role === "Funder" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Investment Focus (comma separated)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ClimateTech, DeepTech"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={funderData.investmentFocus}
                      onChange={(e) => setFunderData({ ...funderData, investmentFocus: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stage Interest</label>
                    <select
                      required
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={funderData.stageInterest}
                      onChange={(e) => setFunderData({ ...funderData, stageInterest: e.target.value })}
                    >
                      <option value="">Select Stage</option>
                      <option value="Pre-seed">Pre-seed</option>
                      <option value="Seed">Seed</option>
                      <option value="Series A">Series A</option>
                      <option value="Series B+">Series B+</option>
                      <option value="All Stages">All Stages</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile"}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
