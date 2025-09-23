import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function mergeTemplate(text: string, params: Record<string, unknown>): string {
  return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const path = String(key);
    const value = path.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, params);
    return value == null ? "" : String(value);
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { templateId, projectId } = await req.json();
  if (!templateId || !projectId) {
    return NextResponse.json({ error: "templateId and projectId are required" }, { status: 400 });
  }

  const { data: template, error: tErr } = await supabase
    .from("templates")
    .select("id,name,template_text")
    .eq("id", templateId)
    .single();
  if (tErr || !template) return NextResponse.json({ error: tErr?.message || "Template not found" }, { status: 404 });

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id,name,parameters")
    .eq("id", projectId)
    .single();
  if (pErr || !project) return NextResponse.json({ error: pErr?.message || "Project not found" }, { status: 404 });

  const templateText = template.template_text || "";
  const merged = mergeTemplate(templateText, project.parameters || {});

  return NextResponse.json({ preview: { templateName: template.name, projectName: project.name, content: merged } });
}


