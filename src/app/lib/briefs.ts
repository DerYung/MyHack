const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface BriefSource {
  title: string;
  url: string;
}

export interface GeneratedBrief {
  company_uid: string;
  company_name: string;
  summary: string;
  market_analysis: string;
  funding_needs: string;
  compatibility_insights: string[];
  risks: string[];
  generated_at: string;
  web_grounded: boolean;
  sources: BriefSource[];
}

export interface BriefResponse {
  brief: GeneratedBrief;
  generation_time_ms: number;
}

export async function generateBrief(company_uid: string): Promise<BriefResponse> {
  const response = await fetch(`${API_BASE_URL}/api/briefs/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_uid }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }

  return response.json() as Promise<BriefResponse>;
}
