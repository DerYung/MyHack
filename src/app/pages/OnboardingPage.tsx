import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { motion } from "motion/react";
import { Rocket, GraduationCap, Briefcase, ArrowRight, Loader2 } from "lucide-react";
import { TagsInput } from "../components/ui/tags-input";
import { StepperInput } from "../components/ui/stepper-input";

export function OnboardingPage() {
  const { user, userProfile, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [startupData, setStartupData] = useState({ sector: "", stage: "", description: "" });
  const [mentorData, setMentorData] = useState({
    industries: [] as string[],
    expertise: [] as string[],
    maxCapacity: 3,
    region: "",
    yearsExperience: 0,
    bio: "",
  });
  const [funderData, setFunderData] = useState({
    investmentFocus: [] as string[],
    stageInterest: "",
    minInvestment: 0,
    maxInvestment: 0,
    region: "Malaysia",
    bio: "",
    portfolio: [] as string[],
  });

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
      let specificData: Record<string, unknown> = {};
      if (role === "Startup") {
        specificData = {
          sector: startupData.sector,
          stage: startupData.stage,
          description: startupData.description,
          region: "Malaysia",
          budget_needed: 0,
          budget_breakdown: "",
          market_goals: "",
          status: "submitted",
          ai_score: null,
          mentor_uid: null,
          is_approved: false,
        };
      } else if (role === "Mentor") {
        specificData = {
          industries: mentorData.industries,
          expertise: mentorData.expertise,
          region: mentorData.region,
          max_capacity: mentorData.maxCapacity,
          active_count: 0,
          bio: mentorData.bio,
          years_experience: mentorData.yearsExperience,
          startups_helped: 0,
          avg_outcome_rating: 0,
          is_approved: false,
        };
      } else if (role === "Funder") {
        specificData = {
          investment_focus: funderData.investmentFocus,
          stage_interest: funderData.stageInterest ? [funderData.stageInterest] : [],
          min_investment: funderData.minInvestment,
          max_investment: funderData.maxInvestment,
          region: funderData.region,
          bio: funderData.bio,
          portfolio: funderData.portfolio,
          successful_investments: 0,
          is_approved: false,
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industries</label>
                    <TagsInput
                      tags={mentorData.industries}
                      onChange={(tags) => setMentorData({ ...mentorData, industries: tags })}
                      placeholder="e.g. B2B SaaS, FinTech, E-commerce (Press Enter)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Skills / Expertise</label>
                    <TagsInput
                      tags={mentorData.expertise}
                      onChange={(tags) => setMentorData({ ...mentorData, expertise: tags })}
                      placeholder="e.g. Product Strategy, Go-to-Market (Press Enter)"
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Years of Experience</label>
                      <StepperInput
                        value={mentorData.yearsExperience}
                        onChange={(val) => setMentorData({ ...mentorData, yearsExperience: val })}
                        min={0}
                        max={60}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Max Concurrent Mentorships</label>
                      <StepperInput
                        value={mentorData.maxCapacity}
                        onChange={(val) => setMentorData({ ...mentorData, maxCapacity: val })}
                        min={1}
                        max={10}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Short Bio</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="What kind of founder do you love working with? Any signature wins?"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={mentorData.bio}
                      onChange={(e) => setMentorData({ ...mentorData, bio: e.target.value })}
                    />
                  </div>
                </>
              )}

              {role === "Funder" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Investment Focus</label>
                    <TagsInput
                      tags={funderData.investmentFocus}
                      onChange={(tags) => setFunderData({ ...funderData, investmentFocus: tags })}
                      placeholder="e.g. ClimateTech, DeepTech (Press Enter)"
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Min Investment (USD)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        step={1000}
                        placeholder="e.g. 50000"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={funderData.minInvestment}
                        onChange={(e) => setFunderData({ ...funderData, minInvestment: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Max Investment (USD)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        step={1000}
                        placeholder="e.g. 500000"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={funderData.maxInvestment}
                        onChange={(e) => setFunderData({ ...funderData, maxInvestment: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Southeast Asia, Malaysia"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={funderData.region}
                      onChange={(e) => setFunderData({ ...funderData, region: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notable Portfolio (optional)</label>
                    <TagsInput
                      tags={funderData.portfolio}
                      onChange={(tags) => setFunderData({ ...funderData, portfolio: tags })}
                      placeholder="e.g. Grab, Carsome, Carousell (Press Enter)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Short Bio</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Tell startups about your fund, thesis, or what makes you a great partner."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={funderData.bio}
                      onChange={(e) => setFunderData({ ...funderData, bio: e.target.value })}
                    />
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
            {(role === "Mentor" || role === "Funder") && (
              <p className="mt-6 text-center text-sm text-slate-500 bg-blue-50 py-3 px-4 rounded-lg border border-blue-100">
                <strong className="text-blue-800">Note:</strong> Your profile will be placed in a <strong>Verification Pending</strong> state until reviewed by an administrator.
              </p>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
}
