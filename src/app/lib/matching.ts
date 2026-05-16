import { Startup, Mentor, Funder } from '../types';

// AI-powered mentor matching algorithm
export function matchMentors(startup: Startup, mentors: Mentor[]): Mentor[] {
  return mentors
    .map(mentor => {
      let score = 0;
      
      // Industry alignment (40% weight)
      if (mentor.industries.includes(startup.industry)) {
        score += 40;
      }
      
      // Experience level (30% weight)
      if (mentor.yearsExperience >= 10) {
        score += 30;
      } else if (mentor.yearsExperience >= 5) {
        score += 20;
      }
      
      // Track record (30% weight)
      if (mentor.startupsHelped > 20) {
        score += 30;
      } else if (mentor.startupsHelped > 10) {
        score += 20;
      } else {
        score += 10;
      }
      
      return { ...mentor, matchScore: score };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

// AI-powered funder matching algorithm
export function matchFunders(startup: Startup, funders: Funder[]): Funder[] {
  return funders
    .map(funder => {
      let score = 0;
      
      // Industry alignment (35% weight)
      if (funder.industries.includes(startup.industry)) {
        score += 35;
      }
      
      // Stage alignment (25% weight)
      if (funder.stages.includes(startup.stage)) {
        score += 25;
      }
      
      // Budget fit (30% weight)
      if (startup.budgetNeeded >= funder.minInvestment && startup.budgetNeeded <= funder.maxInvestment) {
        score += 30;
      } else if (startup.budgetNeeded >= funder.minInvestment) {
        score += 15; // Can partially fund
      }
      
      // Track record (10% weight)
      if (funder.successfulInvestments > 40) {
        score += 10;
      } else if (funder.successfulInvestments > 20) {
        score += 7;
      } else {
        score += 5;
      }
      
      return { ...funder, matchScore: score };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

// Generate co-investment recommendations
export function generateCoInvestmentOptions(
  startup: Startup,
  funders: Funder[]
): { funders: Funder[], totalCoverage: number }[] {
  const matchedFunders = matchFunders(startup, funders);
  const options: { funders: Funder[], totalCoverage: number }[] = [];
  
  // Find pairs of funders that can co-invest
  for (let i = 0; i < matchedFunders.length - 1; i++) {
    for (let j = i + 1; j < matchedFunders.length; j++) {
      const funder1 = matchedFunders[i];
      const funder2 = matchedFunders[j];
      
      const maxCombined = funder1.maxInvestment + funder2.maxInvestment;
      if (maxCombined >= startup.budgetNeeded) {
        const totalCoverage = Math.min(maxCombined, startup.budgetNeeded * 1.2);
        options.push({
          funders: [funder1, funder2],
          totalCoverage,
        });
      }
    }
  }
  
  return options.sort((a, b) => b.totalCoverage - a.totalCoverage);
}

// Calculate AI readiness score
export function calculateReadinessScore(startup: Startup): number {
  let score = 0;
  
  // Has mentor (30 points)
  if (startup.mentorId) {
    score += 30;
  }
  
  // Stage progression (25 points)
  const stagePoints = {
    'idea': 10,
    'mvp': 15,
    'early-revenue': 20,
    'growth': 25,
  };
  score += stagePoints[startup.stage];
  
  // Description quality (20 points)
  if (startup.description.length > 100) {
    score += 20;
  } else if (startup.description.length > 50) {
    score += 10;
  }
  
  // Budget planning (25 points)
  if (startup.budgetBreakdown && startup.budgetBreakdown.length > 50) {
    score += 25;
  } else if (startup.budgetBreakdown) {
    score += 15;
  }
  
  return Math.min(score, 100);
}
