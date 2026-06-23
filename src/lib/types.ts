export type Criterion = { name: string; good: string; bad: string };
export type Rubric = Criterion[];

export type Assessment = {
  title: string;
  rubric: Rubric;
  test_questions: string[];
  interview_questions: string[];
};

export type Role = {
  id: string;
  title: string;
  description_raw: string | null;
  rubric: Rubric | null;
  test_questions: string[] | null;
  interview_questions: string[] | null;
  test_enabled: boolean;
  created_at: string;
};

export type Candidate = {
  id: string;
  role_id: string;
  org_id?: string | null;
  name: string | null;
  status: "invited" | "interviewing" | "completed" | "advanced" | "rejected";
  access_token?: string | null;
  join_code?: string | null;
  token_expires_at?: string | null;
  consent_at?: string | null;
  created_at: string;
};

export type Turn = { role: "agent" | "user"; text: string; t?: number };

export type Transcript = {
  id: string;
  candidate_id: string;
  full_text: string | null;
  turns: Turn[] | null;
  recording_url: string | null;
  created_at: string;
};

export type CriterionVerdict = {
  name: string;
  score: number; // 1-5
  justification: string;
  quotes: string[];
};

export type Verdict = {
  id: string;
  candidate_id: string;
  overall: { summary: string; recommendation: string } | null;
  per_criterion: CriterionVerdict[] | null;
  created_at: string;
};
