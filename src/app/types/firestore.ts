/**
 * Firestore Document Types — Person B owns this file.
 * Everyone else IMPORTS from here. Nobody else edits it.
 *
 * All field names are snake_case to match Firestore conventions.
 */
import { Timestamp } from "firebase/firestore";

// ─── DS1: Companies ─────────────────────────────────────────────────────────
export interface CompanyDoc {
  uid: string;
  name: string;
  description: string;
  sector: string;
  stage: "Idea" | "Pre-seed" | "Seed" | "Series A" | "Series B+";
  region: string;
  budget_needed: number;
  budget_breakdown: string;
  market_goals: string;
  status: "submitted" | "mentoring" | "ready" | "matched" | "funded";
  ai_score: number | null;
  mentor_uid: string | null;
  created_at: Timestamp | number;
  updated_at: Timestamp | number;
}

// ─── DS2: Mentors ────────────────────────────────────────────────────────────
export interface MentorDoc {
  uid: string;
  name: string;
  email: string;
  industries: string[];
  expertise: string[];
  region: string;
  max_capacity: number;
  active_count: number;
  bio: string;
  years_experience: number;
  startups_helped: number;
  avg_outcome_rating: number;
  created_at: Timestamp | number;
  updated_at: Timestamp | number;
}

// ─── DS3: Funders ────────────────────────────────────────────────────────────
export interface FunderDoc {
  uid: string;
  name: string;
  email: string;
  investment_focus: string[];
  stage_interest: string[];
  min_investment: number;
  max_investment: number;
  region: string;
  bio: string;
  portfolio: string[];
  successful_investments: number;
  created_at: Timestamp | number;
  updated_at: Timestamp | number;
}

// ─── DS4: Linkages ───────────────────────────────────────────────────────────
export interface LinkageDoc {
  id: string;
  type: "mentor-matching" | "funder-syndication";
  mentor_uid: string;
  company_uid: string;
  funder_uid: string;
  programme_id: string;
  status: "pending_approval" | "active" | "completed" | "rejected" | "terminated";
  outcome_rating: number | null;
  match_score: number | null;
  reasoning: string;
  notes: string;
  created_at: Timestamp | number;
  updated_at: Timestamp | number;
}

// ─── DS5: Health Events ──────────────────────────────────────────────────────
export interface HealthEventDoc {
  id: string;
  event_type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  metadata: Record<string, any>;
  created_at: Timestamp | number;
}

// ─── DS6: Intel Briefs ───────────────────────────────────────────────────────
export interface IntelBriefDoc {
  id: string;
  company_uid: string;
  summary: string;
  market_analysis: string;
  funding_needs: string;
  compatibility_insights: string[];
  recommended_funder_uids: string[];
  generated_at: Timestamp | number;
}

// ─── Users (Auth) ────────────────────────────────────────────────────────────
export interface UserDoc {
  uid: string;
  email: string | null;
  role: "Startup" | "Mentor" | "Funder" | "Admin";
  display_name: string | null;
  photo_url: string | null;
  created_at: number;
}
