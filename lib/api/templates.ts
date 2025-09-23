export interface TemplateDto {
  id: string;
  name: string;
  storage_path: string | null;
  template_text: string | null;
  created_at: string;
}

export async function listTemplates(): Promise<TemplateDto[]> {
  const res = await fetch("/api/templates", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch templates");
  const json = await res.json();
  return json.templates as TemplateDto[];
}

export async function uploadTemplate(input: { name: string; file?: File; template_text?: string }) {
  const form = new FormData();
  form.set("name", input.name);
  if (input.file) form.set("file", input.file);
  if (input.template_text) form.set("template_text", input.template_text);
  const res = await fetch("/api/templates", { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to upload template");
  return res.json();
}


