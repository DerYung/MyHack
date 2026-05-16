const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface GeneratedBrief {
  company_uid: string;
  company_name: string;
  summary: string;
  market_analysis: string;
  funding_needs: string;
  compatibility_insights: string[];
  risks: string[];
  generated_at: string;
}

export interface BriefResponse {
  brief: GeneratedBrief;
  generation_time_ms: number;
}

/**
 * Fetch an AI-generated investor brief from the FastAPI backend.
 * POST /api/briefs/generate
 */
export async function generateBrief(company_uid: string): Promise<BriefResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/briefs/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company_uid }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Backend returned 500:", errText);
      throw new Error(`HTTP error! status: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data as BriefResponse;
  } catch (error) {
    console.error('Error generating AI brief:', error);
    throw error;
  }
}
