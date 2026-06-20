export interface RIASECScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

export interface NCSJob {
  title: string;
  ncs_category: string;
  rating: number; // 1 to 5
  why_fitting: string;
  capabilities: string;
  licenses: string;
  training: string;
}

export interface NCSRecommendationResult {
  riasec_code: string;
  scores: RIASECScores;
  strengths: string;
  hope_job: string;
  edu: string;
  recommendations: NCSJob[];
  message_to_youth: string;
  extracted_from_file: boolean;
}
