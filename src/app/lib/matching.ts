import type { MentorDoc, FunderDoc } from '../types/firestore';
import type { Startup, Funder } from '../types';

export interface ScoredMentor extends MentorDoc {
  matchScore: number;
}

export interface ScoredFunder extends FunderDoc {
  matchScore: number;
}

export interface MatchResponse<T> {
  success: boolean;
  data?: T[];
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetch AI-powered mentor matches from the FastAPI backend.
 * POST /api/match/mentors
 */
export async function matchMentors(company_uid: string): Promise<ScoredMentor[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/match/mentors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company_uid }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Support either direct array response or { data: [...] } wrapper
    const mentors = Array.isArray(data) ? data : (data.mentors || data.data);
    
    if (!Array.isArray(mentors)) {
      throw new Error('Invalid response format: Expected an array of mentors');
    }

    return mentors as ScoredMentor[];
  } catch (error) {
    console.error('Error fetching mentor matches:', error);
    throw error;
  }
}

/**
 * Fetch AI-powered funder matches from the FastAPI backend.
 * POST /api/match/funders
 */
export async function matchFunders(company_uid: string): Promise<ScoredFunder[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/match/funders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company_uid }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Support either direct array response or { data: [...] } wrapper
    const funders = Array.isArray(data) ? data : (data.funders || data.data);

    if (!Array.isArray(funders)) {
      throw new Error('Invalid response format: Expected an array of funders');
    }

    return funders as ScoredFunder[];
  } catch (error) {
    console.error('Error fetching funder matches:', error);
    throw error;
  }
}

// ── Legacy compatibility (used by CoInvestment.tsx) ──────────────────────────

/** Local funder matching for co-investment page (legacy) */
function matchFundersLocal(startup: Startup, funders: Funder[]): Funder[] {
  return funders
    .map(funder => {
      let score = 0;
      if (funder.industries.includes(startup.industry)) score += 35;
      if (funder.stages.includes(startup.stage)) score += 25;
      if (startup.budgetNeeded >= funder.minInvestment && startup.budgetNeeded <= funder.maxInvestment) {
        score += 30;
      } else if (startup.budgetNeeded >= funder.minInvestment) {
        score += 15;
      }
      if (funder.successfulInvestments > 40) score += 10;
      else if (funder.successfulInvestments > 20) score += 7;
      else score += 5;
      return { ...funder, matchScore: score };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

/** Generate co-investment recommendations (legacy — used by CoInvestment.tsx) */
export function generateCoInvestmentOptions(
  startup: Startup,
  funders: Funder[]
): { funders: Funder[]; totalCoverage: number }[] {
  const matched = matchFundersLocal(startup, funders);
  const options: { funders: Funder[]; totalCoverage: number }[] = [];

  for (let i = 0; i < matched.length - 1; i++) {
    for (let j = i + 1; j < matched.length; j++) {
      const f1 = matched[i];
      const f2 = matched[j];
      const maxCombined = f1.maxInvestment + f2.maxInvestment;
      if (maxCombined >= startup.budgetNeeded) {
        options.push({
          funders: [f1, f2],
          totalCoverage: Math.min(maxCombined, startup.budgetNeeded * 1.2),
        });
      }
    }
  }

  return options.sort((a, b) => b.totalCoverage - a.totalCoverage);
}
