export interface ProjectDto {
  id: string;
  name: string;
  parameters: Record<string, unknown> | null;
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


