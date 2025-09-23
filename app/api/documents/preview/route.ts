import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import mammoth from "mammoth";

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
    .select("id,name,template_text,storage_path")
    .eq("id", templateId)
    .single();
  if (tErr || !template) return NextResponse.json({ error: tErr?.message || "Template not found" }, { status: 404 });

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id,name,customer_name")
    .eq("id", projectId)
    .single();
  if (pErr || !project) return NextResponse.json({ error: pErr?.message || "Project not found" }, { status: 404 });

  let templateText = template.template_text || "";
  
  // If no template_text but has storage_path, try to read and parse the file
  if (!templateText && template.storage_path) {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("templates")
        .download(template.storage_path);
      
      if (downloadError) {
        return NextResponse.json({ error: `Failed to download file: ${downloadError.message}` }, { status: 500 });
      }
      
      // Convert blob to buffer for mammoth
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Parse Word document using mammoth
      const result = await mammoth.extractRawText({ buffer });
      templateText = result.value;
      
      // If parsing failed or no text extracted, show error
      if (!templateText || templateText.trim() === "") {
        return NextResponse.json({ 
          error: "Could not extract text from the uploaded document. Please ensure it's a valid Word document." 
        }, { status: 400 });
      }
    } catch (error) {
      console.error("Error parsing Word document:", error);
      return NextResponse.json({ 
        error: "Failed to parse Word document. Please ensure it's a valid .docx file." 
      }, { status: 500 });
    }
  }

  const paramObject = { customer: { Name: project.customer_name } } as Record<string, unknown>;
  const merged = mergeTemplate(templateText, paramObject);

  return NextResponse.json({ preview: { templateName: template.name, projectName: project.name, content: merged } });
}


