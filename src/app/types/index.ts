export type UserRole = 'startup' | 'mentor' | 'funder';

export interface Startup {
  id: string;
  name: string;
  description: string;
  industry: string;
  stage: 'idea' | 'mvp' | 'early-revenue' | 'growth';
  budgetNeeded: number;
  budgetBreakdown: string;
  status: 'submitted' | 'mentoring' | 'ready' | 'matched' | 'funded';
  submittedAt: string;
  mentorId?: string;
  aiScore?: number;
  marketPotential?: 'low' | 'medium' | 'high' | 'very-high';
}

export interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  industries: string[];
  yearsExperience: number;
  bio: string;
  matchScore?: number;
  startupsHelped: number;
}

export interface Funder {
  id: string;
  name: string;
  type: 'angel' | 'vc' | 'corporate' | 'grant';
  industries: string[];
  stages: string[];
  minInvestment: number;
  maxInvestment: number;
  bio: string;
  matchScore?: number;
  successfulInvestments: number;
}

export interface InvestorBrief {
  startupId: string;
  summary: string;
  marketAnalysis: string;
  fundingNeeds: string;
  compatibilityInsights: string[];
  recommendedFunders: string[];
  generatedAt: string;
}

export interface CoInvestmentOpportunity {
  id: string;
  startupId: string;
  totalNeeded: number;
  funders: {
    funderId: string;
    amount: number;
    percentage: number;
  }[];
  synergies: string[];
}
