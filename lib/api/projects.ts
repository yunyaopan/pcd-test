export interface TenderSubmission {
  id: string;
  schedule_of_rates_no: string;
  trading_partner_reference_no: string;
  supplier_name: string;
  response_no: string;
  schedule_of_rates_description: string | null;
  percentage_adjustment: number | null;
  percentage_sign: string | null;
  entry_date: string | null;
  supplier_remarks: string | null;
}

export interface EvaluationApproach {
  id: string;
  name: string;
  price_percentage: number;
  safety_percentage: number;
  technical_percentage: number;
  technical_criteria: Record<string, string> | null;
}

export interface ProjectDto {
  id: string;
  name: string;
  document_no: string | null;
  reference_no: string | null;
  publication_date: string | null;
  closing_date: string | null;
  description: string | null;
  suppliers_count: number | null;
  status: string | null;
  evaluation_approach_id: string | null;
  tender_submissions: TenderSubmission[] | null;
  evaluation_approaches: EvaluationApproach | null;
  created_at: string;
}

export async function listProjects(): Promise<ProjectDto[]> {
  const res = await fetch("/api/projects", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch projects");
  const json = await res.json();
  return json.projects as ProjectDto[];
}

export async function previewDocument(input: { templateId: string; projectId: string }) {
  const res = await fetch("/api/documents/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to generate preview");
  return res.json();
}


